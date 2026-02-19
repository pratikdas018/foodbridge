"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { createNotification } from "@/services/notification.service";
import type { PickupSchedule, ScheduleStatus } from "@/types";

function mapScheduleDoc(document: QueryDocumentSnapshot<DocumentData>): PickupSchedule {
  const data = document.data();

  return {
    id: document.id,
    claimId: data.claimId,
    donationId: data.donationId,
    ngoId: data.ngoId,
    restaurantId: data.restaurantId,
    pickupTime: (data.pickupTime as Timestamp | undefined) ?? null,
    status: (data.status as ScheduleStatus | undefined) ?? "pending",
    rejectionReason: data.rejectionReason ?? "",
    requestedAt: (data.requestedAt as Timestamp | undefined) ?? null,
    decidedAt: (data.decidedAt as Timestamp | undefined) ?? null,
  };
}

function sortByRequestedAtDesc(items: PickupSchedule[]): PickupSchedule[] {
  return [...items].sort((a, b) => {
    const aSec = a.requestedAt?.seconds ?? 0;
    const bSec = b.requestedAt?.seconds ?? 0;
    return bSec - aSec;
  });
}

function validateFuturePickupTime(pickupTimeIso: string): Date {
  const trimmed = pickupTimeIso.trim();
  const hasExplicitSeconds =
    /T\d{2}:\d{2}:\d{2}/.test(trimmed) || /\d{1,2}:\d{2}:\d{2}$/.test(trimmed);
  let parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    const localeMatch = trimmed.match(
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/,
    );

    if (localeMatch) {
      const day = Number(localeMatch[1]);
      const month = Number(localeMatch[2]);
      const year = Number(localeMatch[3]);
      const hour = Number(localeMatch[4]);
      const minute = Number(localeMatch[5]);
      const second = localeMatch[6] ? Number(localeMatch[6]) : 0;

      parsed = new Date(year, month - 1, day, hour, minute, second, 0);
    }
  }

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid pickup time.");
  }

  // datetime-local inputs are minute precision; treat them as the end of minute
  // so selecting the current minute doesn't fail due to missing seconds.
  if (!hasExplicitSeconds) {
    parsed.setSeconds(59, 999);
  }

  if (parsed <= new Date()) {
    throw new Error("Pickup time must be in the future.");
  }

  return parsed;
}

export async function requestPickupSchedule(
  claimId: string,
  ngoId: string,
  pickupTimeIso: string,
): Promise<void> {
  const db = getClientDb();
  const parsedPickupTime = validateFuturePickupTime(pickupTimeIso);
  const claimRef = doc(db, COLLECTIONS.CLAIMS, claimId);
  const scheduleRef = doc(db, COLLECTIONS.SCHEDULES, claimId);
  const existingScheduleQuery = query(
    collection(db, COLLECTIONS.SCHEDULES),
    where("claimId", "==", claimId),
    where("ngoId", "==", ngoId),
    limit(1),
  );

  const claimSnapshot = await getDoc(claimRef);

  if (!claimSnapshot.exists()) {
    throw new Error("Claim does not exist.");
  }

  const claimData = claimSnapshot.data();

  if (claimData.ngoId !== ngoId) {
    throw new Error("You are not authorized to schedule this pickup.");
  }

  const donationRef = doc(db, COLLECTIONS.DONATIONS, claimData.donationId);
  const donationSnapshot = await getDoc(donationRef);

  if (!donationSnapshot.exists()) {
    throw new Error("Donation does not exist.");
  }

  const donationData = donationSnapshot.data();

  if (donationData.status === "completed") {
    throw new Error("Completed donations cannot be scheduled.");
  }

  const existingScheduleSnapshot = await getDocs(existingScheduleQuery);
  const existingScheduleData = existingScheduleSnapshot.docs[0]?.data();

  if (existingScheduleData) {
    const existingStatus = existingScheduleData.status as ScheduleStatus | undefined;

    if (existingStatus === "pending") {
      throw new Error("Pickup schedule is already pending restaurant approval.");
    }

    if (existingStatus === "approved") {
      throw new Error("Pickup schedule is already approved by restaurant.");
    }
  }

  await setDoc(scheduleRef, {
    claimId,
    donationId: claimData.donationId,
    ngoId,
    restaurantId: donationData.restaurantId,
    pickupTime: Timestamp.fromDate(parsedPickupTime),
    status: "pending",
    rejectionReason: "",
    requestedAt: serverTimestamp(),
    decidedAt: null,
  });

  const scheduleSnapshot = await getDoc(scheduleRef);

  if (!scheduleSnapshot.exists()) {
    return;
  }

  const scheduleData = scheduleSnapshot.data();
  const notificationDonationSnapshot = await getDoc(
    doc(db, COLLECTIONS.DONATIONS, scheduleData.donationId),
  );

  if (!notificationDonationSnapshot.exists()) {
    return;
  }

  const notificationDonationData = notificationDonationSnapshot.data();

  try {
    await createNotification({
      recipientKey: scheduleData.restaurantId,
      donationId: scheduleData.donationId,
      type: "schedule_requested",
      title: "Pickup Slot Requested",
      message: `NGO requested pickup for ${notificationDonationData.foodName}. Review the schedule request.`,
    });
  } catch (error) {
    console.warn("Schedule notification write failed.", error);
  }
}

