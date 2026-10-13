import { describe, expect, it } from "vitest";
import { PLANS } from "@/config/plans";
import { PLAN_LIMITS } from "@/config/limits";

describe("pricing config", () => {
  it("matches the proposed tiers", () => {
    expect(PLANS.map((p) => [p.id, p.priceUsd])).toEqual([["FREE", 0], ["STARTER", 19], ["GROWTH", 49], ["BUSINESS", 149]]);
  });
  it("never advertises unlimited usage", () => {
    expect(JSON.stringify(PLANS).toLowerCase()).not.toContain("unlimited");
  });
  it("has finite limits for every plan, increasing with price", () => {
    const runs = PLANS.map((p) => PLAN_LIMITS[p.id].monthlyRuns);
    expect(runs.every(Number.isFinite)).toBe(true);
    expect([...runs].sort((a, b) => a - b)).toEqual(runs);
  });
});
