"use client";

import { SectionHeader } from "@/components/layout/SectionHeader";
import { AddDonationForm } from "@/components/restaurant/AddDonationForm";
import { useRestaurantWorkspaceData } from "@/hooks/useRestaurantWorkspaceData";

export default function RestaurantActionsPage() {
  const { user } = useRestaurantWorkspaceData();

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Restaurant Actions"
        description="Publish new donations with map coordinates, media attachments, and real-time pickup availability."
      />
      {user ? <AddDonationForm restaurantId={user.uid} /> : null}
    </section>
  );
}
