"use client";

import { NgoReceiptsTable } from "@/components/ngo/NgoReceiptsTable";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { useNgoWorkspaceData } from "@/hooks/useNgoWorkspaceData";

export default function NgoReceiptsPage() {
  const { claimHistory, donationLookup, scheduleLookup, profile, user, userLookup } =
    useNgoWorkspaceData();

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Receipts"
        description="Download pickup receipts for completed donations as audit-ready proof records."
      />

      <NgoReceiptsTable
        claims={claimHistory}
        donationLookup={donationLookup}
        scheduleLookup={scheduleLookup}
        ngoName={profile?.name ?? userLookup[user?.uid ?? ""]?.name ?? "NGO Partner"}
        userLookup={userLookup}
      />
    </section>
  );
}
