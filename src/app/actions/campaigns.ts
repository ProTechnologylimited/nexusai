"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { campaignSchema } from "@/lib/validation/campaigns";
import { toCents } from "@/lib/validation/crm";
import { requireWorkspaceContext } from "@/lib/workspace";
import { CampaignError, createCampaign, generateCampaignDraft, updateCampaign } from "@/services/campaigns/campaigns";

export type CampaignResult = { error?: string; fieldErrors?: Record<string, string>; text?: string; saved?: boolean };

function parse(values: unknown) {
  const r = campaignSchema.safeParse(values);
  if (r.success) return { data: { ...r.data, budgetCents: toCents(r.data.budget) } };
  const fieldErrors: Record<string, string> = {};
  for (const i of r.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
  return { fieldErrors };
}

export async function createCampaignAction(values: unknown): Promise<CampaignResult> {
  const ctx = await requireWorkspaceContext();
  const p = parse(values);
  if (!p.data) return { fieldErrors: p.fieldErrors };
  const c = await createCampaign(ctx.workspace.id, ctx.user.id, p.data);
  revalidatePath("/campaigns");
  redirect(`/campaigns/${c.id}`);
}

export async function updateCampaignAction(id: string, values: unknown): Promise<CampaignResult> {
  const ctx = await requireWorkspaceContext();
  const p = parse(values);
  if (!p.data) return { fieldErrors: p.fieldErrors };
  try {
    await updateCampaign(ctx.workspace.id, ctx.user.id, id, p.data);
  } catch (e) {
    if (e instanceof CampaignError) return { error: e.message };
    throw e;
  }
  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${id}`);
  return { saved: true };
}

/** Returns generated text only; nothing is saved or published until the user edits and saves it. */
export async function generateDraftAction(id: string): Promise<CampaignResult> {
  const ctx = await requireWorkspaceContext();
  try {
    return { text: await generateCampaignDraft(ctx.workspace.id, ctx.user.id, id) };
  } catch (e) {
    if (e instanceof CampaignError) return { error: e.message };
    throw e;
  }
}
