"use client";

import { useState, useTransition } from "react";
import { resendVerificationAction } from "@/app/actions/account";
import { Button } from "@/components/ui/primitives";

export function VerifyBanner({ canSend }: { canSend: boolean }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div role="note" className="mx-auto mb-6 flex max-w-6xl flex-wrap items-center justify-between gap-3 rounded-xl border border-warn/40 bg-amber-50 px-4 py-3 text-sm">
      <p>{canSend ? "Verify your email address. Sending emails to leads requires a verified account." : "Your email is not verified. Verification email isn't set up on this server yet, so ask your administrator to configure it."}</p>
      {canSend && (
        <div className="flex items-center gap-3">
          {msg && <span role="status" className="text-xs text-muted">{msg}</span>}
          <Button variant="secondary" disabled={pending} onClick={() => start(async () => {
            const r = await resendVerificationAction();
            setMsg(r.error ?? (r.notConfigured ? "Email is not configured." : "Verification email sent."));
          })}>Resend email</Button>
        </div>
      )}
    </div>
  );
}
