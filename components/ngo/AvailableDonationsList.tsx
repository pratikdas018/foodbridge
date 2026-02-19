import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { AiRiskBadge } from "@/components/ui/AiRiskBadge";
import { AddressMap } from "@/components/ui/AddressMap";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Donation } from "@/types";

export function AvailableDonationsList({
  donations,
  claimingDonationId,
  canClaim,
  claimDisabledReason,
  onClaim,
}: {
  donations: Donation[];
  claimingDonationId: string | null;
  canClaim: boolean;
  claimDisabledReason: string;
  onClaim: (donationId: string) => Promise<void>;
}) {
  const sortedDonations = [...donations].sort((a, b) => {
    if (b.pickupPriorityScore !== a.pickupPriorityScore) {
      return b.pickupPriorityScore - a.pickupPriorityScore;
    }

    const aExpirySec = a.availableTill?.seconds ?? Number.MAX_SAFE_INTEGER;
    const bExpirySec = b.availableTill?.seconds ?? Number.MAX_SAFE_INTEGER;

    if (aExpirySec !== bExpirySec) {
      return aExpirySec - bExpirySec;
    }

    const aCreatedSec = a.createdAt?.seconds ?? 0;
    const bCreatedSec = b.createdAt?.seconds ?? 0;

    return bCreatedSec - aCreatedSec;
  });

  return (
    <div className="surface-card space-y-4 animate-fade-rise">
      <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-sora)" }}>
        Available Donations
      </h2>

      {donations.length === 0 ? (
        <p className="text-sm text-slate-500">No donations are available at the moment.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sortedDonations.map((donation) => (
            <article
              key={donation.id}
              className="rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {donation.videoUrl ? (
                <video
                  className="mb-3 h-40 w-full rounded-md object-cover"
                  controls
                  preload="metadata"
                  src={donation.videoUrl}
                />
              ) : donation.imageUrl ? (
                <Image
                  src={donation.imageUrl}
                  alt={donation.foodName}
                  width={600}
                  height={280}
                  className="mb-3 h-40 w-full rounded-md object-cover"
                />
              ) : null}

              <h3 className="text-lg font-bold text-slate-900">{donation.foodName}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={donation.status} />
                <AiRiskBadge riskLevel={donation.freshnessRiskLevel} />
                <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-800 ring-1 ring-indigo-200">
                  Priority: {donation.pickupPriorityScore}/5
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">Quantity: {donation.quantity}</p>
              <p className="mt-1 text-sm text-slate-600">Address: {donation.address}</p>
              <p className="mt-1 text-sm text-slate-600">{donation.description}</p>
              {donation.aiAnalysisReason ? (
                <p className="mt-1 text-xs text-slate-500">
                  AI note: {donation.aiAnalysisReason}
                </p>
              ) : null}
              <AddressMap
                address={donation.address}
                latitude={donation.latitude}
                longitude={donation.longitude}
              />
              <p className="mt-2 text-xs text-slate-500">
                Available till: {donation.availableTill?.toDate().toLocaleString() ?? "-"}
              </p>

              <Button
                className="mt-3"
                isLoading={claimingDonationId === donation.id}
                disabled={!canClaim}
                onClick={() => onClaim(donation.id)}
              >
                {canClaim ? "Claim Donation" : claimDisabledReason}
              </Button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
