import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyStripeSignature } from "@/lib/security/stripe-signature";
import { decideEntitlement, mapStatus, priceMapFromEnv } from "@/services/billing/rules";

const secret = "whsec_test_secret";
const body = '{"id":"evt_1"}';
const sign = (t: number, b = body, s = secret) => `t=${t},v1=${createHmac("sha256", s).update(`${t}.${b}`).digest("hex")}`;

describe("verifyStripeSignature", () => {
  const now = 1_800_000_000;
  it("accepts a valid signature", () => expect(verifyStripeSignature(body, sign(now), secret, now)).toBe(true));
  it("rejects wrong secret, altered body, and missing header", () => {
    expect(verifyStripeSignature(body, sign(now, body, "other"), secret, now)).toBe(false);
    expect(verifyStripeSignature('{"id":"evt_2"}', sign(now), secret, now)).toBe(false);
    expect(verifyStripeSignature(body, null, secret, now)).toBe(false);
  });
  it("rejects old timestamps (replay)", () => expect(verifyStripeSignature(body, sign(now - 3600), secret, now)).toBe(false));
});

describe("entitlements", () => {
  const prices = priceMapFromEnv({ STRIPE_PRICE_STARTER: "price_s", STRIPE_PRICE_GROWTH: "price_g" });
  const sub = (status: string, price = "price_g") => ({ id: "sub_1", customer: "cus_1", status, current_period_end: 1_900_000_000, items: { data: [{ price: { id: price } }] } });

  it("grants the plan matching the verified price", () => {
    expect(decideEntitlement(sub("active"), prices)).toMatchObject({ plan: "GROWTH", status: "ACTIVE" });
  });
  it("never grants a plan for unknown prices or incomplete payments", () => {
    expect(decideEntitlement(sub("active", "price_unknown"), prices)).toBeNull();
    expect(decideEntitlement(sub("incomplete"), prices)).toBeNull();
    expect(mapStatus("incomplete_expired")).toBeNull();
  });
  it("keeps the plan but flags past due", () => expect(decideEntitlement(sub("past_due"), prices)).toMatchObject({ plan: "GROWTH", status: "PAST_DUE" }));
  it("drops to Free when canceled or deleted", () => {
    expect(decideEntitlement(sub("canceled"), prices)).toMatchObject({ plan: "FREE", status: "CANCELED" });
    expect(decideEntitlement(sub("active"), prices, true)).toMatchObject({ plan: "FREE", status: "CANCELED" });
  });
});
