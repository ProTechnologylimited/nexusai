"use client";

import { useState, useTransition } from "react";
import { approveAction, discardAction, sendAction } from "@/app/actions/email";
import { Button } from "@/components/ui/primitives";

export function MessageControls({ id, status, canManage, canSend }: { id: string; status: string; canManage: boolean; canSend: boolean }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ error?: string }>) => start(async () => { setMsg(null); const r = await fn(); if (r?.error) setMsg(r.error); });
  if (!canManage) return <p className="text-sm text-muted">Only owners and admins can approve and send emails.</p>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {status === "DRAFT" && <Button disabled={pending} onClick={() => run(() => approveAction(id))}>Approve</Button>}
        {(status === "APPROVED" || status === "FAILED") && (
          <Button disabled={pending || !canSend} onClick={() => { if (window.confirm("Send this email now?")) run(() => sendAction(id)); }}>{status === "FAILED" ? "Retry send" : "Send now"}</Button>
        )}
        {["DRAFT", "APPROVED", "FAILED"].includes(status) && (
          <Button variant="ghost" disabled={pending} onClick={() => { if (window.confirm("Discard this email?")) run(() => discardAction(id)); }}>Discard</Button>
        )}
      </div>
      {(status === "APPROVED" || status === "FAILED") && !canSend && <p className="text-xs text-muted">Sending is disabled until the email provider is configured.</p>}
      {msg && <p role="alert" className="text-sm text-danger">{msg}</p>}
    </div>
  );
}
