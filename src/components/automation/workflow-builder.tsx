"use client";

import { useState, useTransition } from "react";
import { saveWorkflowAction } from "@/app/actions/workflows";
import { LEAD_STATUSES } from "@/lib/validation/leads";
import { Button, Field, Input } from "@/components/ui/primitives";

type Act = { type: "NOTIFY" | "UPDATE_LEAD_STATUS" | "SET_FOLLOW_UP" | "AI_DRAFT_NOTE"; text: string };
export type BuilderDefaults = {
  name: string; description: string; trigger: "MANUAL" | "LEAD_CREATED";
  requireEmail: boolean; statusIs: string; sourceIs: string; actions: Act[];
};

const sel = "block min-h-10 w-full rounded-lg border border-line bg-white px-3 text-sm";
const LABELS: Record<Act["type"], string> = {
  NOTIFY: "Notify the team", UPDATE_LEAD_STATUS: "Set lead status", SET_FOLLOW_UP: "Set follow-up date (days from now)", AI_DRAFT_NOTE: "Draft a follow-up with AI (saved to lead notes)",
};
const HINT: Record<Act["type"], string> = {
  NOTIFY: "Message. You can use {{lead.name}}, {{lead.company}}, {{lead.email}}", UPDATE_LEAD_STATUS: "Status", SET_FOLLOW_UP: "Days", AI_DRAFT_NOTE: "What should the draft say?",
};

export const EMPTY: BuilderDefaults = { name: "", description: "", trigger: "LEAD_CREATED", requireEmail: true, statusIs: "", sourceIs: "", actions: [{ type: "NOTIFY", text: "New lead: {{lead.name}}" }] };

function toAction(a: Act) {
  switch (a.type) {
    case "NOTIFY": return { type: a.type, message: a.text };
    case "UPDATE_LEAD_STATUS": return { type: a.type, status: a.text || "CONTACTED" };
    case "SET_FOLLOW_UP": return { type: a.type, days: Number(a.text || 0) };
    case "AI_DRAFT_NOTE": return { type: a.type, instruction: a.text };
  }
}

export function WorkflowBuilder({ id, defaults = EMPTY }: { id?: string; defaults?: BuilderDefaults }) {
  const [s, setS] = useState(defaults);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof BuilderDefaults>(k: K, v: BuilderDefaults[K]) => setS((o) => ({ ...o, [k]: v }));
  const setAct = (i: number, patch: Partial<Act>) => set("actions", s.actions.map((a, j) => (j === i ? { ...a, ...patch } : a)));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const conditions = [
      ...(s.requireEmail ? [{ field: "hasEmail" as const }] : []),
      ...(s.statusIs ? [{ field: "status" as const, value: s.statusIs }] : []),
      ...(s.sourceIs.trim() ? [{ field: "source" as const, value: s.sourceIs.trim() }] : []),
    ];
    start(async () => {
      setMsg(null);
      const res = await saveWorkflowAction(id ?? null, {
        name: s.name, description: s.description, trigger: s.trigger, definition: { conditions, actions: s.actions.map(toAction) },
      });
      if (res?.error) setMsg({ ok: false, text: res.error });
      else if (res?.ok) setMsg({ ok: true, text: "Saved." });
    });
  };

  return (
    <form onSubmit={save} className="space-y-6" noValidate>
      {msg && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "text-sm text-ok" : "rounded-lg bg-red-50 px-3 py-2 text-sm text-danger"}>{msg.text}</p>}
      <Field label="Workflow name" htmlFor="wf-name"><Input id="wf-name" value={s.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <Field label="Description (optional)" htmlFor="wf-desc"><Input id="wf-desc" value={s.description} onChange={(e) => set("description", e.target.value)} /></Field>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Trigger</legend>
        <select aria-label="Trigger" className={sel} value={s.trigger} onChange={(e) => set("trigger", e.target.value as BuilderDefaults["trigger"])}>
          <option value="LEAD_CREATED">A lead is added manually</option>
          <option value="MANUAL">I run it myself</option>
        </select>
        <p className="text-xs text-muted">Event triggers only run while the workflow is active, and need the background worker to be scheduled. Leads added by CSV import do not trigger workflows yet.</p>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Conditions (all must match)</legend>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-indigo-500" checked={s.requireEmail} onChange={(e) => set("requireEmail", e.target.checked)} /> Lead has a valid email</label>
        <div className="grid gap-3 sm:grid-cols-2">
          <select aria-label="Lead status condition" className={sel} value={s.statusIs} onChange={(e) => set("statusIs", e.target.value)}>
            <option value="">Any status</option>
            {LEAD_STATUSES.map((x) => <option key={x} value={x}>{x[0] + x.slice(1).toLowerCase()}</option>)}
          </select>
          <Input aria-label="Lead source condition" placeholder="Source equals (optional)" value={s.sourceIs} onChange={(e) => set("sourceIs", e.target.value)} />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Actions (run in order)</legend>
        <p className="text-xs text-muted">Actions only change your own Nexus AI data. No emails or external messages are sent.</p>
        {s.actions.map((a, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-line p-3">
            <div className="flex gap-2">
              <select aria-label={`Action ${i + 1} type`} className={sel} value={a.type} onChange={(e) => setAct(i, { type: e.target.value as Act["type"], text: "" })}>
                {(Object.keys(LABELS) as Act["type"][]).map((t) => <option key={t} value={t}>{LABELS[t]}</option>)}
              </select>
              <Button variant="ghost" aria-label={`Remove action ${i + 1}`} onClick={() => set("actions", s.actions.filter((_, j) => j !== i))}>Remove</Button>
            </div>
            {a.type === "UPDATE_LEAD_STATUS" ? (
              <select aria-label="Status" className={sel} value={a.text || "CONTACTED"} onChange={(e) => setAct(i, { text: e.target.value })}>
                {LEAD_STATUSES.map((x) => <option key={x} value={x}>{x[0] + x.slice(1).toLowerCase()}</option>)}
              </select>
            ) : (
              <Input aria-label={HINT[a.type]} placeholder={HINT[a.type]} inputMode={a.type === "SET_FOLLOW_UP" ? "numeric" : undefined} value={a.text} onChange={(e) => setAct(i, { text: e.target.value })} />
            )}
          </div>
        ))}
        {s.actions.length < 10 && <Button variant="secondary" onClick={() => set("actions", [...s.actions, { type: "NOTIFY", text: "" }])}>Add action</Button>}
      </fieldset>

      <Button type="submit" disabled={pending}>{pending ? "Saving..." : id ? "Save changes" : "Create workflow"}</Button>
    </form>
  );
}
