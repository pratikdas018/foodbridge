export function DashboardShell({
  title,
  subtitle,
  tone = "default",
  children,
}: {
  title: string;
  subtitle: string;
  tone?: "restaurant" | "ngo" | "admin" | "default";
  children: React.ReactNode;
}) {
  const toneClassMap: Record<typeof tone, string> = {
    restaurant: "from-cyan-600 via-sky-600 to-blue-700 text-white border-sky-200",
    ngo: "from-emerald-500 via-teal-600 to-cyan-700 text-white border-emerald-200",
    admin: "from-fuchsia-600 via-violet-600 to-indigo-700 text-white border-violet-200",
    default: "from-slate-700 to-slate-900 text-white border-slate-200",
  };

  return (
    <section className="space-y-6">
      <header
        className={`panel-hero bg-gradient-to-r ${toneClassMap[tone]} animate-fade-rise`}
      >
        <p className="section-kicker text-white/80">Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-sora)" }}>
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/90">{subtitle}</p>
      </header>

      {children}
    </section>
  );
}
