import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy (draft)" };

const SECTIONS: [string, string[]][] = [
  ["Who we are", ["Nexus AI is operated by ProTechnology Limited. Registered address, registration number, and data-protection contact: [TBD]."]],
  ["Information we collect", ["Account details: name, email address, and a hashed password (never the plain password).", "Workspace content you enter: leads, contacts, companies, deals, campaigns, agent instructions and requests, email drafts and templates.", "Activity and usage records: agent and workflow runs, email status, activity log entries, and billing status.", "Cookies: a session cookie to keep you signed in and a cookie remembering your active workspace. No advertising cookies are used by the application."]],
  ["How we use it", ["To provide the features you use, enforce plan limits, secure accounts, and operate billing. Retention periods: [TBD]."]],
  ["Service providers who process data", ["AI model provider (currently Anthropic): receives the text of requests and context needed to produce a draft or response.", "Email provider (currently Resend): receives recipient address, subject, and body of emails you send, and account emails such as password resets.", "Payment provider (currently Stripe): handles payment details; Nexus AI does not store card numbers.", "Hosting and database provider: [TBD]."]],
  ["Email and consent", ["You are responsible for having a lawful basis to email the people you contact. Emails include your postal address and an unsubscribe link, and unsubscribed addresses are suppressed."]],
  ["Your rights", ["Access, correction, deletion, and export requests, and applicable regional rights (for example under GDPR or CCPA): process and contact [TBD]."]],
  ["Security", ["Passwords are hashed, credentials are kept on the server, and workspace data is isolated per workspace. No system is perfectly secure."]],
  ["Changes", ["How changes are announced: [TBD]."]],
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy (draft)</h1>
      <p role="note" className="rounded-xl border border-warn/40 bg-amber-50 p-4 text-sm"><strong>Draft for legal review.</strong> This page was prepared to reflect how the product currently works. It is not legal advice, has not been reviewed by a lawyer, and must be reviewed and completed before launch. Items marked [TBD] are intentionally left open.</p>
      {SECTIONS.map(([title, paras]) => (
        <section key={title}><h2 className="text-xl font-semibold">{title}</h2>{paras.map((p) => <p key={p} className="mt-2 text-sm text-muted">{p}</p>)}</section>
      ))}
    </main>
  );
}
