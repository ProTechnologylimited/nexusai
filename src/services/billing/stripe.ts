export class BillingError extends Error {}

export function getBillingConfig() {
  const missing = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "APP_URL"].filter((k) => !process.env[k]);
  return {
    configured: missing.length === 0,
    missing,
    priceIds: { STARTER: process.env.STRIPE_PRICE_STARTER, GROWTH: process.env.STRIPE_PRICE_GROWTH, BUSINESS: process.env.STRIPE_PRICE_BUSINESS } as Record<string, string | undefined>,
  };
}

async function stripePost(path: string, params: Record<string, string>) {
  let res: Response;
  try {
    res = await fetch(`https://api.stripe.com/v1${path}`, {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new BillingError("Could not reach Stripe.");
  }
  if (!res.ok) throw new BillingError(`Stripe returned an error (HTTP ${res.status}).`);
  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new BillingError("Stripe did not return a redirect URL.");
  return data.url;
}

const base = () => process.env.APP_URL!.replace(/\/$/, "");

export function createCheckoutUrl(opts: { workspaceId: string; priceId: string; customerId?: string | null; email: string }) {
  return stripePost("/checkout/sessions", {
    mode: "subscription",
    "line_items[0][price]": opts.priceId,
    "line_items[0][quantity]": "1",
    client_reference_id: opts.workspaceId,
    "metadata[workspaceId]": opts.workspaceId,
    "subscription_data[metadata][workspaceId]": opts.workspaceId,
    success_url: `${base()}/billing?checkout=success`,
    cancel_url: `${base()}/billing?checkout=canceled`,
    ...(opts.customerId ? { customer: opts.customerId } : { customer_email: opts.email }),
  });
}

export function createPortalUrl(customerId: string) {
  return stripePost("/billing_portal/sessions", { customer: customerId, return_url: `${base()}/billing` });
}
