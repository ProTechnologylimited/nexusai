import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailControls, RetryButton } from "@/components/automation/workflow-controls";
import { WorkflowBuilder, EMPTY, type BuilderDefaults } from "@/components/automation/workflow-builder";
import { Card } from "@/components/ui/primitives";
import { db } from "@/lib/db";
import { definitionSchema } from "@/lib/validation/workflows";
import { requireWorkspaceContext } from "@/lib/workspace";
import type { StepLog } from "@/services/workflows/rules";
import { canManageWorkflows, getWorkflow, MAX_ATTEMPTS } from "@/services/workflows/workflows";

export const metadata: Metadata = { title: "Workflow" };

function toDefaults(w: { name: string; description: string | null; trigger: string; definition: unknown }): BuilderDefaults {
  const d = definitionSchema.safeParse(w.definition);
  const base: BuilderDefaults = { ...EMPTY, name: w.name, description: w.description ?? "", trigger: w.trigger as BuilderDefaults["trigger"], requireEmail: false, actions: [] };
  if (!d.success) return base;
  for (const c of d.data.conditions) {
    if (c.field === "hasEmail") base.requireEmail = true;
    if (c.field === "status") base.statusIs = c.value;
    if (c.field === "source") base.sourceIs = c.value;
  }
  base.actions = d.data.actions.map((a) =>
    a.type === "NOTIFY" ? { type: a.type, text: a.message }
    : a.type === "UPDATE_LEAD_STATUS" ? { type: a.type, text: a.status }
    : a.type === "SET_FOLLOW_UP" ? { type: a.type, text: String(a.days) }
    : { type: a.type, text: a.instruction });
  return base;
}

export default async function WorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace, role } = await requireWorkspaceContext();
  const w = await getWorkflow(workspace.id, id);
  if (!w) notFound();
  const canManage = canManageWorkflows(role);
  const leads = canManage ? await db.lead.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, name: true } }) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{w.name}</h1>
        <p className="mt-1 text-sm text-muted">Status: {w.status.toLowerCase()}</p>
      </div>

      {canManage ? (
        <>
          <Card className="p-6"><DetailControls id={w.id} status={w.status} leads={leads} /></Card>
          <Card className="p-6"><WorkflowBuilder id={w.id} defaults={toDefaults(w)} /></Card>
        </>
      ) : <p className="text-sm text-muted">Only owners and admins can edit or run workflows.</p>}

      <section aria-label="Run history" className="space-y-3">
        <h2 className="font-semibold">Run history</h2>
        {w.executions.length === 0 && <p className="text-sm text-muted">No runs yet.</p>}
        {w.executions.map((e) => {
          const log = (Array.isArray(e.log) ? e.log : []) as StepLog[];
          return (
            <Card key={e.id} className="p-5 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{e.status.toLowerCase()} <span className="font-normal text-muted">· attempt {e.attempts}</span></span>
                <time dateTime={e.createdAt.toISOString()} className="text-xs text-muted">{e.createdAt.toLocaleString("en-US")}</time>
              </div>
              {log.length > 0 && <ul className="mt-2 space-y-1 text-muted">{log.map((s, i) => <li key={i}>{s.status === "done" ? "Done" : "Failed"}: {s.type.toLowerCase()} - {s.detail}</li>)}</ul>}
              {e.error && <p role="alert" className="mt-2 text-danger">{e.error}</p>}
              {canManage && e.status === "FAILED" && e.attempts < MAX_ATTEMPTS && <div className="mt-3"><RetryButton workflowId={w.id} executionId={e.id} /></div>}
            </Card>
          );
        })}
      </section>
    </div>
  );
}
