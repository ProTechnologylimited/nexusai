import { db } from "@/lib/db";
import { PLAN_LIMITS } from "@/config/limits";
import { signUnsubToken } from "@/lib/security/unsub-token";
import { renderTemplate } from "@/services/workflows/rules";
import { getConfiguredProviders } from "@/services/ai/registry";
import { AiProviderError } from "@/services/ai/provider";
import { startOfMonthUtc } from "@/services/agents/agents";
import { parseDraft, footerText } from "./draft";
import { EmailProviderError, getEmailConfig, sendViaResend } from "./provider";

export class EmailError extends Error {}

const log = (workspaceId: string, actorId: string, action: string, summary: string) =>
  db.activityLog.create({ data: { workspaceId, actorId, action, summary } });

export const listMessages = (workspaceId: string) => db.emailMessage.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take: 100 });
export const getMessage = (workspaceId: string, id: string) => db.emailMessage.findFirst({ where: { id, workspaceId } });
export const listTemplates = (workspaceId: string) => db.emailTemplate.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" }, take: 100 });
export const getTemplate = (workspaceId: string, id: string) => db.emailTemplate.findFirst({ where: { id, workspaceId } });
export const emailableLeads = (workspaceId: string) =>
  db.lead.findMany({ where: { workspaceId, email: { not: null } }, orderBy: { createdAt: "desc" }, take: 200, select: { id: true, name: true, email: true } });

export async function saveTemplate(workspaceId: string, actorId: string, id: string | null, d: { name: string; subject: string; body: string }) {
  if (!id) {
    const t = await db.emailTemplate.create({ data: { ...d, workspaceId } });
    await log(workspaceId, actorId, "email.template_created", `Created email template "${d.name}"`);
    return t.id;
  }
  const res = await db.emailTemplate.updateMany({ where: { id, workspaceId }, data: d });
  if (res.count === 0) throw new EmailError("Template not found.");
  return id;
}

export async function deleteTemplate(workspaceId: string, id: string) {
  const res = await db.emailTemplate.deleteMany({ where: { id, workspaceId } });
  if (res.count === 0) throw new EmailError("Template not found.");
}

/** Creates a DRAFT addressed to a lead's email. Template variables are rendered now, so approvers see the final text. */
export async function createMessage(workspaceId: string, actorId: string, d: { leadId: string; subject: string; body: string }) {
  const lead = await db.lead.findFirst({ where: { id: d.leadId, workspaceId } });
  if (!lead?.email) throw new EmailError("Choose a lead from your workspace that has an email address.");
  const m = await db.emailMessage.create({
    data: {
      workspaceId, leadId: lead.id, toEmail: lead.email, createdById: actorId,
      subject: renderTemplate(d.subject, lead).replace(/[\r\n]+/g, " ").trim(),
      body: renderTemplate(d.body, lead),
    },
  });
  await log(workspaceId, actorId, "email.drafted", `Drafted email to ${lead.name}`);
  return m.id;
}

export async function approveMessage(workspaceId: string, actorId: string, id: string) {
  const res = await db.emailMessage.updateMany({
    where: { id, workspaceId, status: "DRAFT" },
    data: { status: "APPROVED", approvedById: actorId, approvedAt: new Date() },
  });
  if (res.count === 0) throw new EmailError("Only draft emails can be approved.");
  await log(workspaceId, actorId, "email.approved", "Approved an email for sending");
}

export async function discardMessage(workspaceId: string, id: string) {
  const res = await db.emailMessage.deleteMany({ where: { id, workspaceId, status: { in: ["DRAFT", "APPROVED", "FAILED"] } } });
  if (res.count === 0) throw new EmailError("This email can no longer be discarded.");
}

export async function suppress(workspaceId: string, email: string) {
  await db.emailSuppression.upsert({
    where: { workspaceId_email: { workspaceId, email: email.toLowerCase() } },
    create: { workspaceId, email: email.toLowerCase() },
    update: {},
  });
}

