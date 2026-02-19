import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <section className="mx-auto max-w-xl surface-card space-y-3 text-center">
      <p className="section-kicker">Permission</p>
      <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "var(--font-sora)" }}>
        Access Denied
      </h1>
      <p className="text-sm text-slate-600">
        You do not have permission to access this page.
      </p>
      <div>
        <Link className="text-sm font-semibold text-sky-700 hover:text-sky-800" href="/">
          Go back to Home
        </Link>
      </div>
    </section>
  );
}
