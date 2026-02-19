"use client";

import { SectionHeader } from "@/components/layout/SectionHeader";
import { PickupSchedulesTable } from "@/components/restaurant/PickupSchedulesTable";
import { TableRowSkeleton } from "@/components/ui/TableRowSkeleton";
import { useRestaurantWorkspaceData } from "@/hooks/useRestaurantWorkspaceData";

export default function RestaurantSchedulesPage() {
  const {
    schedules,
    donationLookup,
    updatingScheduleId,
    donationsLoading,
    schedulesLoading,
    handleApproveSchedule,
    handleRejectSchedule,
  } = useRestaurantWorkspaceData();
  const showTableSkeleton = donationsLoading || schedulesLoading;

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Pickup Schedules"
        description="Approve or reject NGO-proposed pickup slots and keep your handover timeline controlled."
      />

      {showTableSkeleton ? (
        <div className="table-shell animate-fade-rise">
          <div className="px-4 pt-4">
            <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-sora)" }}>
              Pickup Schedules
            </h2>
          </div>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Food</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Pickup Slot</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Requested At</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <TableRowSkeleton columns={5} rows={4} />
            </tbody>
          </table>
        </div>
      ) : (
        <PickupSchedulesTable
          schedules={schedules}
          donationLookup={donationLookup}
          updatingScheduleId={updatingScheduleId}
          onApprove={handleApproveSchedule}
          onReject={handleRejectSchedule}
        />
      )}
    </section>
  );
}
