export function LoadingSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-sky-100 bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-sky-200 border-t-cyan-600" />
      <span>{label}</span>
    </div>
  );
}
