"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inviteSchema } from "@/lib/validation/settings";
import { ACTIVE_WORKSPACE_COOKIE, assertRole, requireWorkspaceContext } from "@/lib/workspace";
import type { Role } from "@/services/team/rules";
import { acceptInvite, changeRole, createInvite, removeMember, revokeInvite, TeamError } from "@/services/team/team";

export type TeamResult = { ok?: boolean; error?: string; link?: string };

async function origin() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`;
}

async function guarded(fn: () => Promise<void>): Promise<TeamResult> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof TeamError) return { error: e.message };
    throw e;
  }
  revalidatePath("/settings");
  return { ok: true };
}

async function setActive(workspaceId: string) {
  (await cookies()).set(ACTIVE_WORKSPACE_COOKIE, workspaceId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export async function createInviteAction(values: unknown): Promise<TeamResult> {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx.role, ["OWNER", "ADMIN"]);
  const r = inviteSchema.safeParse(values);
  if (!r.success) return { error: "Check the invite options and try again." };
  let token = "";
  const res = await guarded(async () => { token = await createInvite(ctx.workspace.id, ctx.user.id, ctx.role, r.data); });
  return res.ok ? { ok: true, link: `${await origin()}/invite/${token}` } : res;
}

export async function revokeInviteAction(id: string) {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx.role, ["OWNER", "ADMIN"]);
  return guarded(() => revokeInvite(ctx.workspace.id, id));
}

export async function changeRoleAction(memberId: string, role: string) {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx.role, ["OWNER"]);
  if (role !== "ADMIN" && role !== "MEMBER") return { error: "Invalid role." };
  return guarded(() => changeRole(ctx.workspace.id, ctx.user.id, ctx.role, memberId, role as Role));
}

export async function removeMemberAction(memberId: string) {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx.role, ["OWNER", "ADMIN"]);
  return guarded(() => removeMember(ctx.workspace.id, ctx.user.id, ctx.role, memberId));
}

export async function switchWorkspaceAction(workspaceId: string) {
  const ctx = await requireWorkspaceContext();
  const m = await db.workspaceMembership.findFirst({ where: { userId: ctx.user.id, workspaceId }, select: { id: true } });
  if (!m) return;
  await setActive(workspaceId);
  redirect("/dashboard");
}

/** Requires a signed-in user; the link token is the only proof of invitation. */
export async function acceptInviteAction(token: string): Promise<TeamResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in first." };
  let workspaceId = "";
  try {
    workspaceId = await acceptInvite(session.user.id, token);
  } catch (e) {
    if (e instanceof TeamError) return { error: e.message };
    throw e;
  }
  await setActive(workspaceId);
  redirect("/dashboard");
}
