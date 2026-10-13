// A static illustration built from simple shapes. It contains no real or invented figures.
export function DashboardPreview() {
  const labels = ["Active AI Agents", "Workflows", "Leads", "Campaigns"];
  return (
    <figure aria-label="Illustration of the Nexus AI dashboard">
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
        <div className="flex items-center gap-1.5 border-b border-line bg-slate-50 px-4 py-3" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-slate-300" /><span className="size-2.5 rounded-full bg-slate-300" /><span className="size-2.5 rounded-full bg-slate-300" />
        </div>
        <div className="grid grid-cols-[7rem_1fr] sm:grid-cols-[10rem_1fr]" aria-hidden="true">
          <div className="space-y-2 bg-ink p-4">
            {[true, false, false, false, false, false].map((active, i) => <div key={i} className={`h-6 rounded-md ${active ? "bg-brand" : "bg-white/10"}`} />)}
          </div>
          <div className="space-y-4 bg-canvas p-4 sm:p-6">
            <div className="h-4 w-1/2 rounded bg-slate-300" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {labels.map((l) => (
                <div key={l} className="rounded-xl border border-line bg-white p-3">
                  <p className="text-[10px] text-muted sm:text-xs">{l}</p>
                  <div className="mt-2 h-5 w-8 rounded bg-brand-soft" />
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 rounded-xl border border-line bg-white p-3">{[80, 55, 35].map((w) => <div key={w} className="h-2 rounded-full bg-brand/70" style={{ width: `${w}%` }} />)}</div>
              <div className="space-y-2 rounded-xl border border-line bg-white p-3">{[90, 70, 50].map((w) => <div key={w} className="h-2 rounded-full bg-slate-200" style={{ width: `${w}%` }} />)}</div>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted">Illustration only. It does not show real data or results.</figcaption>
    </figure>
  );
}
