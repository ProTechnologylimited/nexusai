"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { signOut } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { rateLimit } from "@/lib/security/rate-limit";
import { passwordChangeSchema, profileSchema, workspaceSchema } from "@/lib/validation/settings";
import { assertRole, requireWorkspaceContext } from "@/lib/workspace";

export type SettingsResult = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) out[String(i.path[0])] ??= i.message;
  return out;
}

export async function updateProfileAction(values: unknown): Promise<SettingsResult> {
  const ctx = await requireWorkspaceContext();
  const r = profileSchema.safeParse(values);
  if (!r.success) return { fieldErrors: fieldErrors(r.error.issues) };
  await db.user.update({ where: { id: ctx.user.id }, data: { name: r.data.name } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateWorkspaceAction(values: unknown): Promise<SettingsResult> {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx.role, ["OWNER", "ADMIN"]);
  const r = workspaceSchema.safeParse(values);
  if (!r.success) return { fieldErrors: fieldErrors(r.error.issues) };
  await db.workspace.update({
    where: { id: ctx.workspace.id },
    data: { name: r.data.name, businessType: r.data.businessType || null, primaryGoal: r.data.primaryGoal || null },
  });
  await db.activityLog.create({ data: { workspaceId: ctx.workspace.id, actorId: ctx.user.id, action: "workspace.updated", summary: "Updated workspace details" } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changePasswordAction(values: unknown): Promise<SettingsResult> {
  const ctx = await requireWorkspaceContext();
  const r = passwordChangeSchema.safeParse(values);
  if (!r.success) return { fieldErrors: fieldErrors(r.error.issues) };
  if (!rateLimit(`pwchange:${ctx.user.id}`, 5, 15 * 60_000).ok) return { error: "Too many attempts. Try again in a few minutes." };

  const user = await db.user.findUnique({ where: { id: ctx.user.id }, select: { passwordHash: true } });
  if (!(await verifyPassword(r.data.currentPassword, user?.passwordHash))) return { fieldErrors: { currentPassword: "Your current password is incorrect." } };

  await db.user.update({ where: { id: ctx.user.id }, data: { passwordHash: await hashPassword(r.data.newPassword), passwordChangedAt: new Date() } });
  await db.activityLog.create({ data: { workspaceId: ctx.workspace.id, actorId: ctx.user.id, action: "security.password_changed", summary: "Password changed" } });
  // Sessions issued before the change are now invalid everywhere, including this one.
  await signOut({ redirectTo: "/login?reset=1" });
  return { ok: true };
}
