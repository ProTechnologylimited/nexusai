"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetPasswordAction, type AccountResult } from "@/app/actions/account";
import { Button, Field, Input } from "@/components/ui/primitives";

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [v, setV] = useState({ password: "", confirmPassword: "" });
  const [res, setRes] = useState<AccountResult | null>(null);
  const [pending, start] = useTransition();
  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await resetPasswordAction({ token, ...v }); setRes(r); if (r.ok) router.push("/login?reset=1"); }); }} className="space-y-5" noValidate>
      {res?.error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{res.error}</p>}
      <Field label="New password" htmlFor="rp-pw" error={res?.fieldErrors?.password} hint="At least 10 characters with upper case, lower case, and a number."><Input id="rp-pw" type="password" autoComplete="new-password" value={v.password} onChange={(e) => setV((o) => ({ ...o, password: e.target.value }))} /></Field>
      <Field label="Confirm password" htmlFor="rp-conf" error={res?.fieldErrors?.confirmPassword}><Input id="rp-conf" type="password" autoComplete="new-password" value={v.confirmPassword} onChange={(e) => setV((o) => ({ ...o, confirmPassword: e.target.value }))} /></Field>
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Saving..." : "Set new password"}</Button>
    </form>
  );
}
