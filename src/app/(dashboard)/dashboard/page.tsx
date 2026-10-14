import type { Metadata } from "next";
import Link from "next/link";
import { Bot, Workflow, Users, Megaphone, Plus } from "lucide-react";
import { Card, buttonClasses } from "@/components/ui/primitives";
import { requireWorkspaceContext } from "@/lib/workspace";
import { getDashboardSummary, PIPELINE_ORDER } from "@/services/dashboard/summary";

export const metadata: Metadata = { title: "Overview" };

const STATUS_LABEL = { NEW: "New", CONTACTED: "Contacted", QUALIFIED: "Qualified", CONVERTED: "Converted", LOST: "Lost" } as const;

function Stat({ icon: Icon, label, value, note }: { icon: typeof Bot; label: string; value: number; note: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        <span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand"><Icon className="size-4.5" aria-hidden="true" /></span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted">{note}</p>
    </Card>
  );
}

export default async function DashboardPage() {
  const { user, workspace } = await requireWorkspaceContext();
  const s = await getDashboardSummary(workspace.id);
  const firstName = user.name.split(" ")[0];
  const maxLeads = Math.max(1, ...Object.values(s.leads.byStatus));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-muted">Here&apos;s what&apos;s happening across your business today.</p>
      </div>

      {s.agents.total === 0 && (
        <Card className="flex flex-col gap-4 border-brand/30 bg-brand-soft p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">You haven&apos;t created an AI agent yet</h2>
            <p className="mt-1 text-sm text-muted">Create your first agent to start automating a business task.</p>
          </div>
          <Link href="/agents" className={buttonClasses("primary")}>Create AI agent</Link>
        </Card>
      )}

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Bot} label="Active AI agents" value={s.agents.active} note={`${s.agents.total} total`} />
        <Stat icon={Workflow} label="Workflows" value={s.workflows.total} note={`${s.workflows.active} active`} />
        <Stat icon={Users} label="Leads" value={s.leads.total} note={`${s.leads.byStatus.QUALIFIED} qualified`} />
        <Stat icon={Megaphone} label="Campaigns" value={s.campaigns.total} note={`${s.campaigns.active} active`} />
      </section>

      <section aria-label="Quick actions" className="flex flex-wrap gap-3">
        {[["/agents", "Create AI agent"], ["/automation", "Build automation"], ["/leads", "Add lead"], ["/campaigns", "Create campaign"]].map(([href, label]) => (
          <Link key={href} href={href} className={buttonClasses("secondary")}><Plus className="size-4" aria-hidden="true" /> {label}</Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold">Lead pipeline</h2>
          {s.leads.total === 0 ? (
            <p className="mt-3 text-sm text-muted">No leads yet. Leads you add will appear here by stage.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {PIPELINE_ORDER.map((st) => (
                <li key={st} className="text-sm">
                  <div className="flex justify-between"><span>{STATUS_LABEL[st]}</span><span className="text-muted">{s.leads.byStatus[st]}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand" style={{ width: `${(s.leads.byStatus[st] / maxLeads) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">AI agent performance</h2>
          <p className="text-xs text-muted">Last 30 days</p>
          {s.executions30d.total === 0 ? (
            <p className="mt-3 text-sm text-muted">No agent runs yet.</p>
          ) : (
            <dl className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div><dt className="text-muted">Runs</dt><dd className="text-xl font-semibold">{s.executions30d.total}</dd></div>
              <div><dt className="text-muted">Failed</dt><dd className="text-xl font-semibold">{s.executions30d.failed}</dd></div>
              <div><dt className="text-muted">Success rate</dt><dd className="text-xl font-semibold">{s.executions30d.successRate === null ? "n/a" : `${s.executions30d.successRate}%`}</dd></div>
            </dl>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">Workflow overview</h2>
          {s.workflows.recent.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No workflows yet. Build one to automate a repeated task.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line text-sm">
              {s.workflows.recent.map((w) => (
                <li key={w.id} className="flex justify-between py-2"><span>{w.name}</span><span className="text-muted">{w.status.toLowerCase()}</span></li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">Recent activity</h2>
          {s.activity.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nothing yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line text-sm">
              {s.activity.map((a) => (
                <li key={a.id} className="flex justify-between gap-4 py-2">
                  <span>{a.summary}</span>
                  <time dateTime={a.createdAt.toISOString()} className="shrink-0 text-muted">{a.createdAt.toLocaleDateString("en-US")}</time>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
