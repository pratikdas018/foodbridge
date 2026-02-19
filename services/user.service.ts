"use client";

import {
  collection,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/collections";
import type { AppUser, NgoAvailabilityStatus, UserRole } from "@/types";

function normalizeAvailabilityStatus(value: unknown): NgoAvailabilityStatus {
  if (value === "busy") {
    return "busy";
  }

  return "available";
}

function mapUserDoc(document: QueryDocumentSnapshot<DocumentData>): AppUser {
  const data = document.data();

  return {
    uid: data.uid,
    name: data.name,
    email: data.email,
    role: data.role as UserRole,
    isVerified: Boolean(data.isVerified),
    availabilityStatus: normalizeAvailabilityStatus(data.availabilityStatus),
    createdAt: (data.createdAt as Timestamp | undefined) ?? null,
  };
}

function sortUsersByCreatedAtDesc(items: AppUser[]): AppUser[] {
  return [...items].sort((a, b) => {
    const aSec = a.createdAt?.seconds ?? 0;
    const bSec = b.createdAt?.seconds ?? 0;
    return bSec - aSec;
  });
}

export function subscribeAllUsers(
  onChange: (users: AppUser[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const db = getClientDb();

  return onSnapshot(
    collection(db, COLLECTIONS.USERS),
    (snapshot) => {
      const users = snapshot.docs.map(mapUserDoc);
      onChange(sortUsersByCreatedAtDesc(users));
    },
    (error) => onError?.(error),
  );
}

export async function fetchUsersByIds(
  userIds: string[],
): Promise<Record<string, AppUser>> {
  const db = getClientDb();
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  const lookup: Record<string, AppUser> = {};

  await Promise.all(
    uniqueIds.map(async (userId) => {
      const userSnapshot = await getDoc(doc(db, COLLECTIONS.USERS, userId));

      if (!userSnapshot.exists()) {
        return;
      }

      const data = userSnapshot.data();
      lookup[userId] = {
        uid: data.uid,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        isVerified: Boolean(data.isVerified),
        availabilityStatus: normalizeAvailabilityStatus(data.availabilityStatus),
        createdAt: (data.createdAt as Timestamp | undefined) ?? null,
      };
    }),
  );

  return lookup;
}

export async function updateNgoAvailabilityStatus(
  ngoId: string,
  status: NgoAvailabilityStatus,
): Promise<void> {
  const db = getClientDb();

  await updateDoc(doc(db, COLLECTIONS.USERS, ngoId), {
    availabilityStatus: status,
  });
}
