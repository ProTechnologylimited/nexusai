import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TemplateForm } from "@/components/email/template-form";
import { Card } from "@/components/ui/primitives";
import { requireWorkspaceContext } from "@/lib/workspace";

export const metadata: Metadata = { title: "New template" };

export default async function NewTemplatePage() {
  const { role } = await requireWorkspaceContext();
  if (role === "MEMBER") redirect("/email?tab=templates");
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">New template</h1>
      <Card className="mt-8 p-6"><TemplateForm /></Card>
    </div>
  );
}
