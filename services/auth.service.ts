"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getClientAuth, getClientDb } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/collections";
import type { LoginPayload, RegisterPayload, UserRole } from "@/types";

const dashboardByRole: Record<UserRole, string> = {
  restaurant: "/restaurant/dashboard",
  ngo: "/ngo/dashboard",
  admin: "/admin",
};

interface SessionResponse {
  role: UserRole;
}

async function syncServerSession(firebaseUser: User): Promise<SessionResponse> {
  const idToken = await firebaseUser.getIdToken(true);

  const response = await fetch("/api/session/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    throw new Error("Unable to create secure session.");
  }

  return (await response.json()) as SessionResponse;
}

export async function registerUser(payload: RegisterPayload): Promise<UserRole> {
  const auth = getClientAuth();
  const db = getClientDb();

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    payload.email,
    payload.password,
  );

  await setDoc(doc(db, COLLECTIONS.USERS, userCredential.user.uid), {
    uid: userCredential.user.uid,
    name: payload.name,
    email: payload.email,
    role: payload.role,
    isVerified: payload.role === "ngo" ? false : true,
    availabilityStatus: "available",
    createdAt: serverTimestamp(),
  });

  const session = await syncServerSession(userCredential.user);

  return session.role;
}

export async function loginUser(payload: LoginPayload): Promise<UserRole> {
  const auth = getClientAuth();
  const userCredential = await signInWithEmailAndPassword(
    auth,
    payload.email,
    payload.password,
  );

  const session = await syncServerSession(userCredential.user);

  return session.role;
}

export async function logoutUser(): Promise<void> {
  const auth = getClientAuth();

  await fetch("/api/session/logout", {
    method: "POST",
  });

  await signOut(auth);
}

export async function getUserRole(uid: string): Promise<UserRole | null> {
  const db = getClientDb();
  const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));

  if (!userDoc.exists()) {
    return null;
  }

  return (userDoc.data().role as UserRole | undefined) ?? null;
}

export function getDashboardPath(role: UserRole): string {
  return dashboardByRole[role];
}
