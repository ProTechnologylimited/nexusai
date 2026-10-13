import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/primitives";
import { SITE } from "@/config/site";

export const metadata: Metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Support</h1>
      <Card className="mt-8 space-y-3 p-6 text-sm">
        <p>Browse the <Link href="/help" className="text-brand hover:underline">Help Center</Link> for getting-started steps and common questions.</p>
        {SITE.contactEmail
          ? <p>Need more help? Email <a className="text-brand hover:underline" href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.</p>
          : <p className="text-muted">No support contact address has been published yet. See <Link href="/contact" className="text-brand hover:underline">Contact</Link>.</p>}
      </Card>
    </div>
  );
}
