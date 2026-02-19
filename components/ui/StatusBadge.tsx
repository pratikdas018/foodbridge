import { clsx } from "clsx";

const colorByStatus: Record<string, string> = {
  available: "bg-green-100 text-green-600 ring-1 ring-green-200",
  claimed: "bg-yellow-100 text-yellow-600 ring-1 ring-yellow-200",
  in_progress: "bg-blue-100 text-blue-600 ring-1 ring-blue-200",
  completed: "bg-gray-200 text-gray-700 ring-1 ring-gray-300",
  pending: "bg-orange-100/90 text-orange-800 ring-1 ring-orange-200",
  approved: "bg-emerald-100/90 text-emerald-800 ring-1 ring-emerald-200",
  rejected: "bg-rose-100/90 text-rose-800 ring-1 ring-rose-200",
};

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        colorByStatus[status] ?? "bg-slate-100 text-slate-700",
      )}
    >
      {formatStatusLabel(status)}
    </span>
  );
}
