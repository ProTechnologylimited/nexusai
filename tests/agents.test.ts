import { describe, expect, it } from "vitest";
import { buildSystemPrompt, checkLimits, startOfMonthUtc } from "@/services/agents/agents";
import { agentSchema, runSchema } from "@/lib/validation/agents";
import { isValidModel } from "@/services/ai/registry";

describe("checkLimits", () => {
  it("blocks creating agents at the cap", () => {
    expect(checkLimits({ agentCount: 1, maxAgents: 1, monthlyRuns: 20 })).toMatch(/allows 1 agent/);
    expect(checkLimits({ agentCount: 0, maxAgents: 1, monthlyRuns: 20 })).toBeNull();
  });
  it("blocks runs at the monthly cap", () => {
    expect(checkLimits({ maxAgents: 1, runsThisMonth: 20, monthlyRuns: 20 })).toMatch(/20 agent runs/);
    expect(checkLimits({ maxAgents: 1, runsThisMonth: 19, monthlyRuns: 20 })).toBeNull();
  });
});

describe("helpers", () => {
  it("computes month start in UTC", () => {
    expect(startOfMonthUtc(new Date("2026-10-11T12:00:00Z")).toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });
  it("includes instructions and style in the system prompt", () => {
    const p = buildSystemPrompt({ instructions: "Be helpful", objective: null, responseStyle: "formal" });
    expect(p).toContain("Be helpful");
    expect(p).toContain("formal");
  });
  it("validates models against the provider", () => {
    expect(isValidModel("anthropic", "claude-sonnet-5-5")).toBe(true);
    expect(isValidModel("anthropic", "nope")).toBe(false);
  });
});

describe("agent validation", () => {
  const ok = { name: "Sales helper", instructions: "Draft follow-up emails.", responseStyle: "concise", provider: "anthropic", model: "claude-sonnet-5-5" };
  it("accepts valid agents", () => expect(agentSchema.safeParse(ok).success).toBe(true));
  it("rejects short instructions and bad styles", () => {
    expect(agentSchema.safeParse({ ...ok, instructions: "short" }).success).toBe(false);
    expect(agentSchema.safeParse({ ...ok, responseStyle: "rude" }).success).toBe(false);
  });
  it("rejects empty run input", () => expect(runSchema.safeParse({ agentId: "a", input: "  " }).success).toBe(false));
});
