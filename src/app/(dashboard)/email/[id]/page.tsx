import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageControls } from "@/components/email/message-controls";
import { SetupNotice } from "@/components/email/setup-notice";
import { Card } from "@/components/ui/primitives";
import { requireWorkspaceContext } from "@/lib/workspace";
import { getMessage } from "@/services/email/email";
import { getEmailConfig } from "@/services/email/provider";

export const metadata: Metadata = { title: "Email" };

const STATUS: Record<string, string> = {
  DRAFT: "Draft (needs approval)", APPROVED: "Approved, not sent", SENDING: "Sending", ACCEPTED: "Accepted by the email provider. Delivery is not confirmed.", FAILED: "Failed",
};

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace, role } = await requireWorkspaceContext();
  const m = await getMessage(workspace.id, id);
  if (!m) notFound();
  const cfg = getEmailConfig();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{m.subject}</h1>
      <SetupNotice missing={cfg.missing} />
      <Card className="space-y-4 p-6 text-sm">
        <dl className="grid grid-cols-[6rem_1fr] gap-y-2">
          <dt className="text-muted">To</dt><dd>{m.toEmail}</dd>
          <dt className="text-muted">Status</dt><dd>{STATUS[m.status]}</dd>
          {m.approvedAt && <><dt className="text-muted">Approved</dt><dd>{m.approvedAt.toLocaleString("en-US")}</dd></>}
          {m.sentAt && <><dt className="text-muted">Accepted</dt><dd>{m.sentAt.toLocaleString("en-US")}</dd></>}
        </dl>
        {m.error && <p role="alert" className="text-danger">{m.error}</p>}
        <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 font-sans">{m.body}</pre>
        <p className="text-xs text-muted">An unsubscribe link and your postal address are appended when the email is sent.</p>
      </Card>
      <MessageControls id={m.id} status={m.status} canManage={role !== "MEMBER"} canSend={cfg.configured} />
    </div>
  );
}
