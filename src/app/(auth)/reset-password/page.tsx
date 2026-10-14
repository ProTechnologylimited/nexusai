import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/account/reset-form";
import { peekToken } from "@/services/auth/tokens";

export const metadata: Metadata = { title: "Set a new password", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const valid = token ? await peekToken(token, "PASSWORD_RESET") : null;
  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password you don't use elsewhere.">
      {valid && token ? <ResetForm token={token} /> : (
        <p className="text-sm text-muted">This reset link is invalid, expired, or already used. <Link href="/forgot-password" className="text-brand hover:underline">Request a new one</Link>.</p>
      )}
    </AuthShell>
  );
}
