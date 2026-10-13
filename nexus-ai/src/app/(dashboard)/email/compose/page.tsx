import type { Metadata } from "next";
import { ComposeForm } from "@/components/email/compose-form";
import { SetupNotice } from "@/components/email/setup-notice";
import { Card } from "@/components/ui/primitives";
import { requireWorkspaceContext } from "@/lib/workspace";
import { emailableLeads, listTemplates } from "@/services/email/email";
import { getEmailConfig } from "@/services/email/provider";

export const metadata: Metadata = { title: "Compose email" };

export default async function ComposePage() {
  const { workspace } = await requireWorkspaceContext();
  const [leads, templates] = await Promise.all([emailableLeads(workspace.id), listTemplates(workspace.id)]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Compose email</h1>
      <SetupNotice missing={getEmailConfig().missing} />
      <Card className="p-6">
        {leads.length === 0
          ? <p className="text-sm text-muted">You need a lead with an email address first. Add one on the Leads page.</p>
          : <ComposeForm leads={leads} templates={templates.map((t) => ({ id: t.id, name: t.name, subject: t.subject, body: t.body }))} />}
      </Card>
    </div>
  );
}
