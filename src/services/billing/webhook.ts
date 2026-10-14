import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { decideEntitlement, priceMapFromEnv, type StripeSub } from "./rules";

export type StripeEvent = { id: string; type: string; created: number; data: { object: unknown } };
const HANDLED = new Set(["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"]);

/**
 * Applies a signature-verified Stripe event. Idempotent by event id; ignores out-of-order (older) events.
 * Returns a short result string for logs. Throws on processing errors so Stripe retries.
 */
export async function handleStripeEvent(evt: StripeEvent): Promise<string> {
  if (!HANDLED.has(evt.type)) return "ignored";

  try {
    await db.billingEvent.create({ data: { eventId: evt.id, type: evt.type } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return "duplicate";
    throw e;
  }

  try {
    const sub = evt.data.object as StripeSub;
    const workspaceId = sub.metadata?.workspaceId ?? (await db.subscription.findFirst({ where: { providerSubId: sub.id }, select: { workspaceId: true } }))?.workspaceId;
    if (!workspaceId) return "ignored: no workspace";

    const existing = await db.subscription.findUnique({ where: { workspaceId } });
    if (!existing) return "ignored: unknown workspace";
    const eventTime = new Date(evt.created * 1000);
    if (existing.lastEventAt && existing.lastEventAt > eventTime) return "stale";

    const decision = decideEntitlement(sub, priceMapFromEnv(process.env), evt.type === "customer.subscription.deleted");
    if (!decision) {
      console.warn("billing: event produced no entitlement change", evt.id, evt.type);
      return "ignored: no entitlement change";
    }

    await db.$transaction([
      db.subscription.update({
        where: { workspaceId },
        data: {
          plan: decision.plan, status: decision.status, providerCustomerId: sub.customer, providerSubId: sub.id,
          currentPeriodEnd: decision.periodEnd, cancelAtPeriodEnd: decision.cancelAtPeriodEnd, lastEventAt: eventTime,
        },
      }),
      db.activityLog.create({
        data: { workspaceId, action: "billing.updated", summary: `Subscription is now ${decision.plan.toLowerCase()} (${decision.status.toLowerCase()})` },
      }),
    ]);
    return "applied";
  } catch (e) {
    await db.billingEvent.deleteMany({ where: { eventId: evt.id } }); // let Stripe's retry reprocess it
    throw e;
  }
}
