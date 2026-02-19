import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { downloadPickupReceiptPdf } from "@/lib/receipt-pdf";
import { useState } from "react";
import type { AppUser, Donation, NgoRating, PickupSchedule } from "@/types";

function formatDate(value: Date | null): string {
  if (!value) {
    return "-";
  }

  return value.toLocaleString();
}

export function MyDonationsTable({
  donations,
  schedulesByDonationId,
  ratingsByDonationId,
  ratingDonationId,
  restaurantName,
  ngoLookup,
  showRatingActions = true,
  showReceiptActions = true,
  onRateNgo,
}: {
  donations: Donation[];
  schedulesByDonationId: Record<string, PickupSchedule>;
  ratingsByDonationId: Record<string, NgoRating>;
  ratingDonationId: string | null;
  restaurantName: string;
  ngoLookup: Record<string, AppUser>;
  showRatingActions?: boolean;
  showReceiptActions?: boolean;
  onRateNgo: (payload: {
    donationId: string;
    claimId: string;
    ngoId: string;
    rating: number;
  }) => Promise<void>;
}) {
  const [pendingRatings, setPendingRatings] = useState<Record<string, number>>({});

  return (
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
            {showRatingActions ? (
              <th className="px-4 py-3 text-left font-semibold text-slate-700">NGO Rating</th>
            ) : null}
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
            {showReceiptActions ? (
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Receipt</th>
            ) : null}
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Proof</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {donations.length === 0 ? (
            <tr>
              <td
                colSpan={
                  7 + (showRatingActions ? 1 : 0) + (showReceiptActions ? 1 : 0)
                }
                className="px-3 py-6 text-center text-slate-500"
              >
                No donations created yet.
              </td>
            </tr>
          ) : (
            donations.map((donation) => {
              const schedule = schedulesByDonationId[donation.id];
              const rating = ratingsByDonationId[donation.id];
              const pendingRating = pendingRatings[donation.id] ?? 5;
              const canRate = donation.status === "completed" && Boolean(schedule?.ngoId);
              const ngoName = schedule?.ngoId
                ? (ngoLookup[schedule.ngoId]?.name ?? "NGO Partner")
                : "NGO Partner";

              return (
                <tr key={donation.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {donation.imageUrl ? (
                        <Image
                          src={donation.imageUrl}
                          alt={donation.foodName}
                          width={44}
                          height={44}
                          className="rounded-md object-cover"
                        />
                      ) : donation.videoUrl ? (
                        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-sky-100 text-[10px] font-semibold text-sky-700">
                          VIDEO
                        </div>
                      ) : (
                        <div className="h-11 w-11 rounded-md bg-slate-200" />
                      )}
                      <span>{donation.foodName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{donation.quantity}</td>
                  <td className="px-4 py-3">
                    {formatDate(donation.availableTill?.toDate() ?? null)}
                  </td>
                  <td className="px-4 py-3">
                    {formatDate(schedule?.pickupTime?.toDate() ?? null)}
                  </td>
                  <td className="px-4 py-3">
                    {schedule ? (
                      <StatusBadge status={schedule.status} />
                    ) : (
                      <span className="text-xs text-slate-500">Not requested</span>
                    )}
                  </td>
                  {showRatingActions ? (
                    <td className="px-4 py-3">
                      {rating ? (
                        <span className="text-sm font-semibold text-amber-700">
                          {rating.rating} / 5
                        </span>
                      ) : canRate ? (
                        <div className="flex items-center gap-2">
                          <select
                            className="fancy-select py-1.5 text-xs"
                            value={pendingRating}
                            onChange={(event) =>
                              setPendingRatings((prev) => ({
                                ...prev,
                                [donation.id]: Number(event.target.value),
                              }))
                            }
                          >
                            {[1, 2, 3, 4, 5].map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                          <Button
                            variant="secondary"
                            className="px-3 py-1.5 text-xs"
                            isLoading={ratingDonationId === donation.id}
                            onClick={() => {
                              if (!schedule) {
                                return;
                              }

                              return onRateNgo({
                                donationId: donation.id,
                                claimId: schedule.claimId,
                                ngoId: schedule.ngoId,
                                rating: pendingRating,
                              });
                            }}
                          >
                            Rate NGO
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">
                          Available after completion
                        </span>
                      )}
                    </td>
                  ) : null}
                  <td className="px-4 py-3">
                    <StatusBadge status={donation.status} />
                  </td>
                  {showReceiptActions ? (
                    <td className="px-4 py-3">
                      {donation.status === "completed" && schedule ? (
                        <Button
                          className="px-3 py-1.5 text-xs"
                          variant="secondary"
                          onClick={() =>
                            downloadPickupReceiptPdf({
                              receiptId: schedule.claimId,
                              ngoName,
                              restaurantName,
                              pickupTime:
                                schedule.pickupTime?.toDate() ??
                                donation.completedAt?.toDate() ??
                                null,
                              donation: {
                                foodName: donation.foodName,
                                quantity: donation.quantity,
                                address: donation.address,
                                description: donation.description,
                              },
                            })
                          }
                        >
                          Download
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-500">After completion</span>
                      )}
                    </td>
                  ) : null}
                  <td className="px-4 py-3">
                    {donation.proofImageUrl ? (
                      <div className="flex items-center gap-2">
                        <Image
                          alt="Donation proof"
                          className="h-9 w-9 rounded-md object-cover"
                          height={36}
                          src={donation.proofImageUrl}
                          width={36}
                        />
                        <a
                          className="text-xs font-medium text-brand-700 hover:underline"
                          href={donation.proofImageUrl}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          View
                        </a>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Pending</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
