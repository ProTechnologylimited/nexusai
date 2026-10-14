export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-200" />)}
      </div>
    </div>
  );
}
