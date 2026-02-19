"use client";

import { SectionHeader } from "@/components/layout/SectionHeader";
import { RestaurantReceiptsTable } from "@/components/restaurant/RestaurantReceiptsTable";
import { useRestaurantWorkspaceData } from "@/hooks/useRestaurantWorkspaceData";

export default function RestaurantReceiptsPage() {
  const { donations, schedulesByDonationId, profile, ngoLookup } = useRestaurantWorkspaceData();

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Receipts"
        description="Download completion receipts for closed donations to maintain transparent records."
      />

      <RestaurantReceiptsTable
        donations={donations}
        schedulesByDonationId={schedulesByDonationId}
        restaurantName={profile?.name ?? "Restaurant Partner"}
        ngoLookup={ngoLookup}
      />
    </section>
  );
}
