import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, buttonClasses } from "@/components/ui/primitives";
import { CAMPAIGN_STATUSES } from "@/lib/validation/campaigns";
import { requireWorkspaceContext } from "@/lib/workspace";
import { listCampaigns } from "@/services/campaigns/campaigns";

export const metadata: Metadata = { title: "Campaigns" };

export default async function CampaignsPage() {
  const { workspace } = await requireWorkspaceContext();
  const campaigns = await listCampaigns(workspace.id);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="mt-1 text-sm text-muted">Plan and track marketing campaigns. Performance metrics need a connected marketing platform.</p>
        </div>
        <Link href="/campaigns/new" className={buttonClasses("primary")}><Plus className="size-4" aria-hidden="true" /> Create campaign</Link>
      </div>

      {campaigns.length === 0 ? (
        <Card className="mt-8 p-10 text-center">
          <h2 className="font-semibold">No campaigns yet</h2>
          <p className="mt-1 text-sm text-muted">Create a campaign to plan your message, audience, and schedule.</p>
        </Card>
      ) : (
        <div className="mt-8 space-y-8">
          {CAMPAIGN_STATUSES.map((st) => {
            const rows = campaigns.filter((c) => c.status === st);
            if (!rows.length) return null;
            return (
              <section key={st} aria-label={`${st.toLowerCase()} campaigns`}>
                <h2 className="mb-3 text-sm font-semibold text-muted">{st[0] + st.slice(1).toLowerCase()} ({rows.length})</h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {rows.map((c) => (
                    <li key={c.id}>
                      <Link href={`/campaigns/${c.id}`} className="block rounded-xl border border-line bg-white p-5 hover:border-brand">
                        <p className="font-medium">{c.name}</p>
                        <p className="mt-1 text-xs text-muted">{[c.channel, c.startDate && `from ${c.startDate.toISOString().slice(0, 10)}`].filter(Boolean).join(" · ") || "No channel or dates set"}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
