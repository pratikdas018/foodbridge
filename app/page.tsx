import Link from "next/link";
import { ImpactDashboard } from "@/components/home/ImpactDashboard";
import { SocialImpactSection } from "@/components/home/SocialImpactSection";
import { WhoWeAreSection } from "@/components/home/WhoWeAreSection";

export default function HomePage() {
  const features = [
    {
      title: "Real-Time Donation Feed",
      description:
        "NGOs get instant access to new food listings with address, map location, expiry time, and media.",
      tone: "from-cyan-500 to-sky-600",
    },
    {
      title: "Proof-Based Completion",
      description:
        "Pickup lifecycle is tracked from claim to completion with proof image upload for full transparency.",
      tone: "from-emerald-500 to-teal-600",
    },
    {
      title: "Admin Governance",
      description:
        "Admins can moderate users and donations, update statuses, and maintain a reliable ecosystem.",
      tone: "from-violet-500 to-indigo-600",
    },
  ];

  const workflow = [
    "Restaurant posts surplus food with quantity, timing, and exact map pin.",
    "Nearby NGO claims the donation and starts pickup with live status tracking.",
    "NGO completes distribution and uploads proof to close the loop.",
  ];

  return (
    <section className="space-y-8">
      <div className="panel-hero animate-fade-rise overflow-hidden border-sky-200 bg-gradient-to-br from-sky-700 via-cyan-700 to-emerald-600 p-8 text-white sm:p-12">
        <div className="absolute -right-16 top-0 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-emerald-200/25 blur-2xl" />

        <p className="section-kicker text-white/80">FoodBridge Platform</p>
        <h1
          className="mt-3 max-w-4xl text-4xl font-bold leading-tight sm:text-6xl"
          style={{ fontFamily: "var(--font-sora)" }}
        >
          Rescue Surplus Food. Deliver Dignity At Scale.
        </h1>
        <p className="mt-5 max-w-2xl text-sm text-white/90 sm:text-base">
          FoodBridge is a production-ready coordination platform that connects restaurants,
          NGOs, and administrators in real time. Instead of waste, surplus meals are redirected
          to verified pickup partners and distributed to people in need.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-sky-700 shadow-md transition hover:bg-sky-50"
          >
            Start Donating
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-white/70 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Login
          </Link>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/25 bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wide text-white/80">Real-Time Sync</p>
            <p className="mt-1 text-lg font-semibold">Live Firestore Updates</p>
          </div>
          <div className="rounded-xl border border-white/25 bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wide text-white/80">Role Security</p>
            <p className="mt-1 text-lg font-semibold">Restaurant / NGO / Admin</p>
          </div>
          <div className="rounded-xl border border-white/25 bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wide text-white/80">Verification</p>
            <p className="mt-1 text-lg font-semibold">Proof-Based Completion</p>
          </div>
        </div>
      </div>

      <WhoWeAreSection />
      <ImpactDashboard />
      <SocialImpactSection />

      <div className="grid gap-4 md:grid-cols-3">
        <article className="surface-card animate-fade-rise bg-gradient-to-br from-cyan-50 to-sky-100/70">
          <h2 className="text-lg font-bold text-slate-900">For Restaurants</h2>
          <p className="mt-2 text-sm text-slate-700">
            Post surplus meals in minutes with quantity, pickup address, map coordinates,
            availability window, image/video, and donation notes.
          </p>
        </article>

        <article className="surface-card animate-fade-rise bg-gradient-to-br from-emerald-50 to-teal-100/70">
          <h2 className="text-lg font-bold text-slate-900">For NGOs</h2>
          <p className="mt-2 text-sm text-slate-700">
            Claim nearby donations instantly, track pickup progress through all lifecycle states,
            and upload proof after distribution.
          </p>
        </article>

        <article className="surface-card animate-fade-rise bg-gradient-to-br from-violet-50 to-indigo-100/70">
          <h2 className="text-lg font-bold text-slate-900">For Admins</h2>
          <p className="mt-2 text-sm text-slate-700">
            Operate the platform with complete visibility: user management, donation moderation,
            status corrections, and compliance control.
          </p>
        </article>
      </div>

      <div className="surface-card animate-fade-rise">
        <p className="section-kicker">How It Works</p>
        <h2 className="section-title mt-2">A Trusted End-To-End Donation Workflow</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {workflow.map((step, index) => (
            <div key={step} className="rounded-xl border border-sky-100 bg-sky-50/45 p-4">
              <p className="text-sm font-bold text-sky-700">Step {index + 1}</p>
              <p className="mt-2 text-sm text-slate-700">{step}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <article className="surface-card animate-fade-rise" key={feature.title}>
            <span
              className={`inline-block h-2.5 w-12 rounded-full bg-gradient-to-r ${feature.tone}`}
            />
            <h3 className="mt-3 text-lg font-bold text-slate-900">{feature.title}</h3>
            <p className="mt-2 text-sm text-slate-700">{feature.description}</p>
          </article>
        ))}
      </div>

      <div className="panel-hero animate-fade-rise border-emerald-200 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-700 text-white">
        <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-sora)" }}>
          Build Community Impact With Every Donation
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-white/90">
          FoodBridge is designed for reliability, accountability, and speed so organizations can
          focus on feeding people, not coordinating spreadsheets and phone calls.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
          >
            Join As Restaurant / NGO
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-white/70 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
