import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import type { UserRole } from "@/types";

const announcementSchema = z.object({
  subject: z.string().trim().min(6).max(120),
  message: z.string().trim().min(20).max(3000),
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
    const parsed = announcementSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid request payload.";
      return NextResponse.json({ message: firstIssue }, { status: 400 });
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
      return NextResponse.json({ message: "No valid recipients found." }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const sentAt = new Date().toLocaleString();

    await transporter.sendMail({
      from: `FoodBridge Admin <${emailUser}>`,
      to: emailUser,
      bcc: recipientEmails,
      subject: parsed.data.subject,
      text: [
        "FoodBridge Platform Update",
        "",
        parsed.data.message,
        "",
        `Sent At: ${sentAt}`,
      ].join("\n"),
    });

    return NextResponse.json({
      message: `Update sent to ${recipientEmails.length} users.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send update.";

    return NextResponse.json({ message }, { status: 500 });
  }
}
