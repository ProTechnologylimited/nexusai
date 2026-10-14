import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { UnsubscribeButton } from "@/components/email/unsubscribe-button";
import { verifyUnsubToken } from "@/lib/security/unsub-token";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const v = t ? verifyUnsubToken(t, process.env.AUTH_SECRET ?? "") : null;
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <Logo />
      <h1 className="mt-10 text-2xl font-semibold tracking-tight">Unsubscribe</h1>
      {v && t ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted">Stop receiving emails at <strong className="text-ink">{v.email}</strong>?</p>
          <UnsubscribeButton token={t} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">This unsubscribe link is not valid or has been altered.</p>
      )}
    </main>
  );
}
