"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { aiDraftSchema, messageSchema, templateSchema } from "@/lib/validation/email";
import { verifyUnsubToken } from "@/lib/security/unsub-token";
import { assertRole, requireWorkspaceContext } from "@/lib/workspace";
import {
  aiDraftEmail, approveMessage, createMessage, deleteTemplate, discardMessage, EmailError, saveTemplate, sendMessage, suppress,
} from "@/services/email/email";

export type EmailResult = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean; subject?: string; body?: string };

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) out[String(i.path[0])] ??= i.message;
  return out;
}

async function guarded(fn: () => Promise<void>): Promise<EmailResult> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof EmailError) return { error: e.message };
    throw e;
  }
  revalidatePath("/email");
  return { ok: true };
}

export async function saveTemplateAction(id: string | null, values: unknown): Promise<EmailResult> {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx.role, ["OWNER", "ADMIN"]);
  const r = templateSchema.safeParse(values);
  if (!r.success) return { fieldErrors: fieldErrors(r.error.issues) };
  const res = await guarded(async () => { await saveTemplate(ctx.workspace.id, ctx.user.id, id, r.data); });
  if (res.ok && !id) redirect("/email?tab=templates");
  return res;
}

export async function deleteTemplateAction(id: string): Promise<EmailResult> {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx.role, ["OWNER", "ADMIN"]);
  const res = await guarded(() => deleteTemplate(ctx.workspace.id, id));
  if (res.ok) redirect("/email?tab=templates");
  return res;
}

export async function aiDraftAction(values: unknown): Promise<EmailResult> {
  const ctx = await requireWorkspaceContext();
  const r = aiDraftSchema.safeParse(values);
  if (!r.success) return { error: r.error.issues[0]?.message };
  try {
    return { ok: true, ...(await aiDraftEmail(ctx.workspace.id, ctx.user.id, r.data.leadId, r.data.instruction)) };
  } catch (e) {
    if (e instanceof EmailError) return { error: e.message };
    throw e;
  }
}

export async function createMessageAction(values: unknown): Promise<EmailResult> {
  const ctx = await requireWorkspaceContext();
  const r = messageSchema.safeParse(values);
  if (!r.success) return { fieldErrors: fieldErrors(r.error.issues) };
  let id = "";
  const res = await guarded(async () => { id = await createMessage(ctx.workspace.id, ctx.user.id, r.data); });
  if (res.ok) redirect(`/email/${id}`);
  return res;
}

export async function approveAction(id: string) {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx.role, ["OWNER", "ADMIN"]);
  const res = await guarded(() => approveMessage(ctx.workspace.id, ctx.user.id, id));
  revalidatePath(`/email/${id}`);
  return res;
}

export async function sendAction(id: string) {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx.role, ["OWNER", "ADMIN"]);
  if (!ctx.user.emailVerifiedAt) return { error: "Verify your own email address before sending emails." };
  const res = await guarded(() => sendMessage(ctx.workspace.id, ctx.user.id, id));
  revalidatePath(`/email/${id}`);
  return res;
}

export async function discardAction(id: string) {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx.role, ["OWNER", "ADMIN"]);
  const res = await guarded(() => discardMessage(ctx.workspace.id, id));
  if (res.ok) redirect("/email");
  return res;
}

/** Public: the signed token is the only authorization. */
export async function unsubscribeAction(token: string): Promise<EmailResult> {
  const v = verifyUnsubToken(token, process.env.AUTH_SECRET ?? "");
  if (!v) return { error: "This unsubscribe link is not valid." };
  await suppress(v.workspaceId, v.email);
  return { ok: true };
}
