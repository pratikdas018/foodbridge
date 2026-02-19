import Image from "next/image";
import Link from "next/link";

export function WhoWeAreSection() {
  return (
    <section className="surface-card animate-fade-rise overflow-hidden border-sky-100 p-0">
      <div className="grid items-stretch gap-0 lg:grid-cols-[1.05fr_1fr]">
        <div className="p-6 sm:p-8">
          <p className="section-kicker">About FoodBridge</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl" style={{ fontFamily: "var(--font-sora)" }}>
            Who We Are?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-700 sm:text-base">
            FoodBridge is a social impact platform built to reduce food waste and increase food
            access. We connect restaurants with surplus meals to verified NGOs that can collect,
            distribute, and track every donation in real time.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">
            Our goal is simple: convert daily surplus into dignified support for people who need
            it most, with transparency for restaurants, accountability for NGOs, and governance for
            admins.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <article className="rounded-xl border border-sky-100 bg-sky-50/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Mission</p>
              <p className="mt-1 text-sm font-medium text-slate-800">Rescue every possible meal</p>
            </article>
            <article className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Vision</p>
              <p className="mt-1 text-sm font-medium text-slate-800">Zero edible food wasted</p>
            </article>
            <article className="rounded-xl border border-violet-100 bg-violet-50/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Values</p>
              <p className="mt-1 text-sm font-medium text-slate-800">Trust, speed, and dignity</p>
            </article>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:opacity-90"
            >
              Join The Mission
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-sky-100 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-300 ease-in-out hover:bg-sky-50"
            >
              Open Dashboard
            </Link>
          </div>
        </div>

        <div className="relative min-h-[320px] bg-gradient-to-br from-sky-100 via-cyan-50 to-emerald-100 p-5 sm:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(14,165,233,0.18),transparent_34%),radial-gradient(circle_at_78%_80%,rgba(16,185,129,0.2),transparent_32%)]" />
          <div className="relative h-full overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-lg">
            <Image
              src="/images/who-we-are-foodbridge.svg"
              alt="FoodBridge connects restaurants and NGOs to deliver surplus food to communities in need"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 45vw"
              priority={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
