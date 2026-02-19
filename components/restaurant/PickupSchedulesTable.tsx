"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Donation, PickupSchedule } from "@/types";

function formatDate(value: Date | null): string {
  if (!value) {
    return "-";
  }

  return value.toLocaleString();
}

export function PickupSchedulesTable({
  schedules,
  donationLookup,
  updatingScheduleId,
  onApprove,
  onReject,
}: {
  schedules: PickupSchedule[];
  donationLookup: Record<string, Donation>;
  updatingScheduleId: string | null;
  onApprove: (scheduleId: string) => Promise<void>;
  onReject: (scheduleId: string, reason: string) => Promise<void>;
}) {
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

  return (
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
          {schedules.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                No pickup schedules yet.
              </td>
            </tr>
          ) : (
            schedules.map((schedule) => {
              const donation = donationLookup[schedule.donationId];
              const rowBusy = updatingScheduleId === schedule.id;

              return (
                <tr key={schedule.id}>
                  <td className="px-4 py-3">{donation?.foodName ?? "Deleted donation"}</td>
                  <td className="px-4 py-3">
                    {formatDate(schedule.pickupTime?.toDate() ?? null)}
                  </td>
                  <td className="px-4 py-3">
                    {formatDate(schedule.requestedAt?.toDate() ?? null)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <StatusBadge status={schedule.status} />
                      {schedule.status === "rejected" && schedule.rejectionReason ? (
                        <p className="text-xs text-rose-600">{schedule.rejectionReason}</p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {schedule.status === "pending" ? (
                      <div className="space-y-2">
                        <input
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
                          type="text"
                          placeholder="Optional rejection reason"
                          value={rejectionReasons[schedule.id] ?? ""}
                          onChange={(event) =>
                            setRejectionReasons((prev) => ({
                              ...prev,
                              [schedule.id]: event.target.value,
                            }))
                          }
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            isLoading={rowBusy}
                            onClick={() => onApprove(schedule.id)}
                            variant="secondary"
                          >
                            Approve
                          </Button>
                          <Button
                            isLoading={rowBusy}
                            onClick={() =>
                              onReject(schedule.id, rejectionReasons[schedule.id] ?? "")
                            }
                            variant="danger"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-slate-600">No action pending</span>
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
