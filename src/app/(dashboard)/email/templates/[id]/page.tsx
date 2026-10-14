import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplateForm } from "@/components/email/template-form";
import { Card } from "@/components/ui/primitives";
import { requireWorkspaceContext } from "@/lib/workspace";
import { getTemplate } from "@/services/email/email";

export const metadata: Metadata = { title: "Template" };

export default async function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace, role } = await requireWorkspaceContext();
  const t = await getTemplate(workspace.id, id);
  if (!t) notFound();
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">{t.name}</h1>
      <Card className="mt-8 p-6">
        {role === "MEMBER" ? <p className="whitespace-pre-wrap text-sm"><strong>{t.subject}</strong>{"\n\n"}{t.body}</p> : <TemplateForm id={t.id} defaults={{ name: t.name, subject: t.subject, body: t.body }} />}
      </Card>
    </div>
  );
}
