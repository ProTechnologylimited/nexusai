// Pure helpers (no database or framework imports). All day buckets use UTC dates.
export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

export function parseRange(v?: string): Range {
  const n = Number(v);
  return (RANGES as readonly number[]).includes(n) ? (n as Range) : 30;
}

const dayStart = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

/** First instant (UTC midnight) of a window that ends today and spans `days` calendar days. */
export function rangeStart(days: number, now = new Date()) {
  const d = dayStart(now);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d;
}

export function dayKeys(days: number, now = new Date()): string[] {
  const start = rangeStart(days, now);
  return Array.from({ length: days }, (_, i) => new Date(start.getTime() + i * 86_400_000).toISOString().slice(0, 10));
}

/** Counts events per day, oldest to newest. Events outside the window are ignored. */
export function bucketByDay(dates: Date[], days: number, now = new Date()): number[] {
  const keys = dayKeys(days, now);
  const index = new Map(keys.map((k, i) => [k, i]));
  const counts = new Array<number>(days).fill(0);
  for (const d of dates) {
    const i = index.get(d.toISOString().slice(0, 10));
    if (i !== undefined) counts[i]++;
  }
  return counts;
}

/** Share of finished runs that succeeded, as a whole percent. Null when nothing has finished. */
export function successRate(succeeded: number, failed: number): number | null {
  const finished = succeeded + failed;
  return finished === 0 ? null : Math.round((succeeded / finished) * 100);
}

export const usagePercent = (used: number, limit: number) => (limit <= 0 ? 100 : Math.min(100, Math.round((used / limit) * 100)));

export function countStatuses<T extends { status: string }>(rows: T[]) {
  const out = { total: rows.length, succeeded: 0, failed: 0, inProgress: 0 };
  for (const r of rows) {
    if (r.status === "SUCCEEDED") out.succeeded++;
    else if (r.status === "FAILED") out.failed++;
    else out.inProgress++;
  }
  return out;
}
