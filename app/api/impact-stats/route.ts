import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";

const KG_PER_MEAL = 0.45;

function parseMealCount(quantity: unknown): number {
  if (typeof quantity === "number" && Number.isFinite(quantity)) {
    return Math.max(0, Math.round(quantity));
  }

  if (typeof quantity !== "string") {
    return 0;
  }

  const matched = quantity.match(/(\d+(?:\.\d+)?)/);

  if (!matched) {
    return 0;
  }

  const value = Number.parseFloat(matched[1]);

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
}

export async function GET() {
  try {
    const completedDonationsSnapshot = await adminDb
      .collection(COLLECTIONS.DONATIONS)
      .where("status", "in", ["completed", "picked"])
      .get();

    const successfulPickups = completedDonationsSnapshot.size;
    const totalMealsSaved = completedDonationsSnapshot.docs.reduce((sum, donationDoc) => {
      const quantity = donationDoc.data().quantity;
      return sum + parseMealCount(quantity);
    }, 0);

    const wasteReducedKg = Number((totalMealsSaved * KG_PER_MEAL).toFixed(1));

    const ngoUsersSnapshot = await adminDb
      .collection(COLLECTIONS.USERS)
      .where("role", "==", "ngo")
      .get();

    const activeNgos = ngoUsersSnapshot.docs.filter((ngoDoc) => {
      const ngoData = ngoDoc.data();
      const isVerified = ngoData.isVerified === true;
      const availabilityStatus =
        typeof ngoData.availabilityStatus === "string"
          ? ngoData.availabilityStatus
          : "available";

      return isVerified && availabilityStatus === "available";
    }).length;

    return NextResponse.json({
      totalMealsSaved,
      wasteReducedKg,
      successfulPickups,
      activeNgos,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to load impact dashboard metrics." },
      { status: 500 },
    );
  }
}
