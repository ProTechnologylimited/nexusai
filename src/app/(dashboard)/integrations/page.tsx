import type { Metadata } from "next";
import { CheckButton } from "@/components/integrations/check-button";
import { Card } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { requireWorkspaceContext } from "@/lib/workspace";
import { getChecks } from "@/services/integrations/integrations";
import { INTEGRATIONS } from "@/services/integrations/registry";
import { deriveStatus } from "@/services/integrations/status";

export const metadata: Metadata = { title: "Integrations" };

const TONE = { ok: "bg-green-50 text-ok", warn: "bg-amber-50 text-amber-700", danger: "bg-red-50 text-danger", muted: "bg-slate-100 text-muted" } as const;

export default async function IntegrationsPage() {
  const { workspace, role } = await requireWorkspaceContext();
  const checks = await getChecks(workspace.id);
  const canCheck = role !== "MEMBER";

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
      <p className="mt-1 text-sm text-muted">
        Credentials are set as server environment variables and never reach the browser. An integration shows &ldquo;Verified&rdquo; only after a successful connection check.
      </p>

      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {INTEGRATIONS.map((i) => {
          const check = checks.get(i.key) ?? null;
          const status = deriveStatus({ planned: i.planned, configured: i.isConfigured(), check });
          return (
            <li key={i.key}>
              <Card className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{i.name}</h2>
                    <p className="text-xs text-muted">{i.category}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-medium", TONE[status.tone])}>{status.label}</span>
                </div>
                <p className="mt-3 text-sm text-muted">{i.description}</p>
                {i.capabilities.length > 0 && <p className="mt-2 text-xs text-muted">Capabilities: {i.capabilities.join(", ")}</p>}

                <div className="mt-4 flex-1 space-y-2 text-xs text-muted">
                  {check && <p>Last check {check.checkedAt.toLocaleString("en-US")}: {check.message}</p>}
                  {!i.planned && !i.isConfigured() && <p>To connect, set <code className="rounded bg-slate-100 px-1">{i.envVars.join(", ")}</code> on the server and restart the app.</p>}
                  {i.planned && <p>Not available in this version.</p>}
                </div>

                {!i.planned && i.isConfigured() && canCheck && <div className="mt-4"><CheckButton integrationKey={i.key} /></div>}
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
