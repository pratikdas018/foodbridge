"use client";

import {
  collection,
  doc,
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
import type { NgoRating, NgoRatingSummary } from "@/types";

interface SubmitNgoRatingPayload {
  donationId: string;
  claimId: string;
  ngoId: string;
  restaurantId: string;
  rating: number;
}

function mapRatingDoc(document: QueryDocumentSnapshot<DocumentData>): NgoRating {
  const data = document.data();

  return {
    id: document.id,
    donationId: data.donationId,
    claimId: data.claimId,
    ngoId: data.ngoId,
    restaurantId: data.restaurantId,
    rating: typeof data.rating === "number" ? data.rating : 0,
    createdAt: (data.createdAt as Timestamp | undefined) ?? null,
    updatedAt: (data.updatedAt as Timestamp | undefined) ?? null,
  };
}

function toSummary(ratings: NgoRating[]): NgoRatingSummary {
  if (ratings.length === 0) {
    return {
      averageRating: 0,
      totalRatings: 0,
    };
  }

  const total = ratings.reduce((sum, item) => sum + item.rating, 0);
  return {
    averageRating: Number((total / ratings.length).toFixed(1)),
    totalRatings: ratings.length,
  };
}

export async function submitNgoRating(payload: SubmitNgoRatingPayload): Promise<void> {
  const db = getClientDb();

  if (!Number.isInteger(payload.rating) || payload.rating < 1 || payload.rating > 5) {
    throw new Error("Rating must be an integer between 1 and 5.");
  }

  const donationRef = doc(db, COLLECTIONS.DONATIONS, payload.donationId);
  const scheduleRef = doc(db, COLLECTIONS.SCHEDULES, payload.claimId);
  const ratingRef = doc(db, COLLECTIONS.RATINGS, payload.donationId);

  await runTransaction(db, async (transaction) => {
    const donationSnapshot = await transaction.get(donationRef);
    const scheduleSnapshot = await transaction.get(scheduleRef);

    if (!donationSnapshot.exists()) {
      throw new Error("Donation does not exist.");
    }

    if (!scheduleSnapshot.exists()) {
      throw new Error("Pickup schedule does not exist.");
    }

    const donationData = donationSnapshot.data();
    const scheduleData = scheduleSnapshot.data();

    if (donationData.restaurantId !== payload.restaurantId) {
      throw new Error("You are not authorized to rate this NGO.");
    }

    if (donationData.status !== "completed") {
      throw new Error("NGO can be rated only after donation completion.");
    }

    if (scheduleData.donationId !== payload.donationId || scheduleData.ngoId !== payload.ngoId) {
      throw new Error("Invalid donation and NGO mapping for rating.");
    }

    if (scheduleData.restaurantId !== payload.restaurantId) {
      throw new Error("Schedule does not belong to this restaurant.");
    }

    transaction.set(ratingRef, {
      donationId: payload.donationId,
      claimId: payload.claimId,
      ngoId: payload.ngoId,
      restaurantId: payload.restaurantId,
      rating: payload.rating,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

export function subscribeRestaurantRatings(
  restaurantId: string,
  onChange: (ratings: NgoRating[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const db = getClientDb();
  const ratingsQuery = query(
    collection(db, COLLECTIONS.RATINGS),
    where("restaurantId", "==", restaurantId),
  );

  return onSnapshot(
    ratingsQuery,
    (snapshot) => {
      const ratings = snapshot.docs.map(mapRatingDoc);
      onChange(ratings);
    },
    (error) => onError?.(error),
  );
}

export function subscribeNgoRatingSummary(
  ngoId: string,
  onChange: (summary: NgoRatingSummary) => void,
  onError?: (error: Error) => void,
): () => void {
  const db = getClientDb();
  const ratingsQuery = query(collection(db, COLLECTIONS.RATINGS), where("ngoId", "==", ngoId));

  return onSnapshot(
    ratingsQuery,
    (snapshot) => {
      const ratings = snapshot.docs.map(mapRatingDoc);
      onChange(toSummary(ratings));
    },
    (error) => onError?.(error),
  );
}
