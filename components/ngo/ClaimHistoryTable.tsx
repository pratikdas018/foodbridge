"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { downloadPickupReceiptPdf } from "@/lib/receipt-pdf";
import type { AppUser, Claim, Donation, PickupSchedule } from "@/types";

function formatDate(value: Date | null): string {
  if (!value) {
    return "-";
  }

  return value.toLocaleString();
}

function toDateTimeLocalInputValue(value: Date): string {
  const offsetMs = value.getTimezoneOffset() * 60000;
  const localDate = new Date(value.getTime() - offsetMs);
  return localDate.toISOString().slice(0, 16);
}

export function ClaimHistoryTable({
  claims,
  donationLookup,
  scheduleLookup,
  ngoName,
  userLookup,
  updatingClaimId,
  schedulingClaimId,
  onSchedulePickup,
  onMarkInProgress,
  onMarkCompleted,
}: {
  claims: Claim[];
  donationLookup: Record<string, Donation>;
  scheduleLookup: Record<string, PickupSchedule>;
  ngoName: string;
  userLookup: Record<string, AppUser>;
  updatingClaimId: string | null;
  schedulingClaimId: string | null;
  onSchedulePickup: (claimId: string, pickupTimeIso: string) => Promise<void>;
  onMarkInProgress: (claimId: string) => Promise<void>;
  onMarkCompleted: (claimId: string, proofImageFile: File) => Promise<void>;
}) {
  const [proofFiles, setProofFiles] = useState<Record<string, File | null>>({});
  const [pickupSlots, setPickupSlots] = useState<Record<string, string>>({});

  return (
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
          {claims.length === 0 ? (
            <tr>
              <td className="px-3 py-6 text-center text-slate-500" colSpan={8}>
                No claims yet.
              </td>
            </tr>
          ) : (
            claims.map((claim) => {
              const donation = donationLookup[claim.donationId];
              const schedule = scheduleLookup[claim.id];
              const selectedProof = proofFiles[claim.id] ?? null;
              const rowIsBusy = updatingClaimId === claim.id;
              const rowIsScheduling = schedulingClaimId === claim.id;
              const scheduleApproved = schedule?.status === "approved";
              const canSubmitSchedule =
                claim.pickupStatus !== "completed" &&
                (!schedule || schedule.status === "rejected");
              const restaurantName = donation
                ? (userLookup[donation.restaurantId]?.name ?? "Restaurant Partner")
                : "Restaurant Partner";
              const scheduleInputValue =
                pickupSlots[claim.id] ??
                (schedule?.pickupTime ? toDateTimeLocalInputValue(schedule.pickupTime.toDate()) : "");

              return (
                <tr key={claim.id}>
                  <td className="px-4 py-3">{donation?.foodName ?? "Deleted donation"}</td>
                  <td className="px-4 py-3">{donation?.address ?? "-"}</td>
                  <td className="px-4 py-3">
                    {claim.claimedAt?.toDate().toLocaleString() ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    {formatDate(schedule?.pickupTime?.toDate() ?? null)}
                  </td>
                  <td className="px-4 py-3">
                    {schedule ? (
                      <div className="space-y-1">
                        <StatusBadge status={schedule.status} />
                        {schedule.status === "rejected" && schedule.rejectionReason ? (
                          <p className="text-xs text-rose-600">{schedule.rejectionReason}</p>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Not scheduled</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={claim.pickupStatus} />
                  </td>
                  <td className="px-4 py-3">
                    {claim.proofImageUrl ? (
                      <div className="flex items-center gap-2">
                        <Image
                          alt="Proof"
                          className="h-9 w-9 rounded-md object-cover"
                          height={36}
                          src={claim.proofImageUrl}
                          width={36}
                        />
                        <a
                          className="text-xs font-medium text-brand-700 hover:underline"
                          href={claim.proofImageUrl}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          View
                        </a>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Not uploaded</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {canSubmitSchedule ? (
                      <div className="mb-3 space-y-2 rounded-lg border border-sky-100 bg-sky-50/60 p-2">
                        <input
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
                          type="datetime-local"
                          value={scheduleInputValue}
                          onChange={(event) =>
                            setPickupSlots((prev) => ({
                              ...prev,
                              [claim.id]: event.target.value,
                            }))
                          }
                        />
                        <Button
                          isLoading={rowIsScheduling}
                          onClick={() => onSchedulePickup(claim.id, scheduleInputValue)}
                          disabled={!scheduleInputValue}
                          variant="secondary"
                        >
                          {schedule?.status === "rejected" ? "Resubmit Slot" : "Submit Slot"}
                        </Button>
                      </div>
                    ) : null}

                    {schedule?.status === "pending" ? (
                      <p className="mb-2 text-xs font-medium text-amber-700">
                        Waiting for restaurant approval.
                      </p>
                    ) : null}

                    {schedule?.status === "approved" ? (
                      <p className="mb-2 text-xs font-medium text-emerald-700">
                        Pickup slot approved by restaurant.
                      </p>
                    ) : null}

                    {claim.pickupStatus === "claimed" ? (
                      <Button
                        variant="secondary"
                        isLoading={rowIsBusy}
                        disabled={!scheduleApproved}
                        onClick={() => onMarkInProgress(claim.id)}
                      >
                        Mark In Progress
                      </Button>
                    ) : null}

                    {claim.pickupStatus === "in_progress" ? (
                      <div className="space-y-2">
                        <input
                          accept="image/*"
                          className="block w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 file:mr-2 file:rounded-md file:border-0 file:bg-sky-600 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-sky-700"
                          type="file"
                          onChange={(event) => {
                            const file = event.target.files?.[0] ?? null;
                            setProofFiles((prev) => ({ ...prev, [claim.id]: file }));
                          }}
                        />
                        <Button
                          isLoading={rowIsBusy}
                          onClick={() => {
                            if (!selectedProof) {
                              return;
                            }

                            return onMarkCompleted(claim.id, selectedProof);
                          }}
                          variant="primary"
                          disabled={!selectedProof || !scheduleApproved}
                        >
                          Mark Completed
                        </Button>
                      </div>
                    ) : null}

                    {claim.pickupStatus === "completed" ? (
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-emerald-700">Completed</span>
                        {donation ? (
                          <Button
                            className="px-3 py-1.5 text-xs"
                            variant="secondary"
                            onClick={() =>
                              downloadPickupReceiptPdf({
                                receiptId: claim.id,
                                ngoName,
                                restaurantName,
                                pickupTime:
                                  schedule?.pickupTime?.toDate() ??
                                  claim.completedAt?.toDate() ??
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
                            Download Receipt
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
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
