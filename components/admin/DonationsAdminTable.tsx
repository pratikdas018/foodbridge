"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { deleteDonationAction, updateDonationStatusAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Donation, DonationStatus } from "@/types";

const statusOptions: DonationStatus[] = ["available", "claimed", "in_progress", "completed"];

export function DonationsAdminTable({ donations }: { donations: Donation[] }) {
  const [isPending, startTransition] = useTransition();
  const [activeDonationId, setActiveDonationId] = useState<string | null>(null);

  const handleStatusUpdate = (donationId: string, status: DonationStatus) => {
    setActiveDonationId(donationId);

    startTransition(async () => {
      const result = await updateDonationStatusAction(donationId, status);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      setActiveDonationId(null);
    });
  };

  const handleDelete = (donationId: string) => {
    setActiveDonationId(donationId);

    startTransition(async () => {
      const result = await deleteDonationAction(donationId);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      setActiveDonationId(null);
    });
  };

  return (
    <div className="table-shell animate-fade-rise">
      <div className="px-4 pt-4">
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-sora)" }}>
          All Donations
        </h2>
      </div>

      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Food</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Restaurant ID</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {donations.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                No donations found.
              </td>
            </tr>
          ) : (
            donations.map((donation) => {
              const rowIsBusy = isPending && activeDonationId === donation.id;

              return (
                <tr key={donation.id}>
                  <td className="px-4 py-3">{donation.foodName}</td>
                  <td className="px-4 py-3">{donation.restaurantId}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={donation.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        className="fancy-select"
                        defaultValue={donation.status}
                        disabled={rowIsBusy}
                        onChange={(event) =>
                          handleStatusUpdate(
                            donation.id,
                            event.target.value as DonationStatus,
                          )
                        }
                      >
                        {statusOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>

                      <Button
                        variant="danger"
                        disabled={rowIsBusy}
                        onClick={() => handleDelete(donation.id)}
                      >
                        Delete
                      </Button>
                    </div>
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
