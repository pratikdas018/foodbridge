"use client";

import {
  doc,
  onSnapshot,
  query,
  collection,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/collections";
import type { AppNotification, NotificationType, UserRole } from "@/types";

interface CreateNotificationPayload {
  recipientKey: string;
  donationId: string;
  type: NotificationType;
  title: string;
  message: string;
}

function mapNotificationDoc(
  document: QueryDocumentSnapshot<DocumentData>,
): AppNotification {
  const data = document.data();

  return {
    id: document.id,
    recipientKey: data.recipientKey,
    actorId: data.actorId,
    actorRole: data.actorRole as UserRole,
    donationId: data.donationId,
    type: data.type,
    title: data.title,
    message: data.message,
    read: Boolean(data.read),
    createdAt: (data.createdAt as Timestamp | undefined) ?? null,
  };
}

function sortByCreatedAtDesc(items: AppNotification[]): AppNotification[] {
  return [...items].sort((a, b) => {
    const aSec = a.createdAt?.seconds ?? 0;
    const bSec = b.createdAt?.seconds ?? 0;
    return bSec - aSec;
  });
}

export async function createNotification(
  payload: CreateNotificationPayload,
): Promise<void> {
  const response = await fetch("/api/notifications/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(errorPayload?.message ?? "Notification create failed.");
  }
}

export function subscribeNotifications(
  userId: string,
  onChange: (notifications: AppNotification[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const db = getClientDb();
  const notificationsQuery = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where("recipientKey", "==", userId),
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const notifications = snapshot.docs.map(mapNotificationDoc);
      onChange(sortByCreatedAtDesc(notifications));
    },
    (error) => onError?.(error),
  );
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const db = getClientDb();

  await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), {
    read: true,
  });
}
