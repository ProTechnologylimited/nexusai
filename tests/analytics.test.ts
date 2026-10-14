import { describe, expect, it } from "vitest";
import { bucketByDay, countStatuses, dayKeys, parseRange, rangeStart, successRate, usagePercent } from "@/services/analytics/metrics";

const now = new Date("2026-10-11T15:30:00Z");

describe("ranges", () => {
  it("defaults to 30 and accepts only known ranges", () => {
    expect(parseRange(undefined)).toBe(30);
    expect(parseRange("7")).toBe(7);
    expect(parseRange("1000")).toBe(30);
  });
  it("starts at UTC midnight, inclusive of today", () => {
    expect(rangeStart(7, now).toISOString()).toBe("2026-10-05T00:00:00.000Z");
    expect(dayKeys(3, now)).toEqual(["2026-10-09", "2026-10-10", "2026-10-11"]);
  });
});

describe("bucketByDay", () => {
  it("counts events per day and ignores out-of-window ones", () => {
    const dates = [new Date("2026-10-11T01:00:00Z"), new Date("2026-10-11T23:00:00Z"), new Date("2026-10-09T10:00:00Z"), new Date("2026-09-01T00:00:00Z")];
    expect(bucketByDay(dates, 3, now)).toEqual([1, 0, 2]);
  });
});

describe("rates", () => {
  it("success rate uses finished runs only", () => {
    expect(successRate(3, 1)).toBe(75);
    expect(successRate(0, 0)).toBeNull();
  });
  it("counts statuses with in-progress separate", () => {
    expect(countStatuses([{ status: "SUCCEEDED" }, { status: "FAILED" }, { status: "PENDING" }, { status: "RUNNING" }])).toEqual({ total: 4, succeeded: 1, failed: 1, inProgress: 2 });
  });
  it("caps usage at 100 percent", () => {
    expect(usagePercent(5, 10)).toBe(50);
    expect(usagePercent(20, 10)).toBe(100);
  });
});
