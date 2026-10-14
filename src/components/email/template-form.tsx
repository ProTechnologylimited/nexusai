"use client";

import { useState, useTransition } from "react";
import { deleteTemplateAction, saveTemplateAction } from "@/app/actions/email";
import { Button, Field, Input } from "@/components/ui/primitives";

export function TemplateForm({ id, defaults }: { id?: string; defaults?: { name: string; subject: string; body: string } }) {
  const [v, setV] = useState(defaults ?? { name: "", subject: "", body: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV((o) => ({ ...o, [k]: e.target.value }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      setMsg(null); setErrors({});
      const r = await saveTemplateAction(id ?? null, v);
      if (r?.fieldErrors) setErrors(r.fieldErrors);
      if (r?.error) setMsg({ ok: false, text: r.error });
      if (r?.ok) setMsg({ ok: true, text: "Saved." });
    });
  };

  return (
    <form onSubmit={save} className="space-y-5" noValidate>
      {msg && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "text-sm text-ok" : "text-sm text-danger"}>{msg.text}</p>}
      <Field label="Template name" htmlFor="t-name" error={errors.name}><Input id="t-name" value={v.name} onChange={set("name")} /></Field>
      <Field label="Subject" htmlFor="t-subject" error={errors.subject}><Input id="t-subject" value={v.subject} onChange={set("subject")} /></Field>
      <Field label="Body" htmlFor="t-body" error={errors.body} hint="Variables: {{lead.name}}, {{lead.company}}, {{lead.email}}">
        <textarea id="t-body" rows={10} className="block w-full rounded-lg border border-line bg-white px-3 py-2 text-sm" value={v.body} onChange={set("body")} />
      </Field>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : id ? "Save changes" : "Create template"}</Button>
        {id && <Button variant="ghost" disabled={pending} onClick={() => { if (window.confirm("Delete this template?")) start(async () => { await deleteTemplateAction(id); }); }}>Delete</Button>}
      </div>
    </form>
  );
}
