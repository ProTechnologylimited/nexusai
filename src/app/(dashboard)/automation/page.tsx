import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { StatusButton } from "@/components/automation/workflow-controls";
import { Card, buttonClasses } from "@/components/ui/primitives";
import { requireWorkspaceContext } from "@/lib/workspace";
import { canManageWorkflows, listWorkflows } from "@/services/workflows/workflows";

export const metadata: Metadata = { title: "Automation" };
const TRIGGER = { MANUAL: "Manual", LEAD_CREATED: "Lead added" } as Record<string, string>;

export default async function AutomationPage() {
  const { workspace, role } = await requireWorkspaceContext();
  const workflows = await listWorkflows(workspace.id);
  const canManage = canManageWorkflows(role);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Automation</h1>
          <p className="mt-1 text-sm text-muted">Trigger, condition, and action workflows.</p>
        </div>
        {canManage && <Link href="/automation/new" className={buttonClasses("primary")}><Plus className="size-4" aria-hidden="true" /> Build workflow</Link>}
      </div>
      <p className="mt-4 rounded-lg bg-brand-soft px-4 py-3 text-sm text-muted">
        Scheduled and event-triggered runs need the background worker to be called regularly (see README). Until then, use &ldquo;Process pending now&rdquo; on a workflow page.
      </p>

      {workflows.length === 0 ? (
        <Card className="mt-6 p-10 text-center">
          <h2 className="font-semibold">No workflows yet</h2>
          <p className="mt-1 text-sm text-muted">Build a workflow to automate a repeated task, such as following up on new leads.</p>
        </Card>
      ) : (
        <Card className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-line text-muted"><tr>{["Name", "Trigger", "Status", "Runs", ""].map((h, i) => <th key={i} className="p-4 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {workflows.map((w) => (
                <tr key={w.id}>
                  <td className="p-4"><Link href={`/automation/${w.id}`} className="font-medium text-brand hover:underline">{w.name}</Link></td>
                  <td className="p-4">{TRIGGER[w.trigger] ?? w.trigger}</td>
                  <td className="p-4">{w.status.toLowerCase()}</td>
                  <td className="p-4">{w._count.executions}</td>
                  <td className="p-4 text-right">{canManage && <StatusButton id={w.id} status={w.status} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
