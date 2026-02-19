import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import type { UserRole } from "@/types";

const SESSION_EXPIRES_IN_MS = 60 * 60 * 24 * 5 * 1000;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { idToken?: string };

    if (!body.idToken) {
      return NextResponse.json({ message: "Missing idToken." }, { status: 400 });
    }

    const decodedToken = await adminAuth.verifyIdToken(body.idToken);
    const sessionCookie = await adminAuth.createSessionCookie(body.idToken, {
      expiresIn: SESSION_EXPIRES_IN_MS,
    });

    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();
    const role = (userDoc.data()?.role as UserRole | undefined) ?? "ngo";

    const response = NextResponse.json({ role });

    response.cookies.set("fb_session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_EXPIRES_IN_MS / 1000,
      path: "/",
    });

    response.cookies.set("fb_role", role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_EXPIRES_IN_MS / 1000,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ message: "Invalid session request." }, { status: 401 });
  }
}
