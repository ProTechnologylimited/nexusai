import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type HTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

export function buttonClasses(variant: Variant = "primary", className?: string) {
  return cn(
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
    variant === "primary" && "bg-brand text-white hover:bg-indigo-600",
    variant === "secondary" && "border border-line bg-white text-ink hover:bg-slate-50",
    variant === "ghost" && "text-muted hover:bg-slate-100 hover:text-ink",
    className,
  );
}

export function Button({
  variant = "primary", className, type = "button", ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props }, ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "block min-h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-slate-400 aria-[invalid=true]:border-danger",
        className,
      )}
      {...props}
    />
  );
});

export function Field({
  label, htmlFor, error, hint, children,
}: { label: string; htmlFor: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p id={`${htmlFor}-error`} role="alert" className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-line bg-white", className)} {...props} />;
}
