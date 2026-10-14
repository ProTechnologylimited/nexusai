"use server";

import { headers } from "next/headers";
import { forgotSchema, resetSchema } from "@/lib/validation/auth";
import { rateLimit } from "@/lib/security/rate-limit";
import { requireWorkspaceContext } from "@/lib/workspace";
import { requestPasswordReset, resetPassword, sendVerification, verifyEmailToken } from "@/services/auth/account";
import { getTransactionalConfig } from "@/services/email/provider";

export type AccountResult = { ok?: boolean; error?: string; notConfigured?: boolean; fieldErrors?: Record<string, string> };

export async function forgotPasswordAction(values: unknown): Promise<AccountResult> {
  const r = forgotSchema.safeParse(values);
  if (!r.success) return { fieldErrors: { email: "Enter a valid email address." } };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const out = await requestPasswordReset(r.data.email, ip);
  return out === "not_configured" ? { notConfigured: true } : { ok: true };
}

export async function resetPasswordAction(values: unknown): Promise<AccountResult> {
  const r = resetSchema.safeParse(values);
  if (!r.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of r.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { fieldErrors };
  }
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`reset-submit:${ip}`, 10, 15 * 60_000).ok) return { error: "Too many attempts. Try again later." };
  return (await resetPassword(r.data.token, r.data.password)) ? { ok: true } : { error: "This reset link is invalid, expired, or already used. Request a new one." };
}

export async function verifyEmailAction(token: string): Promise<AccountResult> {
  if (typeof token !== "string" || token.length > 200) return { error: "Invalid link." };
  return (await verifyEmailToken(token)) ? { ok: true } : { error: "This verification link is invalid, expired, or already used." };
}

export async function resendVerificationAction(): Promise<AccountResult> {
  const ctx = await requireWorkspaceContext();
  if (ctx.user.emailVerifiedAt) return { ok: true };
  if (!getTransactionalConfig().configured) return { notConfigured: true };
  if (!rateLimit(`verify-resend:${ctx.user.id}`, 3, 60 * 60_000).ok) return { error: "Too many requests. Try again in an hour." };
  return (await sendVerification(ctx.user.id, ctx.user.email, ctx.user.name)) ? { ok: true } : { error: "We couldn't send the email. Try again later." };
}
