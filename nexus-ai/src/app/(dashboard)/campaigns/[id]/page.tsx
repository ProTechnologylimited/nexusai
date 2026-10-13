import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { Card } from "@/components/ui/primitives";
import { requireWorkspaceContext } from "@/lib/workspace";
import { getCampaign } from "@/services/campaigns/campaigns";

export const metadata: Metadata = { title: "Campaign" };

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await requireWorkspaceContext();
  const c = await getCampaign(workspace.id, id);
  if (!c) notFound();
  const d = (x: Date | null) => (x ? x.toISOString().slice(0, 10) : "");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">{c.name}</h1>
      <Card className="mt-8 p-6">
        <CampaignForm
          campaignId={c.id}
          defaults={{
            name: c.name, objective: c.objective ?? "", targetAudience: c.targetAudience ?? "", offering: c.offering ?? "",
            keyMessage: c.keyMessage ?? "", channel: (c.channel as "Email" | null) ?? "", startDate: d(c.startDate), endDate: d(c.endDate),
            budget: c.budgetCents != null ? (c.budgetCents / 100).toFixed(2) : "", status: c.status, content: c.content ?? "",
          }}
        />
      </Card>
    </div>
  );
}
