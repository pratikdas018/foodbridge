"use client";

import { NgoProfileCard } from "@/components/ngo/NgoProfileCard";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useNgoWorkspaceData } from "@/hooks/useNgoWorkspaceData";

export default function NgoProfilePage() {
  const { profile, ratingSummary, user } = useNgoWorkspaceData();

  return (
    <section className="space-y-6">
      <SectionHeader
        title="NGO Profile"
        description="Manage your identity, verification status, and trust score visible to restaurants."
      />

      <NgoProfileCard ngoName={profile?.name ?? "NGO Partner"} summary={ratingSummary} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <article className="card transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{profile?.email ?? user?.email ?? "-"}</p>
        </article>
        <article className="card transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verification</p>
          <div className="mt-2">
            <StatusBadge status={profile?.isVerified ? "approved" : "pending"} />
          </div>
        </article>
        <article className="card transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Joined</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {profile?.createdAt?.toDate().toLocaleDateString() ?? "-"}
          </p>
        </article>
      </div>
    </section>
  );
}
