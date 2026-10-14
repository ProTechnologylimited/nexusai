"use client";

import { useRef, useState, useTransition } from "react";
import { importLeadsAction } from "@/app/actions/leads";
import { Button } from "@/components/ui/primitives";

export function ImportPanel() {
  const ref = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const onFile = (file: File | undefined) => {
    if (!file) return;
    start(async () => {
      setMsg(null);
      const res = await importLeadsAction(await file.text());
      if (res.error) setMsg({ ok: false, text: res.error });
      else setMsg({ ok: true, text: `Imported ${res.created} lead${res.created === 1 ? "" : "s"}. Skipped ${res.skipped} (missing name, invalid or duplicate email).` });
      if (ref.current) ref.current.value = "";
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input ref={ref} type="file" accept=".csv,text/csv" className="sr-only" id="csv-file" onChange={(e) => onFile(e.target.files?.[0])} />
      <Button variant="secondary" disabled={pending} onClick={() => ref.current?.click()}>{pending ? "Importing..." : "Import CSV"}</Button>
      <a href="/api/leads/export" className="inline-flex min-h-10 items-center rounded-lg border border-line bg-white px-4 text-sm font-medium hover:bg-slate-50">Export CSV</a>
      {msg && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "text-sm text-ok" : "text-sm text-danger"}>{msg.text}</p>}
    </div>
  );
}
