const impactSegments = [
  { label: "Meals Delivered", percent: 52, amount: "68.2K meals", color: "#0f4c81" },
  { label: "Health & Nutrition", percent: 28, amount: "36.7K people", color: "#1f8a70" },
  { label: "Community Welfare", percent: 20, amount: "26.1K families", color: "#9f7a34" },
];

const socialHighlights = [
  {
    title: "Meals Shared",
    value: "131,000+",
    description: "Safe surplus food redirected to communities instead of landfill.",
  },
  {
    title: "Waste Prevented",
    value: "74 Tons",
    description: "Estimated food waste avoided through live rescue coordination.",
  },
  {
    title: "Lives Supported",
    value: "42,500+",
    description: "People reached through verified NGO distribution networks.",
  },
];

const chartStops = impactSegments
  .reduce<Array<{ from: number; to: number; color: string }>>((acc, segment) => {
    const last = acc[acc.length - 1];
    const from = last ? last.to : 0;
    const to = from + segment.percent;

    return [...acc, { from, to, color: segment.color }];
  }, [])
  .map((item) => `${item.color} ${item.from}% ${item.to}%`)
  .join(", ");

export function SocialImpactSection() {
  return (
    <section className="surface-card animate-fade-rise overflow-hidden border-slate-200 bg-gradient-to-b from-slate-50 to-white p-6 sm:p-8">
      <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <p className="section-kicker text-slate-600">Our Social Impact</p>
          <h2
            className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl"
            style={{ fontFamily: "var(--font-sora)" }}
          >
            From Donations To Real Community Outcomes
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
            FoodBridge helps restaurants and NGOs convert surplus meals into measurable social
            value. Every successful pickup creates healthier communities, lower food waste, and
            stronger local support systems.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {socialHighlights.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {item.title}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
            <p className="text-sm font-semibold text-slate-800">Support In Action</p>
            <p className="mt-1 text-sm text-slate-700">
              Share your impact story with your team and community: every rescued meal proves that
              technology + collaboration can feed more people with dignity.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="relative mx-auto h-72 w-72 max-w-full">
            <div
              aria-hidden="true"
              className="h-full w-full rounded-full"
              style={{
                background: `conic-gradient(${chartStops})`,
              }}
            />
            <div className="absolute inset-[20%] flex flex-col items-center justify-center rounded-full border border-slate-200 bg-white text-center shadow-inner">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total Impact</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">131K+</p>
              <p className="text-xs text-slate-500">Meals Coordinated</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {impactSegments.map((segment) => (
              <div key={segment.label} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="font-medium text-slate-700">{segment.label}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{segment.percent}%</p>
                  <p className="text-xs text-slate-500">{segment.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
