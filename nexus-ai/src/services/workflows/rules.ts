// Pure workflow logic (no database, no framework imports) so it is easy to unit test.

export type Condition =
  | { field: "hasEmail" }
  | { field: "status"; value: string }
  | { field: "source"; value: string };

export type Action =
  | { type: "NOTIFY"; message: string }
  | { type: "UPDATE_LEAD_STATUS"; status: string }
  | { type: "SET_FOLLOW_UP"; days: number }
  | { type: "AI_DRAFT_NOTE"; instruction: string };

export type RuleLead = { name: string; company: string | null; email: string | null; status: string; source: string | null };
export type StepLog = { index: number; type: string; status: "done" | "failed"; detail: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function evaluateConditions(conditions: Condition[], lead: RuleLead | null): { ok: boolean; reason?: string } {
  if (conditions.length === 0) return { ok: true };
  if (!lead) return { ok: false, reason: "Conditions need a lead, but none was provided." };
  for (const c of conditions) {
    if (c.field === "hasEmail" && !(lead.email && EMAIL.test(lead.email))) return { ok: false, reason: "Lead has no valid email." };
    if (c.field === "status" && lead.status !== c.value) return { ok: false, reason: `Lead status is ${lead.status}, not ${c.value}.` };
    if (c.field === "source" && (lead.source ?? "").toLowerCase() !== c.value.toLowerCase()) return { ok: false, reason: `Lead source does not match "${c.value}".` };
  }
  return { ok: true };
}

export function renderTemplate(text: string, lead: RuleLead | null): string {
  return text
    .replace(/\{\{\s*lead\.name\s*\}\}/g, lead?.name ?? "")
    .replace(/\{\{\s*lead\.company\s*\}\}/g, lead?.company ?? "")
    .replace(/\{\{\s*lead\.email\s*\}\}/g, lead?.email ?? "");
}

/** Steps already completed in a previous attempt are not repeated on retry. */
export function nextStepIndex(log: StepLog[], index: number): boolean {
  return !log.some((s) => s.index === index && s.status === "done");
}

export function idempotencyKeyForLeadCreated(leadId: string) {
  return `lead_created:${leadId}`;
}
