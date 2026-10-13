// Pure billing rules (no database or framework imports), unit tested.
export type PaidPlan = "STARTER" | "GROWTH" | "BUSINESS";
export type Entitlement = {
  plan: "FREE" | PaidPlan;
  status: "ACTIVE" | "PAST_DUE" | "CANCELED";
  cancelAtPeriodEnd: boolean;
  periodEnd: Date | null;
};

export type StripeSub = {
  id: string;
  customer: string;
  status: string;
  cancel_at_period_end?: boolean;
  current_period_end?: number;
  metadata?: Record<string, string>;
  items?: { data: { price?: { id?: string }; current_period_end?: number }[] };
};

export function priceMapFromEnv(env: Record<string, string | undefined>): Record<string, PaidPlan> {
  const map: Record<string, PaidPlan> = {};
  const pairs: [string | undefined, PaidPlan][] = [[env.STRIPE_PRICE_STARTER, "STARTER"], [env.STRIPE_PRICE_GROWTH, "GROWTH"], [env.STRIPE_PRICE_BUSINESS, "BUSINESS"]];
  for (const [id, plan] of pairs) if (id) map[id] = plan;
  return map;
}

export function mapStatus(stripeStatus: string): Entitlement["status"] | null {
  if (stripeStatus === "active" || stripeStatus === "trialing") return "ACTIVE";
  if (stripeStatus === "past_due" || stripeStatus === "unpaid") return "PAST_DUE";
  if (stripeStatus === "canceled") return "CANCELED";
  return null; // incomplete, incomplete_expired, paused: never grant or change access
}

/** Decides what a verified subscription event entitles the workspace to. Null means "change nothing". */
export function decideEntitlement(sub: StripeSub, priceMap: Record<string, PaidPlan>, forceCanceled = false): Entitlement | null {
  const status = forceCanceled ? "CANCELED" : mapStatus(sub.status);
  if (!status) return null;
  const end = sub.current_period_end ?? sub.items?.data[0]?.current_period_end;
  const periodEnd = end ? new Date(end * 1000) : null;

  if (status === "CANCELED") return { plan: "FREE", status, cancelAtPeriodEnd: false, periodEnd };
  const priceId = sub.items?.data[0]?.price?.id;
  const plan = priceId ? priceMap[priceId] : undefined;
  if (!plan) return null; // unknown price: never guess a plan
  return { plan, status, cancelAtPeriodEnd: !!sub.cancel_at_period_end, periodEnd };
}
