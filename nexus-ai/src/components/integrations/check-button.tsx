"use client";

import { useState, useTransition } from "react";
import { checkIntegrationAction } from "@/app/actions/integrations";
import { Button } from "@/components/ui/primitives";

export function CheckButton({ integrationKey }: { integrationKey: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-2">
      <Button variant="secondary" disabled={pending} onClick={() => start(async () => {
        setMsg(null);
        const r = await checkIntegrationAction(integrationKey);
        setMsg(r.error ? { ok: false, text: r.error } : { ok: !!r.ok, text: r.message ?? "" });
      })}>{pending ? "Checking..." : "Check connection"}</Button>
      {msg && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "text-xs text-ok" : "text-xs text-danger"}>{msg.text}</p>}
    </div>
  );
}
