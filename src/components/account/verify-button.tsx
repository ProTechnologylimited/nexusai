"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { verifyEmailAction, type AccountResult } from "@/app/actions/account";
import { Button, buttonClasses } from "@/components/ui/primitives";

export function VerifyButton({ token }: { token: string }) {
  const [res, setRes] = useState<AccountResult | null>(null);
  const [pending, start] = useTransition();
  if (res?.ok) return (
    <div className="space-y-4"><p role="status" className="text-sm text-ok">Your email address is verified.</p><Link href="/dashboard" className={buttonClasses("primary")}>Continue</Link></div>
  );
  return (
    <div className="space-y-3">
      <Button disabled={pending} onClick={() => start(async () => setRes(await verifyEmailAction(token)))}>{pending ? "Verifying..." : "Confirm email address"}</Button>
      {res?.error && <p role="alert" className="text-sm text-danger">{res.error}</p>}
    </div>
  );
}
