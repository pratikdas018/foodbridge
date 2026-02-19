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

export function NgoReceiptsTable({
  claims,
  donationLookup,
  scheduleLookup,
  ngoName,
  userLookup,
}: {
  claims: Claim[];
  donationLookup: Record<string, Donation>;
  scheduleLookup: Record<string, PickupSchedule>;
  ngoName: string;
  userLookup: Record<string, AppUser>;
}) {
  const completedClaims = claims.filter((claim) => claim.pickupStatus === "completed");

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
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Restaurant</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Pickup Time</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Receipt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {completedClaims.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                No completed pickups yet.
              </td>
            </tr>
          ) : (
            completedClaims.map((claim) => {
              const donation = donationLookup[claim.donationId];
              const schedule = scheduleLookup[claim.id];
              const restaurantName = donation
                ? (userLookup[donation.restaurantId]?.name ?? "Restaurant Partner")
                : "Restaurant Partner";

              return (
                <tr key={claim.id}>
                  <td className="px-4 py-3">{donation?.foodName ?? "Deleted donation"}</td>
                  <td className="px-4 py-3">{restaurantName}</td>
                  <td className="px-4 py-3">
                    {formatDate(
                      schedule?.pickupTime?.toDate() ??
                        claim.completedAt?.toDate() ??
                        null,
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={claim.pickupStatus} />
                  </td>
                  <td className="px-4 py-3">
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
                        Download PDF
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-500">Unavailable</span>
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
