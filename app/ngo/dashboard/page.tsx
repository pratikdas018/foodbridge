"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { StatCardSkeleton } from "@/components/ui/StatCardSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useNgoWorkspaceData } from "@/hooks/useNgoWorkspaceData";

export default function NgoOverviewPage() {
  const {
    availableDonations,
    claimHistory,
    profile,
    ratingSummary,
    scheduleLookup,
    availableDonationsLoading,
    claimHistoryLoading,
    schedulesLoading,
    ratingSummaryLoading,
  } = useNgoWorkspaceData();

  const claimedCount = claimHistory.filter((claim) => claim.pickupStatus === "claimed").length;
  const inProgressCount = claimHistory.filter(
    (claim) => claim.pickupStatus === "in_progress",
  ).length;
  const completedCount = claimHistory.filter((claim) => claim.pickupStatus === "completed").length;
  const pendingScheduleCount = Object.values(scheduleLookup).filter(
    (schedule) => schedule.status === "pending",
  ).length;
  const showStatSkeleton =
    availableDonationsLoading || claimHistoryLoading || schedulesLoading || ratingSummaryLoading;

  return (
    <section className="space-y-6">
      <SectionHeader
        title="NGO Dashboard"
        description="Monitor food claims, pickup lifecycle, availability status, and impact from one overview."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {showStatSkeleton ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <article className="card transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
              <p className="text-sm text-slate-500">Available Donations</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{availableDonations.length}</p>
            </article>
            <article className="card transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
              <p className="text-sm text-slate-500">Active Claims</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {claimedCount + inProgressCount}
              </p>
            </article>
            <article className="card transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
              <p className="text-sm text-slate-500">Completed Pickups</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{completedCount}</p>
            </article>
            <article className="card transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
              <p className="text-sm text-slate-500">Pending Schedules</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{pendingScheduleCount}</p>
            </article>
            <article className="card transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
              <p className="text-sm text-slate-500">Average Rating</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {ratingSummary.averageRating.toFixed(1)}
                <span className="ml-1 text-sm font-semibold text-slate-500">/ 5</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {ratingSummary.totalRatings} total ratings
              </p>
            </article>
            <article className="card transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
              <p className="text-sm text-slate-500">Verification & Availability</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge status={profile?.isVerified ? "approved" : "pending"} />
                <StatusBadge status={profile?.availabilityStatus ?? "available"} />
              </div>
            </article>
          </>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/ngo/claims"
            className="rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:opacity-90"
          >
            View Claims
          </Link>
          <Link
            href="/ngo/availability"
            className="rounded-xl border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-300 ease-in-out hover:bg-sky-50"
          >
            Update Availability
          </Link>
          <Link
            href="/ngo/receipts"
            className="rounded-xl border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-300 ease-in-out hover:bg-sky-50"
          >
            Download Receipts
          </Link>
        </div>
      </div>
    </section>
  );
}
