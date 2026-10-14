import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#6366F1" />
      <g stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
        <path d="M9 22 16 9l7 13M9 22h14" fill="none" />
      </g>
      <g fill="#fff">
        <circle cx="16" cy="9" r="2.6" />
        <circle cx="9" cy="22" r="2.6" />
        <circle cx="23" cy="22" r="2.6" />
      </g>
    </svg>
  );
}

export function Logo({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className={cn("text-lg font-semibold tracking-tight", dark ? "text-white" : "text-ink")}>Nexus AI</span>
    </span>
  );
}
