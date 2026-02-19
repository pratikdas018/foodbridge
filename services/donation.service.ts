"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { createNotification } from "@/services/notification.service";
import type {
  AddDonationPayload,
  Donation,
  FreshnessRiskLevel,
  DonationStatus,
} from "@/types";

interface AddDonationOptions {
  onMediaUploadProgress?: (payload: {
    uploadKind: "image" | "video";
    percentage: number;
  }) => void;
}

interface CloudinaryUploadResponse {
  secureUrl: string;
  message?: string;
}

interface DonationAiAnalysisResponse {
  freshnessRiskLevel: FreshnessRiskLevel;
  pickupPriorityScore: number;
  reason: string;
}

function normalizeRiskLevel(value: unknown): FreshnessRiskLevel {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return "medium";
}

function normalizePriorityScore(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numeric)) {
    return 3;
  }

  return Math.min(5, Math.max(1, Math.round(numeric)));
}

async function analyzeDonationWithAi(
  payload: Pick<AddDonationPayload, "foodName" | "description" | "availableTill">,
): Promise<DonationAiAnalysisResponse> {
  const response = await fetch("/api/ai/analyze-donation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      foodName: payload.foodName,
      description: payload.description,
      availableTill: payload.availableTill,
    }),
  });

  if (!response.ok) {
    throw new Error("AI analysis request failed.");
  }

  const analysis = (await response.json()) as Partial<DonationAiAnalysisResponse>;

  return {
    freshnessRiskLevel: normalizeRiskLevel(analysis.freshnessRiskLevel),
    pickupPriorityScore: normalizePriorityScore(analysis.pickupPriorityScore),
    reason:
      typeof analysis.reason === "string" && analysis.reason.trim().length > 0
        ? analysis.reason.trim()
        : "AI analysis completed.",
  };
}

function mapDonationDoc(document: QueryDocumentSnapshot<DocumentData>): Donation {
  const data = document.data();
  const rawStatus = data.status as string | undefined;
  const status = rawStatus === "picked" ? "completed" : rawStatus;

  return {
    id: document.id,
    restaurantId: data.restaurantId,
    foodName: data.foodName,
    quantity: data.quantity,
    address: data.address,
    latitude: typeof data.latitude === "number" ? data.latitude : null,
    longitude: typeof data.longitude === "number" ? data.longitude : null,
    description: data.description,
    freshnessRiskLevel: normalizeRiskLevel(data.freshnessRiskLevel),
    pickupPriorityScore: normalizePriorityScore(data.pickupPriorityScore),
    aiAnalysisReason: data.aiAnalysisReason ?? "",
    imageUrl: data.imageUrl ?? "",
    videoUrl: data.videoUrl ?? "",
    proofImageUrl: data.proofImageUrl ?? "",
    availableTill: (data.availableTill as Timestamp | undefined) ?? null,
    status: (status as DonationStatus) ?? "available",
    completedAt: (data.completedAt as Timestamp | undefined) ?? null,
    createdAt: (data.createdAt as Timestamp | undefined) ?? null,
  };
}

function sortByCreatedAtDesc(items: Donation[]): Donation[] {
  return [...items].sort((a, b) => {
    const aSec = a.createdAt?.seconds ?? 0;
    const bSec = b.createdAt?.seconds ?? 0;
    return bSec - aSec;
  });
}

