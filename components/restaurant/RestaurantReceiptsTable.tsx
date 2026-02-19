import { Button } from "@/components/ui/Button";
import { downloadPickupReceiptPdf } from "@/lib/receipt-pdf";
import type { AppUser, Donation, PickupSchedule } from "@/types";

function formatDate(value: Date | null): string {
  if (!value) {
    return "-";
  }

  return value.toLocaleString();
}

export function RestaurantReceiptsTable({
  donations,
  schedulesByDonationId,
  restaurantName,
  ngoLookup,
}: {
  donations: Donation[];
  schedulesByDonationId: Record<string, PickupSchedule>;
  restaurantName: string;
  ngoLookup: Record<string, AppUser>;
}) {
  const completedDonations = donations.filter((donation) => donation.status === "completed");

  return (
    <div className="table-shell animate-fade-rise">
      <div className="px-4 pt-4">
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-sora)" }}>
          Download Receipts
        </h2>
      </div>

      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Food</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">NGO</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Pickup Time</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Receipt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {completedDonations.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                No completed donations yet.
              </td>
            </tr>
          ) : (
            completedDonations.map((donation) => {
              const schedule = schedulesByDonationId[donation.id];
              const ngoName = schedule?.ngoId
                ? (ngoLookup[schedule.ngoId]?.name ?? "NGO Partner")
                : "NGO Partner";

              return (
                <tr key={donation.id}>
                  <td className="px-4 py-3">{donation.foodName}</td>
                  <td className="px-4 py-3">{ngoName}</td>
                  <td className="px-4 py-3">
                    {formatDate(
                      schedule?.pickupTime?.toDate() ?? donation.completedAt?.toDate() ?? null,
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {schedule ? (
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
                        Download PDF
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-500">No schedule</span>
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
