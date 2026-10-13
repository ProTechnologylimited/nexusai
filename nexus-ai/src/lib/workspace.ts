import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const ACTIVE_WORKSPACE_COOKIE = "nexus_ws";

/**
 * Resolves the signed-in user's workspace from the database (never from client input).
 * Every tenant-scoped query must filter by the returned workspace.id.
 */
export const getWorkspaceContext = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const include = { workspace: true, user: { select: { id: true, name: true, email: true, emailVerifiedAt: true, passwordChangedAt: true } } } as const;
  // Active workspace comes from a cookie, but is only honored if the user is actually a member.
  const wanted = (await cookies()).get(ACTIVE_WORKSPACE_COOKIE)?.value;
  let membership = wanted ? await db.workspaceMembership.findFirst({ where: { userId: session.user.id, workspaceId: wanted }, include }) : null;
  membership ??= await db.workspaceMembership.findFirst({ where: { userId: session.user.id }, orderBy: { createdAt: "asc" }, include });
  if (!membership) return { stale: true as const };
  // A password change/reset invalidates every session issued before it.
  const changed = membership.user.passwordChangedAt;
  if (changed && (session.authAt ?? 0) < changed.getTime()) return { stale: true as const };
  return { stale: false as const, user: membership.user, workspace: membership.workspace, role: membership.role };
});

export async function requireWorkspaceContext() {
  const ctx = await getWorkspaceContext();
  if (!ctx) redirect("/login");
  // Valid token but user/workspace no longer exists: clear the cookie to avoid a redirect loop.
  if (ctx.stale) redirect("/api/session/clear");
  return ctx;
}

export function assertRole(role: Role, allowed: Role[]) {
  if (!allowed.includes(role)) throw new Error("You do not have permission to do this.");
}
