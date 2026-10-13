import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service (draft)" };

const SECTIONS: [string, string[]][] = [
  ["The service", ["Nexus AI is a business automation platform provided by ProTechnology Limited. Features and availability may change."]],
  ["Accounts and workspaces", ["You are responsible for your account, for keeping your password secure, and for the people you invite to your workspace."]],
  ["Acceptable use", ["Do not use the service to send unsolicited bulk email, to harass or deceive people, to scrape sites in breach of their terms, or to break any law. Only email people you have a lawful basis to contact."]],
  ["AI-generated content", ["AI output can be inaccurate or inappropriate. You are responsible for reviewing it before use. Nexus AI does not guarantee any business result."]],
  ["Plans, billing, and limits", ["Paid plans are billed through our payment provider. Each plan has usage limits, and a plan changes only after payment is confirmed. Refund and cancellation terms: [TBD]."]],
  ["Termination", ["Either party may end the agreement. What happens to your data afterwards: [TBD]."]],
  ["Liability and warranties", ["Warranty disclaimers, limitation of liability, and indemnity: [TBD, requires legal review]."]],
  ["Governing law and contact", ["Governing law, jurisdiction, and contact details: [TBD]."]],
];

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of Service (draft)</h1>
      <p role="note" className="rounded-xl border border-warn/40 bg-amber-50 p-4 text-sm"><strong>Draft for legal review.</strong> This page was prepared to reflect how the product currently works. It is not legal advice, has not been reviewed by a lawyer, and must be reviewed and completed before launch. Items marked [TBD] are intentionally left open.</p>
      {SECTIONS.map(([title, paras]) => (
        <section key={title}><h2 className="text-xl font-semibold">{title}</h2>{paras.map((p) => <p key={p} className="mt-2 text-sm text-muted">{p}</p>)}</section>
      ))}
    </main>
  );
}
