import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkflowBuilder } from "@/components/automation/workflow-builder";
import { Card } from "@/components/ui/primitives";
import { requireWorkspaceContext } from "@/lib/workspace";
import { canManageWorkflows } from "@/services/workflows/workflows";

export const metadata: Metadata = { title: "Build workflow" };

export default async function NewWorkflowPage() {
  const { role } = await requireWorkspaceContext();
  if (!canManageWorkflows(role)) redirect("/automation");
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Build workflow</h1>
      <Card className="mt-8 p-6"><WorkflowBuilder /></Card>
    </div>
  );
}
