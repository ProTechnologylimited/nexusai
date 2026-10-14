import { describe, expect, it } from "vitest";
import { companySchema, contactSchema, dealSchema, stageSchema, toCents } from "@/lib/validation/crm";

describe("dealSchema", () => {
  it("applies defaults", () => {
    const r = dealSchema.parse({ name: "Big deal" });
    expect(r.currency).toBe("USD");
    expect(r.stage).toBe("NEW");
  });
  it("validates value and currency", () => {
    expect(dealSchema.safeParse({ name: "x", value: "2500.50" }).success).toBe(true);
    expect(dealSchema.safeParse({ name: "x", value: "-5" }).success).toBe(false);
    expect(dealSchema.safeParse({ name: "x", value: "99999999" }).success).toBe(false);
    expect(dealSchema.safeParse({ name: "x", currency: "dollars" }).success).toBe(false);
  });
  it("converts to cents without float drift", () => {
    expect(toCents("19.99")).toBe(1999);
    expect(toCents(undefined)).toBeNull();
  });
});

describe("contactSchema", () => {
  it("splits tags and caps them", () => {
    expect(contactSchema.parse({ name: "A", tags: "vip, lead ,," }).tags).toEqual(["vip", "lead"]);
  });
  it("rejects bad email", () => expect(contactSchema.safeParse({ name: "A", email: "x" }).success).toBe(false));
});

describe("misc schemas", () => {
  it("requires a company name", () => expect(companySchema.safeParse({ name: "" }).success).toBe(false));
  it("rejects unknown stages", () => expect(stageSchema.safeParse({ id: "1", stage: "WON!" }).success).toBe(false));
});
