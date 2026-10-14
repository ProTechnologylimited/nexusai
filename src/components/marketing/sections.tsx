import Link from "next/link";
import { Bot, Workflow, Users, Megaphone, Contact, Mail, BarChart3, Plug, Check, type LucideIcon } from "lucide-react";
import { PLAN_LIMITS } from "@/config/limits";
import { PLANS } from "@/config/plans";
import { INTEGRATIONS } from "@/services/integrations/registry";
import { buttonClasses } from "@/components/ui/primitives";

const FEATURES: { icon: LucideIcon; title: string; text: string; href: string }[] = [
  { icon: Bot, title: "AI Agents", text: "Create assistants with your own instructions and run requests against them. Every run is recorded.", href: "/agents" },
  { icon: Workflow, title: "Workflow Automation", text: "Define a trigger, conditions, and actions. Failed runs can be inspected and retried safely.", href: "/automation" },
  { icon: Users, title: "Lead Generation", text: "Add leads by hand or CSV import, then qualify and track them. No scraping, no made-up contacts.", href: "/leads" },
  { icon: Megaphone, title: "Marketing Campaigns", text: "Plan campaigns and draft briefs, posts, and copy with AI that you edit before using.", href: "/campaigns" },
  { icon: Contact, title: "Customer Relationship Management", text: "Keep companies, contacts, and deals in one pipeline you can move deals through.", href: "/crm" },
  { icon: Mail, title: "Email Automation", text: "Draft with templates or AI, approve, then send one-to-one with unsubscribe handling built in.", href: "/email" },
  { icon: BarChart3, title: "Business Analytics", text: "See runs, leads, and usage from activity recorded in Nexus AI, with every metric defined.", href: "/analytics" },
  { icon: Plug, title: "Integrations", text: "Connect AI, email, and billing providers. Status is shown honestly, verified by a real check.", href: "/integrations" },
];

const SOLUTIONS = [
  ["Entrepreneurs and startups", "Run leads, a small CRM, and follow-up drafting from one place instead of juggling separate tools."],
  ["Agencies", "Plan client campaigns, draft copy faster, and keep leads and deals organized in shared workspaces."],
  ["Ecommerce businesses", "Organize prospects and partners, and draft promotional copy and outreach for your team to review."],
  ["Consultants and professional services", "Track opportunities through a pipeline and prepare personalized follow-ups you approve before they go out."],
] as const;

const fmt = (n: number) => n.toLocaleString("en-US");

export function FeatureGrid() {
  return (
    <section id="features" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-semibold tracking-tight">Everything in one workspace</h2>
        <p className="mt-2 max-w-2xl text-muted">Eight connected modules that share the same customers, leads, and activity.</p>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text, href }) => (
            <li key={title}>
              <Link href={href} className="group block h-full rounded-2xl border border-line bg-white p-6 transition-colors hover:border-brand">
                <span className="grid size-10 place-items-center rounded-lg bg-brand-soft text-brand"><Icon className="size-5" aria-hidden="true" /></span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted">{text}</p>
                <span className="mt-4 inline-block text-sm font-medium text-brand group-hover:underline">Open</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Solutions() {
  return (
    <section id="solutions" className="scroll-mt-20 bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-semibold tracking-tight">Built for small and growing teams</h2>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {SOLUTIONS.map(([title, text]) => (
            <li key={title} className="rounded-2xl border border-line bg-canvas p-6"><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm text-muted">{text}</p></li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const live = INTEGRATIONS.filter((i) => !i.planned);
  const planned = INTEGRATIONS.filter((i) => i.planned);
  const steps = [
    ["Connect your business tools", "Link an AI provider, an email service, and billing."],
    ["Configure your AI assistants and workflows", "Write instructions, set triggers, and decide what needs approval."],
    ["Monitor results and improve operations", "Review run history, lead activity, and usage as it is recorded."],
  ];
  return (
    <section id="how-it-works" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map(([title, text], i) => (
            <li key={title} className="rounded-2xl border border-line bg-white p-6">
              <span className="grid size-8 place-items-center rounded-full bg-brand text-sm font-semibold text-white">{i + 1}</span>
              <h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm text-muted">{text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 grid gap-4 text-sm md:grid-cols-2">
          <p><span className="font-semibold">Available now:</span> <span className="text-muted">{live.map((i) => i.name).join(", ")}.</span></p>
          <p><span className="font-semibold">Planned, not available yet:</span> <span className="text-muted">{planned.map((i) => i.name).join(", ")}.</span></p>
        </div>
      </div>
    </section>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-semibold tracking-tight">Pricing</h2>
        <p className="mt-2 text-muted">All prices are in USD, billed monthly. AI usage is metered on every plan, and no plan is unlimited. Prices and limits may change.</p>
        <ul className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((p) => {
            const l = PLAN_LIMITS[p.id];
            return (
              <li key={p.id} className="flex flex-col rounded-2xl border border-line bg-canvas p-6">
                <h3 className="font-semibold">{p.name}</h3>
                <p className="mt-2 text-3xl font-semibold">${p.priceUsd}<span className="text-sm font-normal text-muted">/month</span></p>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden="true" />{f}</li>)}
                </ul>
                <p className="mt-4 text-xs text-muted">Each month: {fmt(l.monthlyRuns)} agent runs, {fmt(l.monthlyWorkflowRuns)} workflow runs, {fmt(l.monthlyEmails)} emails, {fmt(l.monthlyCampaignDrafts)} AI drafts. Up to {l.maxAgents} agent{l.maxAgents > 1 ? "s" : ""}.</p>
                <Link href="/register" className={buttonClasses(p.priceUsd === 0 ? "secondary" : "primary", "mt-5")}>{p.priceUsd === 0 ? "Start free" : `Choose ${p.name}`}</Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-xs text-muted">Sending email and some integrations require connecting your own provider accounts, which may have their own costs.</p>
      </div>
    </section>
  );
}