export async function reviewPickupSchedule(
  scheduleId: string,
  restaurantId: string,
  status: Exclude<ScheduleStatus, "pending">,
  rejectionReason = "",
): Promise<void> {
  const db = getClientDb();
  const scheduleRef = doc(db, COLLECTIONS.SCHEDULES, scheduleId);

  await runTransaction(db, async (transaction) => {
    const scheduleSnapshot = await transaction.get(scheduleRef);

    if (!scheduleSnapshot.exists()) {
      throw new Error("Schedule does not exist.");
    }

    const scheduleData = scheduleSnapshot.data();

    if (scheduleData.restaurantId !== restaurantId) {
      throw new Error("You are not authorized to review this schedule.");
    }

    if (scheduleData.status !== "pending") {
      throw new Error("Only pending schedules can be reviewed.");
    }

    transaction.update(scheduleRef, {
      status,
      rejectionReason: status === "rejected" ? rejectionReason.trim() : "",
      decidedAt: serverTimestamp(),
    });
  });

  const scheduleSnapshot = await getDoc(scheduleRef);

  if (!scheduleSnapshot.exists()) {
    return;
  }

  const scheduleData = scheduleSnapshot.data();
  const donationSnapshot = await getDoc(doc(db, COLLECTIONS.DONATIONS, scheduleData.donationId));

  if (!donationSnapshot.exists()) {
    return;
  }

  const donationData = donationSnapshot.data();

  try {
    await createNotification({
      recipientKey: scheduleData.ngoId,
      donationId: scheduleData.donationId,
      type: status === "approved" ? "schedule_approved" : "schedule_rejected",
      title: status === "approved" ? "Pickup Slot Approved" : "Pickup Slot Rejected",
      message:
        status === "approved"
          ? `Restaurant approved your pickup slot for ${donationData.foodName}.`
          : `Restaurant rejected your pickup slot for ${donationData.foodName}.`,
    });
  } catch (error) {
    console.warn("Schedule review notification write failed.", error);
  }
}

export function subscribeNgoSchedules(
  ngoId: string,
  onChange: (schedules: PickupSchedule[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const db = getClientDb();
  const schedulesQuery = query(
    collection(db, COLLECTIONS.SCHEDULES),
    where("ngoId", "==", ngoId),
  );

  return onSnapshot(
    schedulesQuery,
    (snapshot) => {
      const schedules = snapshot.docs.map(mapScheduleDoc);
      onChange(sortByRequestedAtDesc(schedules));
    },
    (error) => onError?.(error),
  );
}

export function subscribeRestaurantSchedules(
  restaurantId: string,
  onChange: (schedules: PickupSchedule[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const db = getClientDb();
  const schedulesQuery = query(
    collection(db, COLLECTIONS.SCHEDULES),
    where("restaurantId", "==", restaurantId),
  );

  return onSnapshot(
    schedulesQuery,
    (snapshot) => {
      const schedules = snapshot.docs.map(mapScheduleDoc);
      onChange(sortByRequestedAtDesc(schedules));
    },
    (error) => onError?.(error),
  );
}
