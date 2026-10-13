"use client";

import { useState, useTransition } from "react";
import { unsubscribeAction } from "@/app/actions/email";
import { Button } from "@/components/ui/primitives";

export function UnsubscribeButton({ token }: { token: string }) {
  const [res, setRes] = useState<{ ok?: boolean; error?: string } | null>(null);
  const [pending, start] = useTransition();
  if (res?.ok) return <p role="status" className="text-sm text-ok">You have been unsubscribed. You won&apos;t receive further emails from this sender.</p>;
  return (
    <div className="space-y-3">
      <Button disabled={pending} onClick={() => start(async () => setRes(await unsubscribeAction(token)))}>{pending ? "Working..." : "Confirm unsubscribe"}</Button>
      {res?.error && <p role="alert" className="text-sm text-danger">{res.error}</p>}
    </div>
  );
}
