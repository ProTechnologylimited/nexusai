"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { workflowSchema } from "@/lib/validation/workflows";
import { assertRole, requireWorkspaceContext } from "@/lib/workspace";
import {
  deleteWorkflow, processPending, retryExecution, runTest, saveWorkflow, setWorkflowStatus, WorkflowError,
} from "@/services/workflows/workflows";

export type WorkflowResult = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean };

async function admin() {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx.role, ["OWNER", "ADMIN"]);
  return ctx;
}

async function guarded(path: string, fn: () => Promise<void>): Promise<WorkflowResult> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof WorkflowError) return { error: e.message };
    throw e;
  }
  revalidatePath("/automation");
  revalidatePath(path);
  return { ok: true };
}

export async function saveWorkflowAction(id: string | null, values: unknown): Promise<WorkflowResult> {
  const ctx = await admin();
  const r = workflowSchema.safeParse(values);
  if (!r.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of r.error.issues) fieldErrors[i.path.join(".")] ??= i.message;
    return { fieldErrors, error: r.error.issues[0]?.message };
  }
  let savedId = id;
  const res = await guarded(`/automation/${id ?? ""}`, async () => {
    savedId = (await saveWorkflow(ctx.workspace.id, ctx.user.id, id, r.data)).id;
  });
  if (res.error) return res;
  if (!id) redirect(`/automation/${savedId}`);
  return res;
}

export async function setWorkflowStatusAction(id: string, status: "ACTIVE" | "PAUSED") {
  const ctx = await admin();
  return guarded(`/automation/${id}`, () => setWorkflowStatus(ctx.workspace.id, ctx.user.id, id, status));
}

export async function deleteWorkflowAction(id: string): Promise<WorkflowResult> {
  const ctx = await admin();
  const res = await guarded("/automation", () => deleteWorkflow(ctx.workspace.id, ctx.user.id, id));
  if (res.ok) redirect("/automation");
  return res;
}

export async function runTestAction(id: string, leadId: string | null) {
  const ctx = await admin();
  return guarded(`/automation/${id}`, async () => { await runTest(ctx.workspace.id, id, leadId || null, randomUUID()); });
}

export async function retryAction(workflowId: string, executionId: string) {
  const ctx = await admin();
  return guarded(`/automation/${workflowId}`, () => retryExecution(ctx.workspace.id, executionId));
}

/** Development alternative to a scheduler: runs this workspace's pending executions now. */
export async function processNowAction(workflowId: string) {
  const ctx = await admin();
  return guarded(`/automation/${workflowId}`, async () => { await processPending(25, ctx.workspace.id); });
}
