import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RunPanel } from "@/components/agents/run-panel";
import { Card } from "@/components/ui/primitives";
import { requireWorkspaceContext } from "@/lib/workspace";
import { getAgent } from "@/services/agents/agents";

export const metadata: Metadata = { title: "Agent" };

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace, role } = await requireWorkspaceContext();
  const agent = await getAgent(workspace.id, id);
  if (!agent) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{agent.name}</h1>
        <p className="mt-1 text-sm text-muted">{agent.description ?? "No description"} · {agent.model} · {agent.status.toLowerCase()}</p>
      </div>

      <Card className="p-6"><RunPanel agentId={agent.id} status={agent.status} canManage={role !== "MEMBER"} /></Card>

      <Card className="p-6">
        <h2 className="font-semibold">Instructions</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{agent.instructions}</p>
      </Card>

      <section aria-label="Execution history" className="space-y-3">
        <h2 className="font-semibold">Run history</h2>
        {agent.executions.length === 0 && <p className="text-sm text-muted">No runs yet.</p>}
        {agent.executions.map((e) => (
          <Card key={e.id} className="p-5 text-sm">
            <div className="flex justify-between text-xs text-muted">
              <span>{e.status.toLowerCase()}{e.durationMs != null && ` · ${(e.durationMs / 1000).toFixed(1)}s`}</span>
              <time dateTime={e.createdAt.toISOString()}>{e.createdAt.toLocaleString("en-US")}</time>
            </div>
            <p className="mt-2 font-medium">{e.input}</p>
            {e.output && <p className="mt-2 whitespace-pre-wrap text-muted">{e.output}</p>}
            {e.error && <p role="alert" className="mt-2 text-danger">{e.error}</p>}
          </Card>
        ))}
      </section>
    </div>
  );
}
