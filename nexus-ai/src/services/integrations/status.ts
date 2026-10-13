// Pure status logic. An integration is only "Verified" after a real, successful connection check.
export type CheckResult = { ok: boolean; message: string; checkedAt: Date };
export type StatusTone = "ok" | "warn" | "danger" | "muted";

export function deriveStatus(input: { planned?: boolean; configured: boolean; check: CheckResult | null }): { label: string; tone: StatusTone } {
  if (input.planned) return { label: "Planned", tone: "muted" };
  if (!input.configured) return { label: "Not configured", tone: "muted" };
  if (!input.check) return { label: "Configured, not verified", tone: "warn" };
  return input.check.ok ? { label: "Verified", tone: "ok" } : { label: "Check failed", tone: "danger" };
}
