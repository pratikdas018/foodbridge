"use server";

import { revalidatePath } from "next/cache";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireServerRole } from "@/lib/firebase/server-auth";
import type { DonationStatus, UserRole } from "@/types";

const allowedStatuses: DonationStatus[] = ["available", "claimed", "in_progress", "completed"];
const allowedRoles: UserRole[] = ["restaurant", "ngo", "admin"];

interface ActionResult {
  success: boolean;
  message: string;
}

export async function updateDonationStatusAction(
  donationId: string,
  status: DonationStatus,
): Promise<ActionResult> {
  try {
    await requireServerRole("admin");

    if (!allowedStatuses.includes(status)) {
      return {
        success: false,
        message: "Invalid status selected.",
      };
    }

    await adminDb.collection(COLLECTIONS.DONATIONS).doc(donationId).update({ status });
    revalidatePath("/admin");

    return {
      success: true,
      message: "Donation status updated.",
    };
  } catch {
    return {
      success: false,
      message: "Status update failed.",
    };
  }
}

export async function deleteDonationAction(donationId: string): Promise<ActionResult> {
  try {
    await requireServerRole("admin");
    await adminDb.collection(COLLECTIONS.DONATIONS).doc(donationId).delete();
    revalidatePath("/admin");

    return {
      success: true,
      message: "Donation deleted.",
    };
  } catch {
    return {
      success: false,
      message: "Delete failed.",
    };
  }
}

export async function updateUserRoleAction(
  userId: string,
  role: UserRole,
): Promise<ActionResult> {
  try {
    await requireServerRole("admin");

    if (!allowedRoles.includes(role)) {
      return {
        success: false,
        message: "Invalid role selected.",
      };
    }

    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(userId);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    const currentRole = userSnapshot.data()?.role as UserRole | undefined;
    const updatePayload: Record<string, unknown> = { role };

    if (role === "ngo") {
      updatePayload.isVerified = currentRole === "ngo" ? userSnapshot.data()?.isVerified === true : false;
      updatePayload.availabilityStatus =
        currentRole === "ngo" && userSnapshot.data()?.availabilityStatus === "busy"
          ? "busy"
          : "available";
    } else {
      updatePayload.isVerified = true;
      updatePayload.availabilityStatus = "available";
    }

    await userRef.update(updatePayload);
    revalidatePath("/admin");

    return {
      success: true,
      message: "User role updated.",
    };
  } catch {
    return {
      success: false,
      message: "Role update failed.",
    };
  }
}

export async function setNgoVerificationAction(
  userId: string,
  isVerified: boolean,
): Promise<ActionResult> {
  try {
    await requireServerRole("admin");
    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(userId);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    const userRole = userSnapshot.data()?.role as UserRole | undefined;

    if (userRole !== "ngo") {
      return {
        success: false,
        message: "Verification can only be changed for NGO users.",
      };
    }

    await userRef.update({ isVerified });
    revalidatePath("/admin");

    return {
      success: true,
      message: isVerified ? "NGO verified successfully." : "NGO rejected successfully.",
    };
  } catch {
    return {
      success: false,
      message: "NGO verification update failed.",
    };
  }
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  try {
    const currentAdmin = await requireServerRole("admin");

    if (currentAdmin.uid === userId) {
      return {
        success: false,
        message: "You cannot delete your own admin account.",
      };
    }

    await adminDb.collection(COLLECTIONS.USERS).doc(userId).delete();
    await adminAuth.deleteUser(userId);
    revalidatePath("/admin");

    return {
      success: true,
      message: "User deleted.",
    };
  } catch {
    return {
      success: false,
      message: "User delete failed.",
    };
  }
}
