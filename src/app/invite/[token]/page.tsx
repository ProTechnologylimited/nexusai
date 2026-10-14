import type { Metadata } from "next";
import Link from "next/link";
import { AcceptInviteButton } from "@/components/settings/accept-invite-button";
import { Logo } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/primitives";
import { auth } from "@/lib/auth";
import { inviteInfo } from "@/services/team/team";

export const metadata: Metadata = { title: "Join workspace", robots: { index: false } };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [info, session] = await Promise.all([inviteInfo(token), auth()]);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <Logo />
      <h1 className="mt-10 text-2xl font-semibold tracking-tight">Join a workspace</h1>
      {!info ? (
        <p className="mt-4 text-sm text-muted">This invite link is invalid, expired, or already used. Ask the workspace owner for a new one.</p>
      ) : (
        <div className="mt-4 space-y-5">
          <p className="text-sm text-muted">You&apos;ve been invited to <strong className="text-ink">{info.workspaceName}</strong> as {info.role.toLowerCase()}.</p>
          {session?.user ? <AcceptInviteButton token={token} /> : (
            <div className="space-y-3">
              <Link href={`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`} className={buttonClasses("primary", "w-full")}>Sign in to join</Link>
              <p className="text-xs text-muted">New here? <Link href="/register" className="text-brand hover:underline">Create an account</Link>, then open this invite link again.</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
