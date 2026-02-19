import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import type { NotificationType, UserRole } from "@/types";

const ALLOWED_TYPES: NotificationType[] = [
  "new_donation",
  "donation_claimed",
  "claim_confirmed",
  "pickup_completed",
  "schedule_requested",
  "schedule_approved",
  "schedule_rejected",
];

interface CreateNotificationRequestBody {
  recipientKey?: string;
  donationId?: string;
  type?: NotificationType;
  title?: string;
  message?: string;
}

function parseRecipientRole(recipientKey: string): UserRole | null {
  if (recipientKey === "role:restaurant") {
    return "restaurant";
  }

  if (recipientKey === "role:ngo") {
    return "ngo";
  }

  if (recipientKey === "role:admin") {
    return "admin";
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("fb_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const actorUserDoc = await adminDb
      .collection(COLLECTIONS.USERS)
      .doc(decoded.uid)
      .get();

    if (!actorUserDoc.exists) {
      return NextResponse.json({ message: "User profile not found." }, { status: 403 });
    }

    const actorRole = actorUserDoc.data()?.role as UserRole | undefined;

    if (!actorRole) {
      return NextResponse.json({ message: "User role not found." }, { status: 403 });
    }

    const body = (await request.json()) as CreateNotificationRequestBody;

    if (!body.recipientKey || !body.donationId || !body.type || !body.title || !body.message) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(body.type)) {
      return NextResponse.json({ message: "Invalid notification type." }, { status: 400 });
    }

    if (body.title.length > 120 || body.message.length > 500) {
      return NextResponse.json({ message: "Notification text is too long." }, { status: 400 });
    }

    const donationDoc = await adminDb
      .collection(COLLECTIONS.DONATIONS)
      .doc(body.donationId)
      .get();

    if (!donationDoc.exists) {
      return NextResponse.json({ message: "Donation not found." }, { status: 400 });
    }

    const recipientRole = parseRecipientRole(body.recipientKey);

    if (recipientRole) {
      const recipientsSnapshot = await adminDb
        .collection(COLLECTIONS.USERS)
        .where("role", "==", recipientRole)
        .get();

      const batch = adminDb.batch();

      for (const recipientDoc of recipientsSnapshot.docs) {
        const notificationRef = adminDb.collection(COLLECTIONS.NOTIFICATIONS).doc();

        batch.set(notificationRef, {
          recipientKey: recipientDoc.id,
          actorId: decoded.uid,
          actorRole,
          donationId: body.donationId,
          type: body.type,
          title: body.title,
          message: body.message,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
    } else {
      const recipientUserDoc = await adminDb
        .collection(COLLECTIONS.USERS)
        .doc(body.recipientKey)
        .get();

      if (!recipientUserDoc.exists) {
        return NextResponse.json({ message: "Recipient user not found." }, { status: 400 });
      }

      await adminDb.collection(COLLECTIONS.NOTIFICATIONS).add({
        recipientKey: body.recipientKey,
        actorId: decoded.uid,
        actorRole,
        donationId: body.donationId,
        type: body.type,
        title: body.title,
        message: body.message,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Failed to create notification." }, { status: 500 });
  }
}
