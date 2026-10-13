import type { Metadata } from "next";
import { BillingButton } from "@/components/billing/billing-buttons";
import { Card } from "@/components/ui/primitives";
import { PLAN_LIMITS } from "@/config/limits";
import { PLANS } from "@/config/plans";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { requireWorkspaceContext } from "@/lib/workspace";
import { getBillingConfig } from "@/services/billing/stripe";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const { checkout } = await searchParams;
  const { workspace, role } = await requireWorkspaceContext();
  const sub = await db.subscription.findUnique({ where: { workspaceId: workspace.id } });
  const cfg = getBillingConfig();
  const isOwner = role === "OWNER";
  const current = sub?.plan ?? "FREE";
  const paid = current !== "FREE" && sub?.status !== "CANCELED";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted">Prices are in USD per month. Your plan only changes after Stripe confirms payment to our server.</p>
      </div>

      {checkout === "success" && <p role="status" className="rounded-lg bg-brand-soft px-4 py-3 text-sm">Thanks. Your plan updates once Stripe confirms the payment. Refresh in a moment; if nothing changes, check that the webhook is configured.</p>}
      {checkout === "canceled" && <p role="status" className="rounded-lg bg-slate-100 px-4 py-3 text-sm">Checkout was canceled. You were not charged.</p>}
      {!cfg.configured && (
        <div role="note" className="rounded-xl border border-warn/40 bg-amber-50 p-4 text-sm">
          <p className="font-medium">Payments are not set up</p>
          <p className="mt-1 text-muted">Set these server environment variables to enable checkout: {cfg.missing.map((m) => <code key={m} className="mx-0.5 rounded bg-white px-1">{m}</code>)}. No payment can be made until then.</p>
        </div>
      )}

      <Card className="p-6">
        <h2 className="font-semibold">Current plan: {current[0] + current.slice(1).toLowerCase()}</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <div><dt className="text-muted">Status</dt><dd>{(sub?.status ?? "ACTIVE").toLowerCase().replace("_", " ")}</dd></div>
          {sub?.currentPeriodEnd && <div><dt className="text-muted">{sub.cancelAtPeriodEnd ? "Ends on" : "Renews on"}</dt><dd>{sub.currentPeriodEnd.toLocaleDateString("en-US")}</dd></div>}
          {sub?.status === "PAST_DUE" && <div className="text-danger sm:col-span-3">Your last payment failed. Update your payment method in the billing portal.</div>}
        </dl>
        {sub?.providerCustomerId && cfg.configured && isOwner && (
          <div className="mt-4">
            <BillingButton kind="portal" variant="secondary" label="Manage subscription, invoices, and cancellation" />
          </div>
        )}
      </Card>

      <section aria-label="Plans" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((p) => {
          const lim = PLAN_LIMITS[p.id];
          const isCurrent = p.id === current;
          return (
            <Card key={p.id} className={cn("flex flex-col p-5", isCurrent && "border-brand")}>
              <h3 className="font-semibold">{p.name}</h3>
              <p className="mt-1 text-2xl font-semibold">${p.priceUsd}<span className="text-sm font-normal text-muted">/month</span></p>
              <ul className="mt-3 flex-1 list-disc space-y-1 pl-5 text-sm text-muted">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
              <p className="mt-3 text-xs text-muted">{lim.maxAgents} agents, {lim.monthlyRuns} runs, {lim.monthlyWorkflowRuns} workflow runs, {lim.monthlyEmails} emails per month.</p>
              <div className="mt-4">
                {isCurrent ? <span className="text-sm font-medium text-brand">Current plan</span>
                  : p.id === "FREE" ? <span className="text-xs text-muted">Cancel in the billing portal to return to Free.</span>
                  : paid ? <span className="text-xs text-muted">Change plans in the billing portal.</span>
                  : !isOwner ? <span className="text-xs text-muted">Only the owner can subscribe.</span>
                  : !cfg.configured || !cfg.priceIds[p.id] ? <span className="text-xs text-muted">Not available: payments or this price are not configured.</span>
                  : <BillingButton kind="checkout" planId={p.id} label={`Upgrade to ${p.name}`} />}
              </div>
            </Card>
          );
        })}
      </section>
      <p className="text-xs text-muted">What you are charged is defined by the Stripe price you configure; the amounts shown here are display values from <code>src/config/plans.ts</code> and must match. Invoice history is in the Stripe billing portal.</p>
    </div>
  );
}
