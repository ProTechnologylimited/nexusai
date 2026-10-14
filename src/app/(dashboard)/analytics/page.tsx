import type { Metadata } from "next";
import Link from "next/link";
import { ActivityChart } from "@/components/analytics/activity-chart";
import { Card } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { requireWorkspaceContext } from "@/lib/workspace";
import { getAnalytics } from "@/services/analytics/analytics";
import { parseRange, RANGES, successRate, usagePercent } from "@/services/analytics/metrics";

export const metadata: Metadata = { title: "Analytics" };

function Metric({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted">{note}</p>
    </Card>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const days = parseRange((await searchParams).range);
  const { workspace } = await requireWorkspaceContext();
  const a = await getAnalytics(workspace.id, days);
  const hasActivity = a.series.some((p) => p.agentRuns + p.workflowRuns + p.leads > 0);
  const agentRate = successRate(a.agents.succeeded, a.agents.failed);
  const workflowRate = successRate(a.workflows.succeeded, a.workflows.failed);
  const pctText = (v: number | null) => (v === null ? "n/a" : `${v}%`);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted">Last {days} days, by UTC calendar day. All figures come from activity recorded in Nexus AI.</p>
        </div>
        <nav aria-label="Date range" className="flex gap-1 rounded-lg border border-line bg-white p-1">
          {RANGES.map((r) => (
            <Link key={r} href={`/analytics?range=${r}`} aria-current={r === days ? "page" : undefined}
              className={cn("rounded-md px-3 py-1.5 text-sm font-medium", r === days ? "bg-brand text-white" : "text-muted hover:text-ink")}>{r} days</Link>
          ))}
        </nav>
      </div>

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="AI agent runs" value={a.agents.total} note={`${a.agents.failed} failed. Success rate counts finished runs only: ${pctText(agentRate)}.`} />
        <Metric label="Workflow runs" value={a.workflows.total} note={`${a.workflows.failed} failed. Success rate (finished runs): ${pctText(workflowRate)}.`} />
        <Metric label="Leads created" value={a.leads.created} note={`${a.leads.nowQualified} now qualified, ${a.leads.nowConverted} now converted (current status).`} />
        <Metric label="Emails sent" value={a.email.accepted} note={`Accepted by provider, from ${a.email.drafted} drafted in range. ${a.email.failed} failed.`} />
      </section>

      <Card className="p-6">
        <h2 className="font-semibold">Activity by day</h2>
        {hasActivity ? <div className="mt-4"><ActivityChart data={a.series} /></div> : <p className="mt-3 text-sm text-muted">No activity in this period yet. Run an agent, add leads, or run a workflow to see it here.</p>}
        {a.truncated && <p className="mt-3 text-xs text-warn">Very large volumes: charts and counts are capped at 20,000 records per metric.</p>}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold">Plan usage ({a.usage.plan.toLowerCase()})</h2>
          <ul className="mt-4 space-y-4">
            {a.usage.rows.map((r) => (
              <li key={r.label} className="text-sm">
                <div className="flex justify-between"><span>{r.label}</span><span className="text-muted">{r.used} / {r.limit}</span></div>
                <div className="mt-1 h-2 rounded-full bg-slate-100" role="progressbar" aria-label={r.label} aria-valuenow={r.used} aria-valuemin={0} aria-valuemax={r.limit}>
                  <div className={cn("h-2 rounded-full", usagePercent(r.used, r.limit) >= 90 ? "bg-warn" : "bg-brand")} style={{ width: `${usagePercent(r.used, r.limit)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">Pipeline snapshot (current)</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {["DRAFT", "PLANNED", "ACTIVE", "COMPLETED"].map((s) => (
              <div key={s}><dt className="text-muted">Campaigns: {s.toLowerCase()}</dt><dd className="text-xl font-semibold">{a.campaigns.byStatus[s] ?? 0}</dd></div>
            ))}
            {["NEW", "QUALIFIED", "PROPOSAL", "WON"].map((s) => (
              <div key={s}><dt className="text-muted">Deals: {s.toLowerCase()}</dt><dd className="text-xl font-semibold">{a.deals[s] ?? 0}</dd></div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted">{a.campaigns.createdInRange} campaigns created in this period.</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold">Not available yet</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Campaign reach, conversions, and revenue need a connected marketing platform.</li>
          <li>Email delivery, open, and click rates need delivery webhooks from the email provider.</li>
          <li>ROI and time-saved figures are not calculated, because they would be estimates, not recorded data.</li>
        </ul>
      </Card>
    </div>
  );
}
