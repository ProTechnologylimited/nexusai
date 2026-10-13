import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validation/auth";
import { onboardingSchema } from "@/lib/validation/onboarding";

const valid = {
  fullName: "Ada Lovelace", businessName: "", email: "Ada@Example.com",
  password: "Str0ngPassword", confirmPassword: "Str0ngPassword", acceptTerms: true as const,
};

describe("registerSchema", () => {
  it("accepts valid input and normalizes email", () => {
    const r = registerSchema.safeParse(valid);
    expect(r.success && r.data.email).toBe("ada@example.com");
  });
  it("rejects weak passwords", () => {
    expect(registerSchema.safeParse({ ...valid, password: "short", confirmPassword: "short" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: "alllowercase1", confirmPassword: "alllowercase1" }).success).toBe(false);
  });
  it("rejects mismatched passwords", () => {
    expect(registerSchema.safeParse({ ...valid, confirmPassword: "Different1Pass" }).success).toBe(false);
  });
  it("rejects invalid email and unaccepted terms", () => {
    expect(registerSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, acceptTerms: false }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires email and password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

describe("onboardingSchema", () => {
  it("accepts partial answers", () => expect(onboardingSchema.safeParse({ step: 2 }).success).toBe(true));
  it("rejects unknown business types", () => {
    expect(onboardingSchema.safeParse({ step: 2, businessType: "Pirate" }).success).toBe(false);
  });
});
