import type { NgoRatingSummary } from "@/types";

export function NgoProfileCard({
  ngoName,
  summary,
}: {
  ngoName: string;
  summary: NgoRatingSummary;
}) {
  return (
    <section className="surface-card animate-fade-rise">
      <p className="section-kicker">NGO Profile</p>
      <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-sora)" }}>
        {ngoName}
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Average Rating
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-900">
            {summary.averageRating.toFixed(1)} / 5
          </p>
          <p className="mt-1 text-sm text-amber-700">Rated by completed donations.</p>
        </div>
        <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            Total Ratings
          </p>
          <p className="mt-1 text-2xl font-bold text-sky-900">{summary.totalRatings}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Trust Signal
          </p>
          <p className="mt-1 text-sm font-medium text-emerald-800">
            Higher ratings improve restaurant confidence.
          </p>
        </div>
      </div>
    </section>
  );
}
