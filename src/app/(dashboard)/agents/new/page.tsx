import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NewAgentForm } from "@/components/agents/new-agent-form";
import { Card } from "@/components/ui/primitives";
import { requireWorkspaceContext } from "@/lib/workspace";
import { getConfiguredProviders } from "@/services/ai/registry";

export const metadata: Metadata = { title: "Create agent" };

export default async function NewAgentPage() {
  const { role } = await requireWorkspaceContext();
  if (role === "MEMBER") redirect("/agents");
  const providers = getConfiguredProviders().map((p) => ({ id: p.id, label: p.label, models: p.models }));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Create AI agent</h1>
      <Card className="mt-8 p-6">
        {providers.length === 0 ? (
          <div>
            <h2 className="font-semibold">Connect an AI provider first</h2>
            <p className="mt-1 text-sm text-muted">No AI provider is configured on the server. Set <code>ANTHROPIC_API_KEY</code> in the environment and restart the app.</p>
          </div>
        ) : <NewAgentForm providers={providers} />}
      </Card>
    </div>
  );
}
