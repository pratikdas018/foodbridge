"use client";

import { AvailableDonationsList } from "@/components/ngo/AvailableDonationsList";
import { ClaimHistoryTable } from "@/components/ngo/ClaimHistoryTable";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { DonationCardSkeleton } from "@/components/ui/DonationCardSkeleton";
import { TableRowSkeleton } from "@/components/ui/TableRowSkeleton";
import { useNgoWorkspaceData } from "@/hooks/useNgoWorkspaceData";

export default function NgoClaimsPage() {
  const {
    availableDonations,
    claimHistory,
    donationLookup,
    scheduleLookup,
    user,
    profile,
    userLookup,
    availableDonationsLoading,
    claimHistoryLoading,
    schedulesLoading,
    claimingDonationId,
    updatingClaimId,
    schedulingClaimId,
    canClaim,
    claimDisabledReason,
    handleClaim,
    handleMarkInProgress,
    handleMarkCompleted,
    handleSchedulePickup,
  } = useNgoWorkspaceData();
  const showClaimTableSkeleton = claimHistoryLoading || schedulesLoading;

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Claims"
        description="Claim available donations, submit pickup slots, and track each donation through completion."
      />

      {profile && !profile.isVerified ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Your NGO account is not verified by admin yet. Claiming is disabled until verification.
        </div>
      ) : null}
      {profile && profile.availabilityStatus !== "available" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          NGO status is Busy. Switch to Available from the Availability page to claim donations.
        </div>
      ) : null}

      {availableDonationsLoading ? (
        <div className="surface-card space-y-4 animate-fade-rise">
          <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-sora)" }}>
            Available Donations
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <DonationCardSkeleton />
            <DonationCardSkeleton />
          </div>
        </div>
      ) : (
        <AvailableDonationsList
          donations={availableDonations}
          claimingDonationId={claimingDonationId}
          canClaim={canClaim}
          claimDisabledReason={claimDisabledReason}
          onClaim={handleClaim}
        />
      )}

      {showClaimTableSkeleton ? (
        <div className="table-shell animate-fade-rise">
          <div className="px-4 pt-4">
            <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-sora)" }}>
              Claim History
            </h2>
          </div>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Food</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Address</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Claimed At</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Pickup Slot</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Schedule Approval
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Proof</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <TableRowSkeleton columns={8} rows={4} />
            </tbody>
          </table>
        </div>
      ) : (
        <ClaimHistoryTable
          claims={claimHistory}
          donationLookup={donationLookup}
          scheduleLookup={scheduleLookup}
          ngoName={profile?.name ?? userLookup[user?.uid ?? ""]?.name ?? "NGO Partner"}
          userLookup={userLookup}
          updatingClaimId={updatingClaimId}
          schedulingClaimId={schedulingClaimId}
          onSchedulePickup={handleSchedulePickup}
          onMarkCompleted={handleMarkCompleted}
          onMarkInProgress={handleMarkInProgress}
        />
      )}
    </section>
  );
}
