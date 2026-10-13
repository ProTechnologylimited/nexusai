"use client";

import { useState, useTransition } from "react";
import { createCompanyAction, createContactAction, createDealAction, type CrmResult } from "@/app/actions/crm";
import { DEAL_STAGES } from "@/lib/validation/crm";
import { Button, Field, Input } from "@/components/ui/primitives";

type Kind = "company" | "contact" | "deal";
const sel = "block min-h-10 w-full rounded-lg border border-line bg-white px-3 text-sm";
const LABEL: Record<Kind, string> = { company: "Add company", contact: "Add contact", deal: "Add deal" };
const ACTION: Record<Kind, (v: unknown) => Promise<CrmResult>> = { company: createCompanyAction, contact: createContactAction, deal: createDealAction };

export function RecordForm({ kind, companies }: { kind: Kind; companies: { id: string; name: string }[] }) {
  const [v, setV] = useState<Record<string, string>>({ currency: "USD", stage: "NEW" });
  const [res, setRes] = useState<CrmResult>({});
  const [pending, start] = useTransition();
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((o) => ({ ...o, [k]: e.target.value }));
  const err = (k: string) => res.fieldErrors?.[k];
  const text = (k: string, label: string, type = "text") => (
    <Field label={label} htmlFor={`${kind}-${k}`} error={err(k)}>
      <Input id={`${kind}-${k}`} type={type} value={v[k] ?? ""} onChange={set(k)} aria-invalid={!!err(k)} />
    </Field>
  );
  const companySelect = (
    <Field label="Company" htmlFor={`${kind}-companyId`} error={err("companyId")}>
      <select id={`${kind}-companyId`} className={sel} value={v.companyId ?? ""} onChange={set("companyId")}>
        <option value="">None</option>
        {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </Field>
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await ACTION[kind](v);
      setRes(r);
      if (r.ok) setV({ currency: "USD", stage: "NEW" });
    });
  };

  return (
    <details className="rounded-xl border border-line bg-white">
      <summary className="cursor-pointer list-none px-5 py-3 text-sm font-medium text-brand">{LABEL[kind]}</summary>
      <form onSubmit={submit} className="grid gap-4 border-t border-line p-5 sm:grid-cols-2" noValidate>
        {res.error && <p role="alert" className="text-sm text-danger sm:col-span-2">{res.error}</p>}
        {res.ok && <p role="status" className="text-sm text-ok sm:col-span-2">Saved.</p>}
        {text("name", kind === "deal" ? "Deal name" : kind === "company" ? "Company name" : "Contact name")}
        {kind === "company" && <>{text("website", "Website")}{text("industry", "Industry")}{text("size", "Company size")}</>}
        {kind === "contact" && <>{text("email", "Email", "email")}{text("phone", "Phone")}{text("source", "Source")}{text("tags", "Tags (comma separated)")}{companySelect}</>}
        {kind === "deal" && (
          <>
            {companySelect}
            {text("value", "Estimated value")}
            {text("currency", "Currency")}
            <Field label="Stage" htmlFor="deal-stage">
              <select id="deal-stage" className={sel} value={v.stage} onChange={set("stage")}>
                {DEAL_STAGES.map((s) => <option key={s} value={s}>{s[0] + s.slice(1).toLowerCase()}</option>)}
              </select>
            </Field>
            {text("expectedCloseDate", "Expected close date", "date")}
          </>
        )}
        <div className="sm:col-span-2">
          <Field label="Notes" htmlFor={`${kind}-notes`}>
            <textarea id={`${kind}-notes`} rows={3} className="block w-full rounded-lg border border-line bg-white px-3 py-2 text-sm" value={v.notes ?? ""} onChange={set("notes")} />
          </Field>
        </div>
        <div className="sm:col-span-2"><Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save"}</Button></div>
      </form>
    </details>
  );
}
