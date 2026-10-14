import type { CampaignStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { PLAN_LIMITS } from "@/config/limits";
import { getConfiguredProviders } from "@/services/ai/registry";
import { AiProviderError } from "@/services/ai/provider";
import { startOfMonthUtc } from "@/services/agents/agents";

export class CampaignError extends Error {}

type Data = {
  name: string; objective?: string; targetAudience?: string; offering?: string; keyMessage?: string;
  channel?: string; startDate?: string; endDate?: string; budgetCents: number | null; status: CampaignStatus; content?: string;
};

const clean = (d: Data) => ({
  name: d.name,
  objective: d.objective || null,
  targetAudience: d.targetAudience || null,
  offering: d.offering || null,
  keyMessage: d.keyMessage || null,
  channel: d.channel || null,
  startDate: d.startDate ? new Date(d.startDate) : null,
  endDate: d.endDate ? new Date(d.endDate) : null,
  budgetCents: d.budgetCents,
  status: d.status,
  content: d.content || null,
});

export const listCampaigns = (workspaceId: string) =>
  db.campaign.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" }, take: 200 });

export const getCampaign = (workspaceId: string, id: string) => db.campaign.findFirst({ where: { id, workspaceId } });

export async function createCampaign(workspaceId: string, actorId: string, d: Data) {
  return db.$transaction(async (tx) => {
    const c = await tx.campaign.create({ data: { ...clean(d), workspaceId } });
    await tx.activityLog.create({ data: { workspaceId, actorId, action: "campaign.created", summary: `Created campaign "${c.name}"` } });
    return c;
  });
}

export async function updateCampaign(workspaceId: string, actorId: string, id: string, d: Data) {
  const res = await db.campaign.updateMany({ where: { id, workspaceId }, data: clean(d) });
  if (res.count === 0) throw new CampaignError("Campaign not found.");
  await db.activityLog.create({ data: { workspaceId, actorId, action: "campaign.updated", summary: `Updated campaign "${d.name}" (${d.status.toLowerCase()})` } });
}

export function buildDraftPrompt(c: { name: string; objective: string | null; targetAudience: string | null; offering: string | null; keyMessage: string | null; channel: string | null }) {
  const lines = [
    `Campaign name: ${c.name}`,
    c.objective && `Objective: ${c.objective}`,
    c.targetAudience && `Target audience: ${c.targetAudience}`,
    c.offering && `Product or service: ${c.offering}`,
    c.keyMessage && `Key message: ${c.keyMessage}`,
    c.channel && `Primary channel: ${c.channel}`,
  ].filter(Boolean);
  return `${lines.join("\n")}\n\nWrite: (1) a short campaign brief, (2) three social post drafts, (3) promotional copy of about 100 words, (4) a simple two-week content calendar.`;
}

const DRAFT_SYSTEM =
  "You are a marketing copywriter. Write clear, honest campaign material. Never invent statistics, testimonials, customer names, awards, or claims about results. Use placeholders like [offer] where facts are missing.";

export async function generateCampaignDraft(workspaceId: string, actorId: string, campaignId: string) {
  const campaign = await getCampaign(workspaceId, campaignId);
  if (!campaign) throw new CampaignError("Campaign not found.");

  const provider = getConfiguredProviders()[0];
  if (!provider) throw new CampaignError("No AI provider is configured. Set ANTHROPIC_API_KEY on the server.");

  const sub = await db.subscription.findUnique({ where: { workspaceId } });
  const limit = PLAN_LIMITS[sub?.plan ?? "FREE"].monthlyCampaignDrafts;
  const used = await db.usageRecord.count({ where: { workspaceId, feature: { in: ["campaign_draft", "email_draft"] }, createdAt: { gte: startOfMonthUtc() } } });
  if (used >= limit) throw new CampaignError(`You've used all ${limit} AI drafts for this month.`);

  try {
    const out = await provider.generate({ model: provider.models[0].id, system: DRAFT_SYSTEM, prompt: buildDraftPrompt(campaign), maxTokens: 1800 });
    await db.usageRecord.create({ data: { workspaceId, feature: "campaign_draft" } });
    await db.activityLog.create({ data: { workspaceId, actorId, action: "campaign.draft_generated", summary: `Generated AI draft for "${campaign.name}"` } });
    return out.text;
  } catch (e) {
    throw new CampaignError(e instanceof AiProviderError ? e.message : "Draft generation failed.");
  }
}
