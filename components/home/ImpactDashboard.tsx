"use client";

import { useEffect, useState } from "react";

interface ImpactStatsResponse {
  totalMealsSaved: number;
  wasteReducedKg: number;
  successfulPickups: number;
  activeNgos: number;
  updatedAt: string;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

const impactCards: Array<{
  key: keyof Pick<
    ImpactStatsResponse,
    "totalMealsSaved" | "wasteReducedKg" | "successfulPickups" | "activeNgos"
  >;
  label: string;
  helper: string;
  tone: string;
}> = [
  {
    key: "totalMealsSaved",
    label: "Total Meals Saved",
    helper: "Estimated meals redirected to people in need.",
    tone: "from-cyan-500 via-sky-600 to-blue-700",
  },
  {
    key: "wasteReducedKg",
    label: "Waste Reduced",
    helper: "Estimated food waste prevented (kg).",
    tone: "from-emerald-500 via-teal-600 to-cyan-700",
  },
  {
    key: "successfulPickups",
    label: "Successful Pickups",
    helper: "Donations completed with full lifecycle tracking.",
    tone: "from-violet-500 via-indigo-600 to-blue-700",
  },
  {
    key: "activeNgos",
    label: "Active NGOs",
    helper: "Verified NGOs currently marked available.",
    tone: "from-amber-500 via-orange-500 to-rose-600",
  },
];

export function ImpactDashboard() {
  const [stats, setStats] = useState<ImpactStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/impact-stats", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to fetch impact dashboard stats.");
        }

        const payload = (await response.json()) as ImpactStatsResponse;

        if (!cancelled) {
          setStats(payload);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("Impact metrics are temporarily unavailable.");
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="surface-card animate-fade-rise">
      <p className="section-kicker">Impact Dashboard</p>
      <h2 className="section-title mt-2">Live Community Impact</h2>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {impactCards.map((card) => {
          const value = stats ? stats[card.key] : null;

          return (
            <article
              className={`relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br ${card.tone} p-4 text-white shadow-md`}
              key={card.key}
            >
              <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/20 blur-xl" />
              <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                {card.label}
              </p>
              <p className="mt-3 text-4xl font-extrabold leading-none">
                {value === null
                  ? "..."
                  : card.key === "wasteReducedKg"
                    ? `${formatNumber(value)} kg`
                    : formatNumber(value)}
              </p>
              <p className="mt-3 text-xs font-medium text-white/85">{card.helper}</p>
            </article>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Last updated: {stats ? new Date(stats.updatedAt).toLocaleString() : "-"}
      </p>
    </section>
  );
}
