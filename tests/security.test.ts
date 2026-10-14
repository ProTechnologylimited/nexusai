import { beforeEach, describe, expect, it } from "vitest";
import { safeRedirect } from "@/lib/security/redirect";
import { rateLimit, resetRateLimits } from "@/lib/security/rate-limit";

describe("safeRedirect", () => {
  it("allows relative paths", () => expect(safeRedirect("/agents")).toBe("/agents"));
  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "/ok\nSet-Cookie: x"])(
    "rejects %s", (t) => expect(safeRedirect(t)).toBe("/dashboard"),
  );
  it("falls back when empty", () => expect(safeRedirect(undefined)).toBe("/dashboard"));
});

describe("rateLimit", () => {
  beforeEach(resetRateLimits);
  it("blocks after the limit and recovers after the window", () => {
    expect(rateLimit("k", 2, 1000, 0).ok).toBe(true);
    expect(rateLimit("k", 2, 1000, 1).ok).toBe(true);
    expect(rateLimit("k", 2, 1000, 2).ok).toBe(false);
    expect(rateLimit("k", 2, 1000, 1001).ok).toBe(true);
  });
  it("tracks keys independently", () => {
    rateLimit("a", 1, 1000, 0);
    expect(rateLimit("b", 1, 1000, 0).ok).toBe(true);
  });
});
