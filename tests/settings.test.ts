import { describe, expect, it } from "vitest";
import { canChangeRole, canInvite, canRemove } from "@/services/team/rules";
import { generateToken, hashToken } from "@/lib/security/token";
import { inviteSchema, passwordChangeSchema, profileSchema, workspaceSchema } from "@/lib/validation/settings";

describe("team rules", () => {
  it("owner can invite admins; admin can only invite members; members cannot invite", () => {
    expect(canInvite("OWNER", "ADMIN")).toBe(true);
    expect(canInvite("ADMIN", "ADMIN")).toBe(false);
    expect(canInvite("ADMIN", "MEMBER")).toBe(true);
    expect(canInvite("MEMBER", "MEMBER")).toBe(false);
  });
  it("only the owner changes roles and ownership can't move", () => {
    expect(canChangeRole("OWNER", "MEMBER", "ADMIN")).toBe(true);
    expect(canChangeRole("ADMIN", "MEMBER", "ADMIN")).toBe(false);
    expect(canChangeRole("OWNER", "OWNER", "MEMBER")).toBe(false);
    expect(canChangeRole("OWNER", "MEMBER", "OWNER")).toBe(false);
  });
  it("the owner can never be removed; admins remove only members", () => {
    expect(canRemove("OWNER", "OWNER")).toBe(false);
    expect(canRemove("ADMIN", "OWNER")).toBe(false);
    expect(canRemove("ADMIN", "ADMIN")).toBe(false);
    expect(canRemove("ADMIN", "MEMBER")).toBe(true);
    expect(canRemove("MEMBER", "MEMBER")).toBe(false);
  });
});

describe("invite tokens", () => {
  it("are unique and hashed deterministically", () => {
    const a = generateToken(), b = generateToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(40);
    expect(hashToken(a)).toBe(hashToken(a));
    expect(hashToken(a)).not.toBe(a);
  });
});

describe("settings validation", () => {
  it("validates profile and workspace", () => {
    expect(profileSchema.safeParse({ name: "A" }).success).toBe(false);
    expect(workspaceSchema.safeParse({ name: "Acme", businessType: "Pirate" }).success).toBe(false);
    expect(workspaceSchema.safeParse({ name: "Acme", businessType: "", primaryGoal: "" }).success).toBe(true);
  });
  it("password change needs a strong, different, matching password", () => {
    const base = { currentPassword: "OldPassword1", newPassword: "NewPassword12", confirmPassword: "NewPassword12" };
    expect(passwordChangeSchema.safeParse(base).success).toBe(true);
    expect(passwordChangeSchema.safeParse({ ...base, newPassword: "weak", confirmPassword: "weak" }).success).toBe(false);
    expect(passwordChangeSchema.safeParse({ ...base, confirmPassword: "Different12345" }).success).toBe(false);
    expect(passwordChangeSchema.safeParse({ ...base, newPassword: "OldPassword1", confirmPassword: "OldPassword1" }).success).toBe(false);
  });
  it("limits invite roles and lifetimes", () => {
    expect(inviteSchema.safeParse({ role: "OWNER", days: 7 }).success).toBe(false);
    expect(inviteSchema.safeParse({ role: "MEMBER", days: 30 }).success).toBe(false);
    expect(inviteSchema.safeParse({ role: "MEMBER", days: 7 }).success).toBe(true);
  });
});
