export function DonationCardSkeleton() {
  return (
    <article className="animate-pulse rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm">
      <div className="mb-3 h-40 w-full rounded-lg bg-gray-200" />
      <div className="h-5 w-1/2 rounded-lg bg-gray-200" />
      <div className="mt-3 flex gap-2">
        <div className="h-6 w-20 rounded-lg bg-gray-200" />
        <div className="h-6 w-24 rounded-lg bg-gray-200" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-4 w-2/3 rounded-lg bg-gray-200" />
        <div className="h-4 w-full rounded-lg bg-gray-200" />
        <div className="h-4 w-5/6 rounded-lg bg-gray-200" />
      </div>
      <div className="mt-3 h-24 w-full rounded-lg bg-gray-200" />
      <div className="mt-3 h-10 w-36 rounded-lg bg-gray-200" />
    </article>
  );
}
