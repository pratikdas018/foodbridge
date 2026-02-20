import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const payloadSchema = z.object({
  featureTitle: z.string().trim().min(3).max(140),
  featureDescription: z.string().trim().min(10).max(2000),
});

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface AnnouncementEmail {
  subject: string;
  body: string;
}

function createFallbackAnnouncementEmail(
  featureTitle: string,
  featureDescription: string,
): AnnouncementEmail {
  return {
    subject: `New Update from FoodBridge: ${featureTitle}`.slice(0, 150),
    body: [
      "Hello,",
      "",
      "We are excited to share a new update on the FoodBridge platform.",
      "",
      `Feature: ${featureTitle}`,
      "",
      featureDescription,
      "",
      "This improvement is designed to make donation coordination smoother for restaurants and NGOs.",
      "",
      "Stay connected with FoodBridge to reduce food waste.",
      "",
      "Regards,",
      "FoodBridge Team",
    ].join("\n"),
  };
}

function extractSubjectBodyFromPlainText(text: string): AnnouncementEmail | null {
  const subjectMatch = text.match(/subject\s*:\s*(.+)/i);
  const bodyMatch = text.match(/body\s*:\s*([\s\S]+)/i);

  if (!subjectMatch || !bodyMatch) {
    return null;
  }

  const subject = subjectMatch[1]?.trim() ?? "";
  const body = bodyMatch[1]?.trim() ?? "";

  if (!subject || !body) {
    return null;
  }

  return {
    subject: subject.slice(0, 150),
    body: body.slice(0, 4000),
  };
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

function normalizeAnnouncementEmail(value: Partial<AnnouncementEmail>): AnnouncementEmail {
  const subject = typeof value.subject === "string" ? value.subject.trim() : "";
  const body = typeof value.body === "string" ? value.body.trim() : "";

  if (!subject || !body) {
    throw new Error("Gemini returned invalid email format.");
  }

  return {
    subject: subject.slice(0, 150),
    body: body.slice(0, 4000),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message ?? "Invalid request payload.";
      return NextResponse.json({ message: issue }, { status: 400 });
    }

    const { featureTitle, featureDescription } = parsed.data;
    const fallback = createFallbackAnnouncementEmail(featureTitle, featureDescription);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(fallback);
    }

    const prompt = [
      "Write a professional product update email for FoodBridge users announcing a new feature.",
      "",
      `Feature Title:\n${featureTitle}`,
      "",
      `Feature Description:\n${featureDescription}`,
      "",
      "Generate:",
      "1. Email Subject",
      "2. Email Body",
      "",
      "Keep the tone friendly, professional and informative.",
      "Do not make it too long.",
      "End with:",
      "Regards,",
      "FoodBridge Team",
      "",
      "Return ONLY strict JSON in this exact shape:",
      '{"subject":"...","body":"..."}',
    ].join("\n");

    const modelCandidates = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-latest"];

    for (const model of modelCandidates) {
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
              temperature: 0.4,
              topP: 0.9,
              maxOutputTokens: 500,
            },
          }),
        },
      );

      if (!response.ok) {
        continue;
      }

      const geminiPayload = (await response.json()) as GeminiResponse;
      const text =
        geminiPayload.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? "")
          .join("")
          .trim() ?? "";

      if (!text) {
        continue;
      }

      try {
        const jsonText = extractJsonFromText(text);
        const parsedJson = JSON.parse(jsonText) as Partial<AnnouncementEmail>;
        const normalized = normalizeAnnouncementEmail(parsedJson);

        return NextResponse.json(normalized);
      } catch {
        const plainTextResult = extractSubjectBodyFromPlainText(text);

        if (plainTextResult) {
          return NextResponse.json(plainTextResult);
        }
      }
    }

    return NextResponse.json(fallback);
  } catch (error) {
    const parsed = payloadSchema.safeParse(await request.json().catch(() => ({})));

    if (parsed.success) {
      return NextResponse.json(
        createFallbackAnnouncementEmail(
          parsed.data.featureTitle,
          parsed.data.featureDescription,
        ),
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to generate announcement email.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
