import { NextResponse, type NextRequest } from "next/server";
import type { UserRole } from "@/types";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";

type FreshnessRiskLevel = "low" | "medium" | "high";

interface AnalyzeDonationBody {
  foodName?: string;
  description?: string;
  availableTill?: string;
}

interface DonationAiAnalysis {
  freshnessRiskLevel: FreshnessRiskLevel;
  pickupPriorityScore: number;
  reason: string;
}

function clampPriorityScore(score: number): number {
  return Math.min(5, Math.max(1, Math.round(score)));
}

function normalizeRiskLevel(value: unknown): FreshnessRiskLevel {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return "medium";
}

function extractJsonFromText(text: string): string {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  return text.trim();
}

function heuristicAnalysis(
  description: string,
  availableTillDate: Date,
): DonationAiAnalysis {
  const now = new Date();
  const hoursRemaining = (availableTillDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const normalizedDescription = description.toLowerCase();
  const highRiskKeywords = ["meat", "fish", "seafood", "milk", "dairy", "egg", "cream"];
  const mediumRiskKeywords = ["cooked", "rice", "gravy", "curry", "paneer"];

  let riskScore = 1;

  if (hoursRemaining <= 4) {
    riskScore += 3;
  } else if (hoursRemaining <= 10) {
    riskScore += 2;
  } else if (hoursRemaining <= 24) {
    riskScore += 1;
  }

  if (highRiskKeywords.some((keyword) => normalizedDescription.includes(keyword))) {
    riskScore += 2;
  } else if (mediumRiskKeywords.some((keyword) => normalizedDescription.includes(keyword))) {
    riskScore += 1;
  }

  let freshnessRiskLevel: FreshnessRiskLevel = "low";
  let pickupPriorityScore = 2;

  if (riskScore >= 5) {
    freshnessRiskLevel = "high";
    pickupPriorityScore = 5;
  } else if (riskScore >= 3) {
    freshnessRiskLevel = "medium";
    pickupPriorityScore = 4;
  } else {
    freshnessRiskLevel = "low";
    pickupPriorityScore = 2;
  }

  if (hoursRemaining > 48 && pickupPriorityScore > 1) {
    pickupPriorityScore -= 1;
  }

  return {
    freshnessRiskLevel,
    pickupPriorityScore: clampPriorityScore(pickupPriorityScore),
    reason: "Rule-based fallback used due to unavailable AI response.",
  };
}

async function callGeminiAnalysis(
  body: AnalyzeDonationBody,
  availableTillDate: Date,
): Promise<DonationAiAnalysis | null> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const modelCandidates = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
  ];

  const prompt = [
    "You are a food donation risk triage assistant.",
    "Analyze food freshness risk only from description and availableTill time.",
    `Food name: ${body.foodName ?? "N/A"}`,
    `Description: ${body.description ?? ""}`,
    `availableTill ISO: ${body.availableTill}`,
    `Current server ISO: ${new Date().toISOString()}`,
    "",
    "Return ONLY strict JSON with keys:",
    '{ "freshnessRiskLevel":"low|medium|high", "pickupPriorityScore":1-5, "reason":"short reason <= 140 chars" }',
  ].join("\n");

  for (const model of modelCandidates) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              topP: 0.9,
              maxOutputTokens: 200,
            },
          }),
        },
      );

      if (!response.ok) {
        continue;
      }

      const payload = (await response.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };

      const text =
        payload.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? "")
          .join("")
          .trim() ?? "";

      if (!text) {
        continue;
      }

      const jsonText = extractJsonFromText(text);
      const parsed = JSON.parse(jsonText) as {
        freshnessRiskLevel?: string;
        pickupPriorityScore?: number;
        reason?: string;
      };

      const priority = clampPriorityScore(Number(parsed.pickupPriorityScore));
      const reason =
        typeof parsed.reason === "string" && parsed.reason.trim().length > 0
          ? parsed.reason.trim().slice(0, 140)
          : `AI analyzed with model ${model}.`;

      return {
        freshnessRiskLevel: normalizeRiskLevel(parsed.freshnessRiskLevel),
        pickupPriorityScore: priority,
        reason,
      };
    } catch {
      continue;
    }
  }

  // Model not available or parsing failed.
  const fallback = heuristicAnalysis(body.description ?? "", availableTillDate);
  return {
    ...fallback,
    reason: "AI unavailable. Fallback scoring applied.",
  };
}

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("fb_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(decoded.uid).get();
    const role = (userDoc.data()?.role as UserRole | undefined) ?? null;

    if (!role || (role !== "restaurant" && role !== "admin")) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json()) as AnalyzeDonationBody;
    const description = body.description?.trim() ?? "";
    const availableTill = body.availableTill?.trim() ?? "";

    if (!description || !availableTill) {
      return NextResponse.json(
        { message: "description and availableTill are required." },
        { status: 400 },
      );
    }

    const availableTillDate = new Date(availableTill);

    if (Number.isNaN(availableTillDate.getTime())) {
      return NextResponse.json({ message: "Invalid availableTill datetime." }, { status: 400 });
    }

    const heuristic = heuristicAnalysis(description, availableTillDate);
    const aiResult = await callGeminiAnalysis(body, availableTillDate);

    const result = aiResult ?? heuristic;

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        freshnessRiskLevel: "medium",
        pickupPriorityScore: 3,
        reason: "AI failed. Fallback scoring applied.",
      } satisfies DonationAiAnalysis,
      { status: 200 },
    );
  }
}
