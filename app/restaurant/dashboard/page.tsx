"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { StatCardSkeleton } from "@/components/ui/StatCardSkeleton";
import { useRestaurantWorkspaceData } from "@/hooks/useRestaurantWorkspaceData";

export default function RestaurantOverviewPage() {
  const { donations, schedules, ratingsByDonationId, donationsLoading, schedulesLoading, ratingsLoading } =
    useRestaurantWorkspaceData();

  const completedCount = donations.filter((donation) => donation.status === "completed").length;
  const claimedCount = donations.filter((donation) => donation.status === "claimed").length;
  const inProgressCount = donations.filter(
    (donation) => donation.status === "in_progress",
  ).length;
  const pendingSchedules = schedules.filter((schedule) => schedule.status === "pending").length;
  const showStatSkeleton = donationsLoading || schedulesLoading || ratingsLoading;

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Restaurant Dashboard"
        description="Track donation performance, schedule approvals, and distribution completion from one view."
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
              <p className="text-sm text-slate-500">Total Donations</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{donations.length}</p>
            </article>
            <article className="card transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
              <p className="text-sm text-slate-500">Claimed</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{claimedCount}</p>
            </article>
            <article className="card transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
              <p className="text-sm text-slate-500">In Progress</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{inProgressCount}</p>
            </article>
            <article className="card transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
              <p className="text-sm text-slate-500">Completed</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{completedCount}</p>
            </article>
            <article className="card transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
              <p className="text-sm text-slate-500">Pending Schedules</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{pendingSchedules}</p>
            </article>
            <article className="card transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
              <p className="text-sm text-slate-500">Ratings Submitted</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {Object.keys(ratingsByDonationId).length}
              </p>
            </article>
          </>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/restaurant/actions"
            className="rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:opacity-90"
          >
            Add Donation
          </Link>
          <Link
            href="/restaurant/schedules"
            className="rounded-xl border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-300 ease-in-out hover:bg-sky-50"
          >
            Review Schedules
          </Link>
          <Link
            href="/restaurant/receipts"
            className="rounded-xl border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-300 ease-in-out hover:bg-sky-50"
          >
            Download Receipts
          </Link>
        </div>
      </div>
    </section>
  );
}
