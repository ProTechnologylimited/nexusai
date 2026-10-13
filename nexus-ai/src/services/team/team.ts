import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/security/token";
import { canChangeRole, canInvite, canRemove, type InviteRole, type Role } from "./rules";

export class TeamError extends Error {}
const MAX_PENDING = 20;

export const listMembers = (workspaceId: string) =>
  db.workspaceMembership.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" }, include: { user: { select: { id: true, name: true, email: true } } } });

export const listInvites = (workspaceId: string) =>
  db.workspaceInvite.findMany({ where: { workspaceId, usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } });

export const listUserWorkspaces = (userId: string) =>
  db.workspaceMembership.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, select: { workspace: { select: { id: true, name: true } } } }).then((r) => r.map((x) => x.workspace));

const log = (workspaceId: string, actorId: string, action: string, summary: string) =>
  db.activityLog.create({ data: { workspaceId, actorId, action, summary } });

/** Returns the raw token ONCE. Only its hash is stored. */
export async function createInvite(workspaceId: string, actorId: string, actorRole: Role, d: { role: InviteRole; label?: string; days: number }) {
  if (!canInvite(actorRole, d.role)) throw new TeamError("You can't invite someone with that role.");
  if ((await listInvites(workspaceId)).length >= MAX_PENDING) throw new TeamError("Too many pending invites. Revoke some first.");
  const token = generateToken();
  await db.workspaceInvite.create({
    data: { workspaceId, role: d.role, label: d.label || null, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + d.days * 86_400_000), createdById: actorId },
  });
  await log(workspaceId, actorId, "team.invited", `Created a ${d.role.toLowerCase()} invite link`);
  return token;
}

export async function revokeInvite(workspaceId: string, id: string) {
  const res = await db.workspaceInvite.deleteMany({ where: { id, workspaceId, usedAt: null } });
  if (res.count === 0) throw new TeamError("Invite not found.");
}

/** Single-use, atomic: the claim and the membership are created in one transaction. */
export async function acceptInvite(userId: string, token: string) {
  const tokenHash = hashToken(token);
  try {
    return await db.$transaction(async (tx) => {
      const claim = await tx.workspaceInvite.updateMany({ where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
      if (claim.count !== 1) throw new TeamError("This invite link is invalid, expired, or already used.");
      const invite = await tx.workspaceInvite.findUniqueOrThrow({ where: { tokenHash } });
      await tx.workspaceMembership.upsert({
        where: { userId_workspaceId: { userId, workspaceId: invite.workspaceId } },
        create: { userId, workspaceId: invite.workspaceId, role: invite.role },
        update: {},
      });
      await tx.activityLog.create({ data: { workspaceId: invite.workspaceId, actorId: userId, action: "team.joined", summary: "A new member joined the workspace" } });
      return invite.workspaceId;
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new TeamError("You are already a member of this workspace.");
    throw e;
  }
}

export async function inviteInfo(token: string) {
  const inv = await db.workspaceInvite.findUnique({ where: { tokenHash: hashToken(token) }, include: { workspace: { select: { name: true } } } });
  if (!inv || inv.usedAt || inv.expiresAt <= new Date()) return null;
  return { workspaceName: inv.workspace.name, role: inv.role };
}

async function target(workspaceId: string, memberId: string) {
  const m = await db.workspaceMembership.findFirst({ where: { id: memberId, workspaceId }, include: { user: { select: { name: true } } } });
  if (!m) throw new TeamError("Member not found.");
  return m;
}

export async function changeRole(workspaceId: string, actorId: string, actorRole: Role, memberId: string, next: Role) {
  const m = await target(workspaceId, memberId);
  if (!canChangeRole(actorRole, m.role, next)) throw new TeamError("You can't change this member's role.");
  await db.workspaceMembership.updateMany({ where: { id: memberId, workspaceId }, data: { role: next } });
  await log(workspaceId, actorId, "team.role_changed", `Changed ${m.user.name} to ${next.toLowerCase()}`);
}

export async function removeMember(workspaceId: string, actorId: string, actorRole: Role, memberId: string) {
  const m = await target(workspaceId, memberId);
  if (!canRemove(actorRole, m.role)) throw new TeamError("You can't remove this member.");
  await db.workspaceMembership.deleteMany({ where: { id: memberId, workspaceId } });
  await log(workspaceId, actorId, "team.removed", `Removed ${m.user.name} from the workspace`);
}
