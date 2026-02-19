"use client";

import { SectionHeader } from "@/components/layout/SectionHeader";
import { MyDonationsTable } from "@/components/restaurant/MyDonationsTable";
import { TableRowSkeleton } from "@/components/ui/TableRowSkeleton";
import { useRestaurantWorkspaceData } from "@/hooks/useRestaurantWorkspaceData";

export default function RestaurantDonationsPage() {
  const {
    donations,
    schedulesByDonationId,
    ratingsByDonationId,
    ratingDonationId,
    profile,
    ngoLookup,
    donationsLoading,
    schedulesLoading,
    ratingsLoading,
    handleRateNgo,
  } = useRestaurantWorkspaceData();
  const showTableSkeleton = donationsLoading || schedulesLoading || ratingsLoading;

  return (
    <section className="space-y-6">
      <SectionHeader
        title="My Donations"
        description="View all donation entries, live statuses, schedule states, proof uploads, and NGO ratings."
      />

      {showTableSkeleton ? (
        <div className="table-shell animate-fade-rise">
          <div className="px-4 pt-4">
            <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-sora)" }}>
              My Donations
            </h2>
          </div>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Food</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Quantity</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Available Till</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Pickup Slot</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Schedule</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">NGO Rating</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <TableRowSkeleton columns={8} rows={5} />
            </tbody>
          </table>
        </div>
      ) : (
        <MyDonationsTable
          donations={donations}
          schedulesByDonationId={schedulesByDonationId}
          ratingsByDonationId={ratingsByDonationId}
          ratingDonationId={ratingDonationId}
          restaurantName={profile?.name ?? "Restaurant Partner"}
          ngoLookup={ngoLookup}
          showReceiptActions={false}
          onRateNgo={handleRateNgo}
        />
      )}
    </section>
  );
}
