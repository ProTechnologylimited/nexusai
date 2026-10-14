"use client";

import { useState, useTransition } from "react";
import { openPortalAction, startCheckoutAction } from "@/app/actions/billing";
import { Button } from "@/components/ui/primitives";

export function BillingButton({ kind, planId, label, variant = "primary" }: { kind: "checkout" | "portal"; planId?: string; label: string; variant?: "primary" | "secondary" }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <Button variant={variant} disabled={pending} onClick={() => start(async () => {
        setError(null);
        const r = kind === "checkout" ? await startCheckoutAction(planId ?? "") : await openPortalAction();
        if (r.error) setError(r.error);
        else if (r.url) window.location.assign(r.url);
      })}>{pending ? "Redirecting..." : label}</Button>
      {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
