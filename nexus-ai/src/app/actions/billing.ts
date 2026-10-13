"use server";

import { db } from "@/lib/db";
import { assertRole, requireWorkspaceContext } from "@/lib/workspace";
import { BillingError, createCheckoutUrl, createPortalUrl, getBillingConfig } from "@/services/billing/stripe";

type Result = { url?: string; error?: string };
const PAID = ["STARTER", "GROWTH", "BUSINESS"];

export async function startCheckoutAction(planId: string): Promise<Result> {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx.role, ["OWNER"]);
  const cfg = getBillingConfig();
  if (!cfg.configured) return { error: `Billing is not configured. Missing: ${cfg.missing.join(", ")}.` };
  if (!PAID.includes(planId)) return { error: "Choose a paid plan." };
  const priceId = cfg.priceIds[planId];
  if (!priceId) return { error: `No Stripe price is configured for ${planId.toLowerCase()}.` };

  const sub = await db.subscription.findUnique({ where: { workspaceId: ctx.workspace.id } });
  if (sub && sub.plan !== "FREE" && sub.status !== "CANCELED") return { error: "You already have a paid plan. Use Manage subscription to change it." };

  try {
    return { url: await createCheckoutUrl({ workspaceId: ctx.workspace.id, priceId, customerId: sub?.providerCustomerId, email: ctx.user.email }) };
  } catch (e) {
    if (e instanceof BillingError) return { error: e.message };
    throw e;
  }
}

export async function openPortalAction(): Promise<Result> {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx.role, ["OWNER"]);
  if (!getBillingConfig().configured) return { error: "Billing is not configured." };
  const sub = await db.subscription.findUnique({ where: { workspaceId: ctx.workspace.id } });
  if (!sub?.providerCustomerId) return { error: "No billing account exists yet. Subscribe to a plan first." };
  try {
    return { url: await createPortalUrl(sub.providerCustomerId) };
  } catch (e) {
    if (e instanceof BillingError) return { error: e.message };
    throw e;
  }
}
