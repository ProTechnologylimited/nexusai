// Pure team-permission rules (no database imports), safe to use in client components and unit tests.
export type Role = "OWNER" | "ADMIN" | "MEMBER";
export type InviteRole = "ADMIN" | "MEMBER";

/** Owners can invite anyone below owner; admins can invite members only. */
export const canInvite = (actor: Role, role: InviteRole) => actor === "OWNER" || (actor === "ADMIN" && role === "MEMBER");

/** Only the owner changes roles, and ownership itself cannot be granted or taken away here. */
export const canChangeRole = (actor: Role, target: Role, next: Role) => actor === "OWNER" && target !== "OWNER" && next !== "OWNER";

/** The owner can never be removed. Admins can only remove members. */
export const canRemove = (actor: Role, target: Role) => target !== "OWNER" && (actor === "OWNER" || (actor === "ADMIN" && target === "MEMBER"));
