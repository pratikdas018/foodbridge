"use client";

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { createNotification } from "@/services/notification.service";
import type { Claim, PickupStatus } from "@/types";

interface CloudinaryUploadResponse {
  secureUrl: string;
  message?: string;
}

interface UpdateClaimStatusOptions {
  proofImageFile?: File | null;
}

function mapClaimDoc(document: QueryDocumentSnapshot<DocumentData>): Claim {
  const data = document.data();
  const rawPickupStatus = data.pickupStatus as string | undefined;
  const pickupStatus = rawPickupStatus === "pending" ? "claimed" : rawPickupStatus;

  return {
    id: document.id,
    donationId: data.donationId,
    ngoId: data.ngoId,
    claimedAt: (data.claimedAt as Timestamp | undefined) ?? null,
    pickupStatus: (pickupStatus as PickupStatus) ?? "claimed",
    proofImageUrl: data.proofImageUrl ?? "",
    completedAt: (data.completedAt as Timestamp | undefined) ?? null,
  };
}

function sortByClaimedAtDesc(items: Claim[]): Claim[] {
  return [...items].sort((a, b) => {
    const aSec = a.claimedAt?.seconds ?? 0;
    const bSec = b.claimedAt?.seconds ?? 0;
    return bSec - aSec;
  });
}

function logNotificationWriteResults(
  context: string,
  results: PromiseSettledResult<void>[],
) {
  for (const result of results) {
    if (result.status === "rejected") {
      console.warn(`Notification write failed: ${context}`, result.reason);
    }
  }
}

