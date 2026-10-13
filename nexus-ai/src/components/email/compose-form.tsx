"use client";

import { useState, useTransition } from "react";
import { aiDraftAction, createMessageAction } from "@/app/actions/email";
import { Button, Field, Input } from "@/components/ui/primitives";

const sel = "block min-h-10 w-full rounded-lg border border-line bg-white px-3 text-sm";

export function ComposeForm({ leads, templates }: { leads: { id: string; name: string; email: string | null }[]; templates: { id: string; name: string; subject: string; body: string }[] }) {
  const [leadId, setLeadId] = useState("");
  const [instruction, setInstruction] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const draft = () =>
    start(async () => {
      setMsg(null);
      const r = await aiDraftAction({ leadId, instruction });
      if (r.error) return setMsg({ ok: false, text: r.error });
      setSubject(r.subject ?? "");
      setBody(r.body ?? "");
      setMsg({ ok: true, text: "AI draft added. Review and edit it before saving." });
    });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      setMsg(null);
      const r = await createMessageAction({ leadId, subject, body });
      if (r?.fieldErrors) setErrors(r.fieldErrors);
      if (r?.error) setMsg({ ok: false, text: r.error });
    });
  };

  return (
    <form onSubmit={save} className="space-y-5" noValidate>
      {msg && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "text-sm text-ok" : "rounded-lg bg-red-50 px-3 py-2 text-sm text-danger"}>{msg.text}</p>}
      <Field label="Recipient (a lead with an email)" htmlFor="lead" error={errors.leadId}>
        <select id="lead" className={sel} value={leadId} onChange={(e) => setLeadId(e.target.value)}>
          <option value="">Choose a lead</option>
          {leads.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.email})</option>)}
        </select>
      </Field>
      {templates.length > 0 && (
        <Field label="Start from a template (optional)" htmlFor="tpl">
          <select id="tpl" className={sel} defaultValue="" onChange={(e) => { const t = templates.find((x) => x.id === e.target.value); if (t) { setSubject(t.subject); setBody(t.body); } }}>
            <option value="">None</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
      )}
      <div className="flex items-end gap-3">
        <div className="flex-1"><Field label="Ask AI to draft it (optional)" htmlFor="instr"><Input id="instr" placeholder="e.g. Introduce our onboarding service and suggest a call" value={instruction} onChange={(e) => setInstruction(e.target.value)} /></Field></div>
        <Button variant="secondary" disabled={pending || !leadId || instruction.trim().length < 5} onClick={draft}>Draft with AI</Button>
      </div>
      <Field label="Subject" htmlFor="subject" error={errors.subject}><Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} /></Field>
      <Field label="Body" htmlFor="body" error={errors.body} hint="You can use {{lead.name}}, {{lead.company}}, {{lead.email}}. They are filled in when you save.">
        <textarea id="body" rows={10} className="block w-full rounded-lg border border-line bg-white px-3 py-2 text-sm" value={body} onChange={(e) => setBody(e.target.value)} />
      </Field>
      <p className="text-xs text-muted">Only email people who have agreed to hear from you. An unsubscribe link and your postal address are added automatically when sending.</p>
      <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save draft"}</Button>
    </form>
  );
}
