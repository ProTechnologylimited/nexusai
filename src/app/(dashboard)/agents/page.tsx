import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, buttonClasses } from "@/components/ui/primitives";
import { requireWorkspaceContext } from "@/lib/workspace";
import { listAgents } from "@/services/agents/agents";

export const metadata: Metadata = { title: "AI Agents" };

export default async function AgentsPage() {
  const { workspace, role } = await requireWorkspaceContext();
  const agents = await listAgents(workspace.id);
  const canCreate = role !== "MEMBER";

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Agents</h1>
          <p className="mt-1 text-sm text-muted">Create and run AI assistants for business tasks.</p>
        </div>
        {canCreate && <Link href="/agents/new" className={buttonClasses("primary")}><Plus className="size-4" aria-hidden="true" /> Create agent</Link>}
      </div>

      {agents.length === 0 ? (
        <Card className="mt-8 p-10 text-center">
          <h2 className="font-semibold">No agents yet</h2>
          <p className="mt-1 text-sm text-muted">Create your first agent to start automating a business task.</p>
          {canCreate && <Link href="/agents/new" className={buttonClasses("primary", "mt-5")}>Create AI agent</Link>}
        </Card>
      ) : (
        <Card className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr><th className="p-4 font-medium">Name</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Model</th><th className="p-4 font-medium">Runs</th><th className="p-4 font-medium">Last run</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {agents.map((a) => (
                <tr key={a.id}>
                  <td className="p-4"><Link href={`/agents/${a.id}`} className="font-medium text-brand hover:underline">{a.name}</Link>{a.description && <p className="text-xs text-muted">{a.description}</p>}</td>
                  <td className="p-4">{a.status.toLowerCase()}</td>
                  <td className="p-4 text-muted">{a.model}</td>
                  <td className="p-4">{a._count.executions}</td>
                  <td className="p-4 text-muted">{a.executions[0] ? a.executions[0].createdAt.toLocaleDateString("en-US") : "Never"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