/** Sends an APPROVED (or previously FAILED) message. "ACCEPTED" means the provider took it, not that it was delivered. */
export async function sendMessage(workspaceId: string, actorId: string, id: string) {
  const cfg = getEmailConfig();
  if (!cfg.configured) throw new EmailError(`Email sending is not configured. Missing: ${cfg.missing.join(", ")}.`);

  const sub = await db.subscription.findUnique({ where: { workspaceId } });
  const limit = PLAN_LIMITS[sub?.plan ?? "FREE"].monthlyEmails;
  const sent = await db.emailMessage.count({ where: { workspaceId, status: "ACCEPTED", sentAt: { gte: startOfMonthUtc() } } });
  if (sent >= limit) throw new EmailError(`You've reached your plan's ${limit} emails for this month.`);

  // Atomic claim: only an approved message can move to SENDING, and only once at a time.
  const claim = await db.emailMessage.updateMany({
    where: { id, workspaceId, status: { in: ["APPROVED", "FAILED"] }, approvedAt: { not: null } },
    data: { status: "SENDING", error: null },
  });
  if (claim.count === 0) throw new EmailError("This email is not approved, or is already being sent.");

  const m = await db.emailMessage.findFirstOrThrow({ where: { id, workspaceId } });
  const failWith = async (error: string) => {
    await db.emailMessage.update({ where: { id }, data: { status: "FAILED", error } });
    throw new EmailError(error);
  };

  if (await db.emailSuppression.findUnique({ where: { workspaceId_email: { workspaceId, email: m.toEmail.toLowerCase() } } })) {
    return failWith("This recipient has unsubscribed. The email was not sent.");
  }

  const token = signUnsubToken(workspaceId, m.toEmail, process.env.AUTH_SECRET ?? "");
  const unsubscribeUrl = `${process.env.APP_URL!.replace(/\/$/, "")}/unsubscribe?t=${token}`;
  try {
    const out = await sendViaResend({
      to: m.toEmail, subject: m.subject, unsubscribeUrl, idempotencyKey: m.id,
      text: m.body + footerText(unsubscribeUrl, process.env.EMAIL_FOOTER_ADDRESS!),
    });
    await db.emailMessage.update({ where: { id }, data: { status: "ACCEPTED", providerMessageId: out.providerMessageId, sentAt: new Date() } });
    await db.usageRecord.create({ data: { workspaceId, feature: "email_sent" } });
    await log(workspaceId, actorId, "email.accepted", `Email to ${m.toEmail} accepted by provider`);
  } catch (e) {
    if (e instanceof EmailProviderError) return failWith(e.message);
    return failWith("Sending failed unexpectedly.");
  }
}

export async function aiDraftEmail(workspaceId: string, actorId: string, leadId: string, instruction: string) {
  const lead = await db.lead.findFirst({ where: { id: leadId, workspaceId } });
  if (!lead) throw new EmailError("Choose a lead from your workspace.");
  const provider = getConfiguredProviders()[0];
  if (!provider) throw new EmailError("No AI provider is configured. Set ANTHROPIC_API_KEY on the server.");

  const sub = await db.subscription.findUnique({ where: { workspaceId } });
  const limit = PLAN_LIMITS[sub?.plan ?? "FREE"].monthlyCampaignDrafts;
  const used = await db.usageRecord.count({ where: { workspaceId, feature: { in: ["campaign_draft", "email_draft"] }, createdAt: { gte: startOfMonthUtc() } } });
  if (used >= limit) throw new EmailError(`You've used all ${limit} AI drafts for this month.`);

  try {
    const out = await provider.generate({
      model: provider.models[0].id,
      system: "You write short, honest, professional business emails. Never invent facts, statistics, or past conversations. Reply in this exact format: first line 'SUBJECT: <subject>', blank line, then the plain-text body. No signature block.",
      prompt: `${instruction}\n\nRecipient: ${lead.name}${lead.company ? `, ${lead.company}` : ""}${lead.jobTitle ? `, ${lead.jobTitle}` : ""}`,
      maxTokens: 700,
    });
    await db.usageRecord.create({ data: { workspaceId, feature: "email_draft" } });
    return parseDraft(out.text);
  } catch (e) {
    throw new EmailError(e instanceof AiProviderError ? e.message : "Draft generation failed.");
  }
}