async function uploadProofImage(file: File, ngoId: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("uploadKind", "image");
  formData.append("restaurantId", ngoId);

  const response = await fetch("/api/upload/cloudinary", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as CloudinaryUploadResponse;

  if (!response.ok || !payload.secureUrl) {
    throw new Error(payload.message ?? "Proof image upload failed.");
  }

  return payload.secureUrl;
}

export async function claimDonation(
  donationId: string,
  ngoId: string,
): Promise<void> {
  const db = getClientDb();
  const ngoRef = doc(db, COLLECTIONS.USERS, ngoId);
  const donationRef = doc(db, COLLECTIONS.DONATIONS, donationId);
  const claimRef = doc(collection(db, COLLECTIONS.CLAIMS));

  await runTransaction(db, async (transaction) => {
    const ngoSnapshot = await transaction.get(ngoRef);

    if (!ngoSnapshot.exists()) {
      throw new Error("NGO profile does not exist.");
    }

    const ngoData = ngoSnapshot.data();

    if (ngoData.role !== "ngo") {
      throw new Error("Only NGOs can claim donations.");
    }

    if (ngoData.isVerified !== true) {
      throw new Error("NGO verification is pending or rejected. Contact admin.");
    }

    if (ngoData.availabilityStatus === "busy") {
      throw new Error("Set your NGO status to Available before claiming donations.");
    }

    const donationSnapshot = await transaction.get(donationRef);

    if (!donationSnapshot.exists()) {
      throw new Error("Donation does not exist.");
    }

    const donationData = donationSnapshot.data();

    if (donationData.status !== "available") {
      throw new Error("Donation has already been claimed.");
    }

    transaction.update(donationRef, {
      status: "claimed",
      completedAt: null,
      proofImageUrl: "",
    });
    transaction.set(claimRef, {
      donationId,
      ngoId,
      claimedAt: serverTimestamp(),
      pickupStatus: "claimed",
      proofImageUrl: "",
      completedAt: null,
    });
  });

  const donationSnapshot = await getDoc(donationRef);

  if (donationSnapshot.exists()) {
    const donationData = donationSnapshot.data();

    const results = await Promise.allSettled([
      createNotification({
        recipientKey: ngoId,
        donationId,
        type: "claim_confirmed",
        title: "Donation Claim Confirmed",
        message: `You claimed ${donationData.foodName}. Coordinate pickup at ${donationData.address}.`,
      }),
      createNotification({
        recipientKey: donationData.restaurantId,
        donationId,
        type: "donation_claimed",
        title: "Donation Claimed",
        message: `${donationData.foodName} has been claimed by an NGO.`,
      }),
    ]);

    logNotificationWriteResults("claimDonation", results);
  }
}

export function subscribeNgoClaims(
  ngoId: string,
  onChange: (claims: Claim[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const db = getClientDb();
  const claimsQuery = query(
    collection(db, COLLECTIONS.CLAIMS),
    where("ngoId", "==", ngoId),
  );

  return onSnapshot(
    claimsQuery,
    (snapshot) => {
      const claims = snapshot.docs.map(mapClaimDoc);
      onChange(sortByClaimedAtDesc(claims));
    },
    (error) => onError?.(error),
  );
}

export async function updateClaimPickupStatus(
  claimId: string,
  ngoId: string,
  status: PickupStatus,
  options?: UpdateClaimStatusOptions,
): Promise<void> {
  const db = getClientDb();
  const claimRef = doc(db, COLLECTIONS.CLAIMS, claimId);

  let proofImageUrl = "";

  if (status === "completed") {
    if (!options?.proofImageFile) {
      throw new Error("Proof image is required before marking completed.");
    }

    proofImageUrl = await uploadProofImage(options.proofImageFile, ngoId);
  }

  await runTransaction(db, async (transaction) => {
    const claimSnapshot = await transaction.get(claimRef);

    if (!claimSnapshot.exists()) {
      throw new Error("Claim does not exist.");
    }

    const claimData = claimSnapshot.data();

    if (claimData.ngoId !== ngoId) {
      throw new Error("You are not authorized to update this claim.");
    }

    const rawCurrentStatus = claimData.pickupStatus as string | undefined;
    const currentStatus =
      rawCurrentStatus === "pending" ? "claimed" : (rawCurrentStatus as PickupStatus);

    if (status === "in_progress" && currentStatus !== "claimed") {
      throw new Error("You can move to in progress only after claiming.");
    }

    if (status === "completed" && currentStatus !== "in_progress") {
      throw new Error("You can complete donation only after in progress.");
    }

    if (status === "in_progress" || status === "completed") {
      const scheduleRef = doc(db, COLLECTIONS.SCHEDULES, claimId);
      const scheduleSnapshot = await transaction.get(scheduleRef);

      if (!scheduleSnapshot.exists()) {
        throw new Error("Pickup schedule is required before updating pickup progress.");
      }

      const scheduleData = scheduleSnapshot.data();

      if (scheduleData.ngoId !== ngoId) {
        throw new Error("You are not authorized to use this pickup schedule.");
      }

      if (scheduleData.status !== "approved") {
        throw new Error("Restaurant approval is required before pickup can start.");
      }
    }

    const donationRef = doc(db, COLLECTIONS.DONATIONS, claimData.donationId);
    const donationSnapshot = await transaction.get(donationRef);

    const claimUpdate: Record<string, unknown> = {
      pickupStatus: status,
    };

    if (status === "completed") {
      claimUpdate.proofImageUrl = proofImageUrl;
      claimUpdate.completedAt = serverTimestamp();
    }

    transaction.update(claimRef, claimUpdate);

    if (donationSnapshot.exists()) {
      const donationUpdate: Record<string, unknown> = {
        status,
      };

      if (status === "completed") {
        donationUpdate.proofImageUrl = proofImageUrl;
        donationUpdate.completedAt = serverTimestamp();
      }

      transaction.update(donationRef, donationUpdate);
    }
  });

  const claimSnapshot = await getDoc(claimRef);

  if (!claimSnapshot.exists()) {
    return;
  }

  const claimData = claimSnapshot.data();
  const donationRef = doc(db, COLLECTIONS.DONATIONS, claimData.donationId);
  const donationSnapshot = await getDoc(donationRef);

  if (!donationSnapshot.exists()) {
    return;
  }

  const donationData = donationSnapshot.data();

  if (status === "in_progress") {
    const results = await Promise.allSettled([
      createNotification({
        recipientKey: donationData.restaurantId,
        donationId: claimData.donationId,
        type: "donation_claimed",
        title: "Pickup In Progress",
        message: `${donationData.foodName} pickup is in progress.`,
      }),
    ]);

    logNotificationWriteResults("updateClaimPickupStatus:in_progress", results);
    return;
  }

  if (status === "completed") {
    const results = await Promise.allSettled([
      createNotification({
        recipientKey: ngoId,
        donationId: claimData.donationId,
        type: "pickup_completed",
        title: "Pickup Completed",
        message: `Pickup completed for ${donationData.foodName}.`,
      }),
      createNotification({
        recipientKey: donationData.restaurantId,
        donationId: claimData.donationId,
        type: "pickup_completed",
        title: "Donation Completed with Proof",
        message: `${donationData.foodName} donation marked completed with proof image uploaded.`,
      }),
    ]);

    logNotificationWriteResults("updateClaimPickupStatus:completed", results);
  }
}
