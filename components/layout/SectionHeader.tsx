export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="animate-fade-rise">
      <p className="section-kicker">Workspace</p>
      <h1 className="section-title" style={{ fontFamily: "var(--font-sora)" }}>
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-600">{description}</p>
    </header>
  );
}
