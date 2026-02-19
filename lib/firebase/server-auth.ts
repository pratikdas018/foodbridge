import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import type { UserRole } from "@/types";

export interface ServerSessionUser {
  uid: string;
  email: string;
  role: UserRole;
}

export async function getServerSessionUser(): Promise<ServerSessionUser | null> {
  const sessionCookie = cookies().get("fb_session")?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(decoded.uid).get();

    if (!userDoc.exists) {
      return null;
    }

    const role = userDoc.data()?.role as UserRole | undefined;

    if (!role) {
      return null;
    }

    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      role,
    };
  } catch {
    return null;
  }
}

export async function requireServerRole(
  allowedRoles: UserRole | UserRole[],
): Promise<ServerSessionUser> {
  const roleList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const sessionUser = await getServerSessionUser();

  if (!sessionUser) {
    redirect("/login");
  }

  if (!roleList.includes(sessionUser.role)) {
    redirect("/unauthorized");
  }

  return sessionUser;
}
