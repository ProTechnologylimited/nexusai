"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { leadSchema } from "@/lib/validation/leads";
import { requireWorkspaceContext } from "@/lib/workspace";
import { createLead, importLeads, updateLead } from "@/services/leads/leads";

export type LeadActionResult = { error?: string; fieldErrors?: Record<string, string>; created?: number; skipped?: number };

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) out[String(i.path[0])] ??= i.message;
  return out;
}

export async function createLeadAction(values: unknown): Promise<LeadActionResult> {
  const ctx = await requireWorkspaceContext();
  const parsed = leadSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };
  await createLead(ctx.workspace.id, ctx.user.id, parsed.data);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  redirect("/leads");
}

export async function updateLeadAction(id: string, values: unknown): Promise<LeadActionResult> {
  const ctx = await requireWorkspaceContext();
  const parsed = leadSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };
  const ok = await updateLead(ctx.workspace.id, ctx.user.id, id, parsed.data);
  if (!ok) return { error: "Lead not found." };
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  redirect("/leads");
}

export async function importLeadsAction(csvText: string): Promise<LeadActionResult> {
  const ctx = await requireWorkspaceContext();
  if (typeof csvText !== "string" || csvText.length > 1_000_000) return { error: "The file is too large (1 MB max)." };
  const res = await importLeads(ctx.workspace.id, ctx.user.id, csvText);
  if ("error" in res) return { error: res.error };
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return res;
}
