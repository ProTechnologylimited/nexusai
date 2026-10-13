"use client";

import { useState, useTransition } from "react";
import { moveDealAction } from "@/app/actions/crm";
import { DEAL_STAGES } from "@/lib/validation/crm";

export function StageSelect({ id, stage, name }: { id: string; stage: string; name: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <select
        aria-label={`Move deal ${name} to stage`} value={stage} disabled={pending}
        className="mt-2 min-h-9 w-full rounded-lg border border-line bg-white px-2 text-xs"
        onChange={(e) => start(async () => { setError(null); const r = await moveDealAction({ id, stage: e.target.value }); if (r.error) setError(r.error); })}
      >
        {DEAL_STAGES.map((s) => <option key={s} value={s}>{s[0] + s.slice(1).toLowerCase()}</option>)}
      </select>
      {error && <p role="alert" className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
