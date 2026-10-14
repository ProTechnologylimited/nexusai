import { describe, expect, it } from "vitest";
import { appLink, resetEmail, verifyEmail } from "@/services/auth/emails";
import { forgotSchema, resetSchema } from "@/lib/validation/auth";
import { hashToken } from "@/lib/security/token";

describe("account emails", () => {
  it("builds links with an encoded token and no double slash", () => {
    expect(appLink("https://app.test/", "/reset-password", "a b+c")).toBe("https://app.test/reset-password?token=a%20b%2Bc");
  });
  it("includes the link and a safe fallback line", () => {
    expect(resetEmail("https://x/y").text).toContain("https://x/y");
    expect(resetEmail("https://x/y").text).toMatch(/ignore this email/);
    expect(verifyEmail("https://x/y", "Ada Lovelace").text).toContain("Hi Ada,");
  });
});

describe("validation", () => {
  it("normalizes and validates the forgot-password email", () => {
    expect(forgotSchema.parse({ email: " A@B.com " }).email).toBe("a@b.com");
    expect(forgotSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
  it("requires a strong, matching new password and a token", () => {
    const ok = { token: "x".repeat(43), password: "StrongPass123", confirmPassword: "StrongPass123" };
    expect(resetSchema.safeParse(ok).success).toBe(true);
    expect(resetSchema.safeParse({ ...ok, password: "weak", confirmPassword: "weak" }).success).toBe(false);
    expect(resetSchema.safeParse({ ...ok, confirmPassword: "Different12345" }).success).toBe(false);
    expect(resetSchema.safeParse({ ...ok, token: "short" }).success).toBe(false);
  });
  it("stores only hashes of tokens", () => expect(hashToken("secret-token")).not.toContain("secret"));
});
