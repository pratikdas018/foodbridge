import { clsx } from "clsx";
import type { FreshnessRiskLevel } from "@/types";

const riskColorMap: Record<FreshnessRiskLevel, string> = {
  low: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  medium: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  high: "bg-rose-100 text-rose-800 ring-1 ring-rose-200",
};

function toLabel(value: FreshnessRiskLevel): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function AiRiskBadge({ riskLevel }: { riskLevel: FreshnessRiskLevel }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        riskColorMap[riskLevel],
      )}
    >
      AI Freshness Risk: {toLabel(riskLevel)}
    </span>
  );
}
