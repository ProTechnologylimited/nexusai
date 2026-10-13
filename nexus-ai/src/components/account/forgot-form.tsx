"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { forgotPasswordAction, type AccountResult } from "@/app/actions/account";
import { Button, Field, Input } from "@/components/ui/primitives";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [res, setRes] = useState<AccountResult | null>(null);
  const [pending, start] = useTransition();

  if (res?.ok) return <p role="status" className="rounded-lg bg-brand-soft px-3 py-3 text-sm">If an account exists for that address, we&apos;ve sent a reset link. It works for 1 hour.</p>;
  if (res?.notConfigured) return (
    <p role="alert" className="rounded-lg border border-warn/40 bg-amber-50 px-3 py-3 text-sm">Password reset emails aren&apos;t available because email sending isn&apos;t configured on this server. Contact the administrator (they need RESEND_API_KEY, EMAIL_FROM, and APP_URL).</p>
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => setRes(await forgotPasswordAction({ email }))); }} className="space-y-5" noValidate>
      <Field label="Email" htmlFor="fp-email" error={res?.fieldErrors?.email}><Input id="fp-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Sending..." : "Send reset link"}</Button>
      <p className="text-center text-sm text-muted"><Link href="/login" className="text-brand hover:underline">Back to sign in</Link></p>
    </form>
  );
}
