"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { fetchAdminAnalytics, type AdminAnalytics } from "@/services/admin-analytics.service";

const cardStyles = [
  "from-cyan-500 via-sky-600 to-blue-700",
  "from-emerald-500 via-teal-600 to-cyan-700",
  "from-amber-500 via-orange-500 to-rose-500",
  "from-violet-500 via-fuchsia-600 to-indigo-700",
  "from-lime-500 via-green-600 to-emerald-700",
];

function AnalyticsCardSkeleton() {
  return (
    <div className="h-36 animate-pulse rounded-2xl border border-sky-100 bg-white/70 p-4">
      <div className="h-3 w-20 rounded bg-slate-200" />
      <div className="mt-4 h-8 w-16 rounded bg-slate-200" />
      <div className="mt-4 h-3 w-28 rounded bg-slate-200" />
    </div>
  );
}

export function AdminAnalyticsCards() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const next = await fetchAdminAnalytics();
      setAnalytics(next);
      setError(null);
    } catch {
      setError("Unable to load analytics right now.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics(false);
  }, [loadAnalytics]);

  const metrics = useMemo(
    () =>
      analytics
        ? [
            {
              label: "Total Donations",
              value: analytics.totalDonations,
              helper: "All donation records",
            },
            {
              label: "Completed Donations",
              value: analytics.completedDonations,
              helper: "Successfully finished",
            },
            {
              label: "Claimed Donations",
              value: analytics.claimedDonations,
              helper: "Awaiting pickup completion",
            },
            {
              label: "Total NGOs",
              value: analytics.totalNgos,
              helper: "Verified NGO accounts",
            },
            {
              label: "Total Restaurants",
              value: analytics.totalRestaurants,
              helper: "Active restaurant accounts",
            },
          ]
        : [],
    [analytics],
  );

  return (
    <section className="space-y-3 animate-fade-rise">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-kicker">Admin Analytics</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-sora)" }}>
            Platform Health Snapshot
          </h2>
        </div>

        <Button
          isLoading={isRefreshing}
          onClick={() => void loadAnalytics(true)}
          variant="secondary"
        >
          Refresh Stats
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <AnalyticsCardSkeleton key={`analytics-skeleton-${index}`} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric, index) => (
            <article
              className={`relative overflow-hidden rounded-2xl border border-white/25 bg-gradient-to-br ${cardStyles[index]} p-4 text-white shadow-md`}
              key={metric.label}
            >
              <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/15 blur-xl" />
              <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                {metric.label}
              </p>
              <p className="mt-3 text-4xl font-extrabold leading-none">{metric.value}</p>
              <p className="mt-3 text-xs font-medium text-white/85">{metric.helper}</p>
            </article>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500">
        Last updated: {analytics?.refreshedAt.toLocaleString() ?? "-"}
      </p>
    </section>
  );
}
