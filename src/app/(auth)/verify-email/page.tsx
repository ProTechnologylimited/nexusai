import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyButton } from "@/components/account/verify-button";
import { peekToken } from "@/services/auth/tokens";

export const metadata: Metadata = { title: "Verify email", robots: { index: false } };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const valid = token ? await peekToken(token, "EMAIL_VERIFY") : null;
  return (
    <AuthShell title="Verify your email" subtitle="One last step to confirm this is your address.">
      {valid && token ? <VerifyButton token={token} /> : (
        <p className="text-sm text-muted">This verification link is invalid, expired, or already used. Sign in and use &ldquo;Resend email&rdquo; from the banner. <Link href="/login" className="text-brand hover:underline">Sign in</Link></p>
      )}
    </AuthShell>
  );
}
