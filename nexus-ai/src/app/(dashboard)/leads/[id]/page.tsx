import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LeadForm } from "@/components/leads/lead-form";
import { Card } from "@/components/ui/primitives";
import { requireWorkspaceContext } from "@/lib/workspace";
import { getLead } from "@/services/leads/leads";

export const metadata: Metadata = { title: "Edit lead" };

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await requireWorkspaceContext();
  const lead = await getLead(workspace.id, id);
  if (!lead) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">{lead.name}</h1>
      <Card className="mt-8 p-6">
        <LeadForm
          leadId={lead.id}
          defaults={{
            name: lead.name, company: lead.company ?? "", email: lead.email ?? "", website: lead.website ?? "",
            industry: lead.industry ?? "", jobTitle: lead.jobTitle ?? "", source: lead.source ?? "", status: lead.status,
            followUpDate: lead.followUpDate ? lead.followUpDate.toISOString().slice(0, 10) : "", notes: lead.notes ?? "",
          }}
        />
      </Card>
    </div>
  );
}
