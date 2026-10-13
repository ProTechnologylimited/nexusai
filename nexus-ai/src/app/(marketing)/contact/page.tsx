import type { Metadata } from "next";
import { SITE } from "@/config/site";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Contact</h1>
      {SITE.contactEmail ? (
        <p className="mt-4 text-muted">Email {SITE.company} at <a className="text-brand hover:underline" href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.</p>
      ) : (
        <p role="note" className="mt-4 rounded-xl border border-warn/40 bg-amber-50 p-4 text-sm">No public contact address has been published yet. The site owner can add one by setting <code>NEXT_PUBLIC_CONTACT_EMAIL</code>.</p>
      )}
    </main>
  );
}
