import { describe, expect, it } from "vitest";
import { campaignSchema } from "@/lib/validation/campaigns";
import { buildDraftPrompt } from "@/services/campaigns/campaigns";

describe("campaignSchema", () => {
  it("accepts a minimal campaign and defaults to draft", () => {
    const r = campaignSchema.parse({ name: "Spring launch" });
    expect(r.status).toBe("DRAFT");
  });
  it("rejects end dates before start dates", () => {
    expect(campaignSchema.safeParse({ name: "X1", startDate: "2026-10-10", endDate: "2026-10-01" }).success).toBe(false);
    expect(campaignSchema.safeParse({ name: "X1", startDate: "2026-10-01", endDate: "2026-10-10" }).success).toBe(true);
  });
  it("rejects bad budgets and channels", () => {
    expect(campaignSchema.safeParse({ name: "X1", budget: "-1" }).success).toBe(false);
    expect(campaignSchema.safeParse({ name: "X1", channel: "Carrier pigeon" }).success).toBe(false);
  });
});

describe("buildDraftPrompt", () => {
  it("includes provided fields and omits empty ones", () => {
    const p = buildDraftPrompt({ name: "Spring", objective: "Grow signups", targetAudience: null, offering: null, keyMessage: null, channel: "Email" });
    expect(p).toContain("Grow signups");
    expect(p).toContain("Email");
    expect(p).not.toContain("Target audience");
  });
});
