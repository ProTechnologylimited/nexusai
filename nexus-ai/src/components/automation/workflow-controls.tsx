"use client";

import { useState, useTransition } from "react";
import { deleteWorkflowAction, processNowAction, retryAction, runTestAction, setWorkflowStatusAction } from "@/app/actions/workflows";
import { Button } from "@/components/ui/primitives";

export function StatusButton({ id, status }: { id: string; status: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const next = status === "ACTIVE" ? "PAUSED" : "ACTIVE";
  return (
    <span>
      <Button variant="secondary" disabled={pending} onClick={() => start(async () => { setError(null); const r = await setWorkflowStatusAction(id, next); if (r.error) setError(r.error); })}>
        {next === "ACTIVE" ? "Activate" : "Pause"}
      </Button>
      {error && <span role="alert" className="ml-2 text-xs text-danger">{error}</span>}
    </span>
  );
}

export function DetailControls({ id, status, leads }: { id: string; status: string; leads: { id: string; name: string }[] }) {
  const [leadId, setLeadId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>, ok: string) =>
    start(async () => { setMsg(null); const r = await fn(); setMsg(r.error ?? ok); });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <label htmlFor="test-lead" className="text-sm font-medium">Test with lead</label>
          <select id="test-lead" className="mt-1.5 block min-h-10 w-full rounded-lg border border-line bg-white px-3 text-sm" value={leadId} onChange={(e) => setLeadId(e.target.value)}>
            <option value="">No lead</option>
            {leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <Button disabled={pending} onClick={() => run(() => runTestAction(id, leadId || null), "Test run finished. See history below.")}>Run test</Button>
        <Button variant="secondary" disabled={pending} onClick={() => run(() => processNowAction(id), "Processed pending runs.")}>Process pending now</Button>
        <StatusButton id={id} status={status} />
        <Button variant="ghost" disabled={pending} onClick={() => { if (window.confirm("Delete this workflow and its run history?")) run(() => deleteWorkflowAction(id), "Deleted."); }}>Delete</Button>
      </div>
      <p className="text-xs text-muted">A test run really performs the actions on the selected lead (for example, changing its status).</p>
      {msg && <p role="status" className="text-sm text-muted">{msg}</p>}
    </div>
  );
}

export function RetryButton({ workflowId, executionId }: { workflowId: string; executionId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <span>
      <Button variant="secondary" disabled={pending} onClick={() => start(async () => { setError(null); const r = await retryAction(workflowId, executionId); if (r.error) setError(r.error); })}>Retry</Button>
      {error && <span role="alert" className="ml-2 text-xs text-danger">{error}</span>}
    </span>
  );
}
