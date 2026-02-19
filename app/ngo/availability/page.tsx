"use client";

import { SectionHeader } from "@/components/layout/SectionHeader";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useNgoWorkspaceData } from "@/hooks/useNgoWorkspaceData";

export default function NgoAvailabilityPage() {
  const { profile, isUpdatingAvailability, handleAvailabilityToggle } = useNgoWorkspaceData();

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Availability"
        description="Set your NGO pickup capacity so restaurants know when your team can accept new requests."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <article className="card transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg lg:col-span-2">
          <p className="text-sm text-slate-600">Current Status</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StatusBadge status={profile?.availabilityStatus ?? "available"} />
            <Button
              type="button"
              variant="secondary"
              isLoading={isUpdatingAvailability}
              onClick={() => void handleAvailabilityToggle()}
            >
              {profile?.availabilityStatus === "available" ? "Set Busy" : "Set Available"}
            </Button>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Switch to <span className="font-semibold text-slate-700">Available</span> when your team is ready to claim donations.
          </p>
        </article>
      </div>
    </section>
  );
}
