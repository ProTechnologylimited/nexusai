import { describe, expect, it } from "vitest";
import { signUnsubToken, verifyUnsubToken } from "@/lib/security/unsub-token";
import { footerText, parseDraft } from "@/services/email/draft";
import { messageSchema, templateSchema } from "@/lib/validation/email";

describe("unsubscribe tokens", () => {
  const secret = "test-secret-test-secret";
  it("round-trips", () => {
    const t = signUnsubToken("ws1", "A@B.com", secret);
    expect(verifyUnsubToken(t, secret)).toEqual({ workspaceId: "ws1", email: "a@b.com" });
  });
  it("rejects tampering and wrong secrets", () => {
    const t = signUnsubToken("ws1", "a@b.com", secret);
    const [p, s] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ w: "ws2", e: "a@b.com" })).toString("base64url");
    expect(verifyUnsubToken(`${forged}.${s}`, secret)).toBeNull();
    expect(verifyUnsubToken(t, "other-secret-other-secret")).toBeNull();
    expect(verifyUnsubToken("garbage", secret)).toBeNull();
    expect(p.length).toBeGreaterThan(0);
  });
});

describe("parseDraft", () => {
  it("splits subject and body", () => expect(parseDraft("SUBJECT: Hello\n\nHi Jane,\nBye")).toEqual({ subject: "Hello", body: "Hi Jane,\nBye" }));
  it("falls back to body only", () => expect(parseDraft("Just text")).toEqual({ subject: "", body: "Just text" }));
});

describe("footerText", () => {
  it("contains address and unsubscribe link", () => {
    const f = footerText("https://x.test/unsubscribe?t=1", "1 Main St");
    expect(f).toContain("1 Main St");
    expect(f).toContain("https://x.test/unsubscribe?t=1");
  });
});

describe("email validation", () => {
  it("blocks header injection in subjects", () => {
    expect(messageSchema.safeParse({ leadId: "1", subject: "Hi\r\nBcc: evil@x.com", body: "x" }).success).toBe(false);
    expect(templateSchema.safeParse({ name: "T1", subject: "Hi", body: "x" }).success).toBe(true);
  });
});
