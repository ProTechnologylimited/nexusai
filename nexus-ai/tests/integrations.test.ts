import { describe, expect, it } from "vitest";
import { deriveStatus } from "@/services/integrations/status";
import { findIntegration, INTEGRATIONS } from "@/services/integrations/registry";

const now = new Date();

describe("deriveStatus", () => {
  it("never reports verified without a successful check", () => {
    expect(deriveStatus({ configured: false, check: null }).label).toBe("Not configured");
    expect(deriveStatus({ configured: true, check: null }).label).toBe("Configured, not verified");
    expect(deriveStatus({ configured: true, check: { ok: false, message: "x", checkedAt: now } }).label).toBe("Check failed");
    expect(deriveStatus({ configured: true, check: { ok: true, message: "x", checkedAt: now } }).label).toBe("Verified");
  });
  it("planned integrations stay planned", () => {
    expect(deriveStatus({ planned: true, configured: true, check: { ok: true, message: "", checkedAt: now } }).label).toBe("Planned");
  });
});

describe("registry", () => {
  it("has unique keys and only checkable real integrations", () => {
    const keys = INTEGRATIONS.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(INTEGRATIONS.filter((i) => i.planned).every((i) => !i.check)).toBe(true);
    expect(findIntegration("nope")).toBeUndefined();
  });
});
