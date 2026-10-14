/** Returns a same-origin relative path, or the fallback. Prevents open redirects. */
export function safeRedirect(target: string | null | undefined, fallback = "/dashboard"): string {
  if (!target) return fallback;
  if (!target.startsWith("/")) return fallback;
  if (target.startsWith("//") || target.startsWith("/\\")) return fallback;
  if (/[\r\n]/.test(target)) return fallback;
  return target;
}