async function uploadDonationMedia(
  file: File,
  uploadKind: "image" | "video",
  restaurantId: string,
  onProgress?: (payload: {
    uploadKind: "image" | "video";
    percentage: number;
  }) => void,
): Promise<string> {
  onProgress?.({ uploadKind, percentage: 10 });

  const formData = new FormData();
  formData.append("file", file);
  formData.append("uploadKind", uploadKind);
  formData.append("restaurantId", restaurantId);

  const response = await fetch("/api/upload/cloudinary", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as CloudinaryUploadResponse;

  if (!response.ok || !payload.secureUrl) {
    throw new Error(payload.message ?? `${uploadKind} upload failed.`);
  }

  onProgress?.({ uploadKind, percentage: 100 });
  return payload.secureUrl;
}

export async function addDonation(
  restaurantId: string,
  payload: AddDonationPayload,
  options?: AddDonationOptions,
): Promise<void> {
  const db = getClientDb();
  let imageUrl = "";
  let videoUrl = "";
  let aiAnalysis: DonationAiAnalysisResponse = {
    freshnessRiskLevel: "medium",
    pickupPriorityScore: 3,
    reason: "AI analysis unavailable. Default scoring applied.",
  };

  if (payload.imageFile) {
    imageUrl = await uploadDonationMedia(
      payload.imageFile,
      "image",
      restaurantId,
      options?.onMediaUploadProgress,
    );
  }

  if (payload.videoFile) {
    videoUrl = await uploadDonationMedia(
      payload.videoFile,
      "video",
      restaurantId,
      options?.onMediaUploadProgress,
    );
  }

  try {
    aiAnalysis = await analyzeDonationWithAi({
      foodName: payload.foodName,
      description: payload.description,
      availableTill: payload.availableTill,
    });
  } catch (error) {
    console.warn("AI donation analysis failed. Falling back to defaults.", error);
  }

  const donationRef = await addDoc(collection(db, COLLECTIONS.DONATIONS), {
    restaurantId,
    foodName: payload.foodName,
    quantity: payload.quantity,
    address: payload.address,
    latitude: payload.latitude,
    longitude: payload.longitude,
    description: payload.description,
    freshnessRiskLevel: aiAnalysis.freshnessRiskLevel,
    pickupPriorityScore: aiAnalysis.pickupPriorityScore,
    aiAnalysisReason: aiAnalysis.reason,
    imageUrl,
    videoUrl,
    proofImageUrl: "",
    availableTill: Timestamp.fromDate(new Date(payload.availableTill)),
    status: "available",
    completedAt: null,
    createdAt: serverTimestamp(),
  });

  try {
    await createNotification({
      recipientKey: "role:ngo",
      donationId: donationRef.id,
      type: "new_donation",
      title: "New Food Donation Available",
      message: `${payload.foodName} is available for pickup at ${payload.address}.`,
    });
  } catch (error) {
    // Keep donation creation successful even if notification write fails.
    console.warn("Notification write failed after donation creation.", error);
  }
}

export function subscribeRestaurantDonations(
  restaurantId: string,
  onChange: (donations: Donation[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const db = getClientDb();
  const donationsQuery = query(
    collection(db, COLLECTIONS.DONATIONS),
    where("restaurantId", "==", restaurantId),
  );

  return onSnapshot(
    donationsQuery,
    (snapshot) => {
      const donations = snapshot.docs.map(mapDonationDoc);
      onChange(sortByCreatedAtDesc(donations));
    },
    (error) => onError?.(error),
  );
}

export function subscribeAvailableDonations(
  onChange: (donations: Donation[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const db = getClientDb();
  const donationsQuery = query(
    collection(db, COLLECTIONS.DONATIONS),
    where("status", "==", "available"),
  );

  return onSnapshot(
    donationsQuery,
    (snapshot) => {
      const donations = snapshot.docs.map(mapDonationDoc);
      const sorted = [...donations].sort((a, b) => {
        if (b.pickupPriorityScore !== a.pickupPriorityScore) {
          return b.pickupPriorityScore - a.pickupPriorityScore;
        }

        const aExpirySec = a.availableTill?.seconds ?? Number.MAX_SAFE_INTEGER;
        const bExpirySec = b.availableTill?.seconds ?? Number.MAX_SAFE_INTEGER;

        if (aExpirySec !== bExpirySec) {
          return aExpirySec - bExpirySec;
        }

        const aCreatedSec = a.createdAt?.seconds ?? 0;
        const bCreatedSec = b.createdAt?.seconds ?? 0;

        return bCreatedSec - aCreatedSec;
      });

      onChange(sorted);
    },
    (error) => onError?.(error),
  );
}

export function subscribeAllDonations(
  onChange: (donations: Donation[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const db = getClientDb();
  return onSnapshot(
    collection(db, COLLECTIONS.DONATIONS),
    (snapshot) => {
      const donations = snapshot.docs.map(mapDonationDoc);
      onChange(sortByCreatedAtDesc(donations));
    },
    (error) => onError?.(error),
  );
}

export async function fetchDonationsByIds(
  donationIds: string[],
): Promise<Record<string, Donation>> {
  const db = getClientDb();
  const uniqueIds = Array.from(new Set(donationIds));
  const lookup: Record<string, Donation> = {};

  await Promise.all(
    uniqueIds.map(async (donationId) => {
      const donationSnap = await getDoc(doc(db, COLLECTIONS.DONATIONS, donationId));

      if (!donationSnap.exists()) {
        return;
      }

      const data = donationSnap.data();
      const rawStatus = data.status as string | undefined;
      const status = rawStatus === "picked" ? "completed" : rawStatus;

      lookup[donationId] = {
        id: donationSnap.id,
        restaurantId: data.restaurantId,
        foodName: data.foodName,
        quantity: data.quantity,
        address: data.address,
        latitude: typeof data.latitude === "number" ? data.latitude : null,
        longitude: typeof data.longitude === "number" ? data.longitude : null,
        description: data.description,
        freshnessRiskLevel: normalizeRiskLevel(data.freshnessRiskLevel),
        pickupPriorityScore: normalizePriorityScore(data.pickupPriorityScore),
        aiAnalysisReason: data.aiAnalysisReason ?? "",
        imageUrl: data.imageUrl ?? "",
        videoUrl: data.videoUrl ?? "",
        proofImageUrl: data.proofImageUrl ?? "",
        availableTill: (data.availableTill as Timestamp | undefined) ?? null,
        status: (status as DonationStatus) ?? "available",
        completedAt: (data.completedAt as Timestamp | undefined) ?? null,
        createdAt: (data.createdAt as Timestamp | undefined) ?? null,
      };
    }),
  );

  return lookup;
}

export async function updateDonationStatus(
  donationId: string,
  status: DonationStatus,
): Promise<void> {
  const db = getClientDb();
  await updateDoc(doc(db, COLLECTIONS.DONATIONS, donationId), { status });
}

export async function deleteDonationById(donationId: string): Promise<void> {
  const db = getClientDb();
  await deleteDoc(doc(db, COLLECTIONS.DONATIONS, donationId));
}
