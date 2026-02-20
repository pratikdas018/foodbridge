import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import type { UserRole } from "@/types";

const BROADCAST_SUBJECT = "New Update from FoodBridge 🚀";

const payloadSchema = z.object({
  subject: z.string().trim().min(1).max(150),
  message: z.string().trim().min(1).max(5000),
});

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

    if (role !== "admin") {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const body = await request.json();
    const parsedPayload = payloadSchema.safeParse(body);

    if (!parsedPayload.success) {
      const issue = parsedPayload.error.issues[0]?.message ?? "Invalid payload.";
      return NextResponse.json({ message: issue }, { status: 400 });
    }

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      return NextResponse.json(
        { message: "EMAIL_USER or EMAIL_PASS is not configured." },
        { status: 500 },
      );
    }

    const usersSnapshot = await adminDb.collection(COLLECTIONS.USERS).select("email").get();

    const recipientEmails = Array.from(
      new Set(
        usersSnapshot.docs
          .map((doc) => String(doc.data().email ?? "").trim().toLowerCase())
          .filter((email) => isValidEmail(email)),
      ),
    );

    if (recipientEmails.length === 0) {
      return NextResponse.json({ message: "No valid user emails found." }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    await transporter.sendMail({
      from: `FoodBridge Admin <${emailUser}>`,
      to: emailUser,
      bcc: recipientEmails,
      subject: BROADCAST_SUBJECT,
      text: [
        "Hello,",
        "",
        "We have released a new feature",
        "on FoodBridge Platform.",
        "",
        "Message:",
        "",
        parsedPayload.data.message,
        "",
        "Stay connected with FoodBridge",
        "to reduce food waste.",
        "",
        "Regards,",
        "FoodBridge Team",
      ].join("\n"),
    });

    return NextResponse.json({
      message: `Broadcast sent to ${recipientEmails.length} users.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send broadcast email.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
