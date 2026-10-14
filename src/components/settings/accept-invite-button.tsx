"use client";

import { useState, useTransition } from "react";
import { acceptInviteAction } from "@/app/actions/team";
import { Button } from "@/components/ui/primitives";

export function AcceptInviteButton({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3">
      <Button disabled={pending} onClick={() => start(async () => { const r = await acceptInviteAction(token); if (r?.error) setError(r.error); })}>{pending ? "Joining..." : "Join workspace"}</Button>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
