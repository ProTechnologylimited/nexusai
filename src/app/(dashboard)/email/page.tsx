import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { SetupNotice } from "@/components/email/setup-notice";
import { Card, buttonClasses } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { requireWorkspaceContext } from "@/lib/workspace";
import { listMessages, listTemplates } from "@/services/email/email";
import { getEmailConfig } from "@/services/email/provider";

export const metadata: Metadata = { title: "Email" };

const STATUS: Record<string, string> = {
  DRAFT: "Draft", APPROVED: "Approved, not sent", SENDING: "Sending", ACCEPTED: "Accepted by provider (delivery not confirmed)", FAILED: "Failed",
};

export default async function EmailPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const { workspace } = await requireWorkspaceContext();
  const templatesTab = tab === "templates";
  const cfg = getEmailConfig();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Email</h1>
          <p className="mt-1 text-sm text-muted">Draft, approve, and send one-to-one emails to your leads.</p>
        </div>
        <Link href={templatesTab ? "/email/templates/new" : "/email/compose"} className={buttonClasses("primary")}><Plus className="size-4" aria-hidden="true" /> {templatesTab ? "New template" : "Compose"}</Link>
      </div>
      <SetupNotice missing={cfg.missing} />

      <nav aria-label="Email sections" className="flex gap-1 border-b border-line">
        {[["", "Messages"], ["templates", "Templates"]].map(([k, label]) => (
          <Link key={k} href={k ? `/email?tab=${k}` : "/email"} aria-current={(templatesTab ? "templates" : "") === k ? "page" : undefined}
            className={cn("-mb-px border-b-2 px-4 py-2 text-sm font-medium", (templatesTab ? "templates" : "") === k ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink")}>{label}</Link>
        ))}
      </nav>

      {templatesTab ? <Templates workspaceId={workspace.id} /> : <Messages workspaceId={workspace.id} />}
    </div>
  );
}

async function Messages({ workspaceId }: { workspaceId: string }) {
  const rows = await listMessages(workspaceId);
  if (rows.length === 0) return <Card className="p-10 text-center text-sm text-muted">No emails yet. Compose one to a lead to get started.</Card>;
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b border-line text-muted"><tr>{["To", "Subject", "Status", "Created"].map((h) => <th key={h} className="p-4 font-medium">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">
          {rows.map((m) => (
            <tr key={m.id}>
              <td className="p-4 text-muted">{m.toEmail}</td>
              <td className="p-4"><Link href={`/email/${m.id}`} className="font-medium text-brand hover:underline">{m.subject}</Link></td>
              <td className="p-4">{STATUS[m.status]}</td>
              <td className="p-4 text-muted">{m.createdAt.toLocaleDateString("en-US")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

async function Templates({ workspaceId }: { workspaceId: string }) {
  const rows = await listTemplates(workspaceId);
  if (rows.length === 0) return <Card className="p-10 text-center text-sm text-muted">No templates yet. Create one to reuse common emails.</Card>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {rows.map((t) => (
        <li key={t.id}><Link href={`/email/templates/${t.id}`} className="block rounded-xl border border-line bg-white p-5 hover:border-brand"><p className="font-medium">{t.name}</p><p className="mt-1 truncate text-xs text-muted">{t.subject}</p></Link></li>
      ))}
    </ul>
  );
}
