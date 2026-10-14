"use client";

import { useState, useTransition } from "react";
import { runAgentAction, setAgentStatusAction } from "@/app/actions/agents";
import { Button } from "@/components/ui/primitives";

export function RunPanel({ agentId, status, canManage }: { agentId: string; status: "ACTIVE" | "PAUSED" | "DISABLED"; canManage: boolean }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = () =>
    start(async () => {
      setError(null);
      const res = await runAgentAction({ agentId, input });
      if (res.error) setError(res.error);
      else setInput("");
    });

  const toggle = () =>
    start(async () => {
      setError(null);
      const res = await setAgentStatusAction(agentId, status === "ACTIVE" ? "PAUSED" : "ACTIVE");
      if (res.error) setError(res.error);
    });

  return (
    <div className="space-y-3">
      <label htmlFor="run-input" className="text-sm font-medium">Request</label>
      <textarea
        id="run-input" rows={4} value={input} onChange={(e) => setInput(e.target.value)} disabled={status !== "ACTIVE"}
        className="block w-full rounded-lg border border-line bg-white px-3 py-2 text-sm disabled:bg-slate-50"
        placeholder={status === "ACTIVE" ? "What should the agent work on?" : "Resume the agent to run requests."}
      />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex gap-3">
        <Button onClick={run} disabled={pending || status !== "ACTIVE" || !input.trim()}>{pending ? "Running..." : "Run agent"}</Button>
        {canManage && <Button variant="secondary" onClick={toggle} disabled={pending}>{status === "ACTIVE" ? "Pause agent" : "Resume agent"}</Button>}
      </div>
    </div>
  );
}
