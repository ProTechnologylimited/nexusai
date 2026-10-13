import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Help Center" };

const FAQ = [
  ["Does Nexus AI send emails by itself?", "No. Emails are written as drafts, an owner or admin approves each one, and only then can it be sent. Every email includes an unsubscribe link, and unsubscribed people are never emailed again."],
  ["Is AI output always correct?", "No. AI drafts can contain mistakes. Review and edit everything before you use it. Drafts are never published or sent automatically."],
  ["Where do leads come from?", "You add them manually or by CSV import. Nexus AI doesn't scrape websites or invent contact details."],
  ["What does 'accepted by provider' mean for an email?", "The email service took the message. It does not confirm delivery to the inbox, because delivery tracking isn't available yet."],
  ["How do plan limits work?", "Each plan caps agents, agent runs, workflow runs, emails, and AI drafts per month. You can see your usage in Analytics and manage your plan in Billing."],
  ["Which integrations are available?", "AI model provider, email service, and billing are available. Webhooks, external CRM sync, and social or ad platforms are planned and not available yet."],
];

export default function HelpPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Help Center</h1>
      <h2 className="mt-10 text-xl font-semibold">Getting started</h2>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted">
        <li>Create an account and answer the short setup questions.</li>
        <li>Create an AI agent and try a request.</li>
        <li>Add a few leads, or import a CSV file with a name column.</li>
        <li>Build a workflow, such as notifying your team when a lead is added.</li>
        <li>Check Integrations to see which providers are connected.</li>
      </ol>
      <Link href="/register" className={buttonClasses("primary", "mt-6")}>Create an account</Link>
      <h2 className="mt-14 text-xl font-semibold">Common questions</h2>
      <dl className="mt-4 divide-y divide-line">
        {FAQ.map(([q, a]) => <div key={q} className="py-4"><dt className="font-medium">{q}</dt><dd className="mt-1 text-sm text-muted">{a}</dd></div>)}
      </dl>
      <p className="mt-10 text-sm text-muted">Still stuck? See <Link href="/contact" className="text-brand hover:underline">Contact</Link>.</p>
    </main>
  );
}
