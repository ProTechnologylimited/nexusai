"use client";

import { useState, useTransition } from "react";
import { BUSINESS_TYPES, PRIMARY_GOALS } from "@/config/onboarding";
import { completeOnboarding, saveOnboardingStep } from "@/app/actions/onboarding";
import { Button, Field, Input } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type Initial = { step: number; fullName: string; businessName: string; businessType: string; primaryGoal: string };
const LAST = 4;

function Choice({ options, value, onChange, label }: { options: readonly string[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => (
        <button
          key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)}
          className={cn(
            "min-h-11 rounded-lg border px-4 text-left text-sm transition-colors",
            value === o ? "border-brand bg-brand-soft font-medium text-ink" : "border-line bg-white text-muted hover:border-slate-300",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function OnboardingFlow({ initial }: { initial: Initial }) {
  const [step, setStep] = useState(Math.min(initial.step, LAST));
  const [fullName, setFullName] = useState(initial.fullName);
  const [businessName, setBusinessName] = useState(initial.businessName);
  const [businessType, setBusinessType] = useState(initial.businessType);
  const [primaryGoal, setPrimaryGoal] = useState(initial.primaryGoal);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const payload = (nextStep: number) => ({
    step: nextStep,
    ...(fullName.trim().length >= 2 && { fullName: fullName.trim() }),
    ...(businessName.trim() && { businessName: businessName.trim() }),
    ...((BUSINESS_TYPES as readonly string[]).includes(businessType) && { businessType }),
    ...((PRIMARY_GOALS as readonly string[]).includes(primaryGoal) && { primaryGoal }),
  });

  const next = (save: boolean) =>
    start(async () => {
      setError(null);
      if (save) {
        const res = await saveOnboardingStep(payload(step + 1));
        if (res?.error) return setError(res.error);
      }
      setStep((s) => s + 1);
    });

  const finish = () =>
    start(async () => {
      setError(null);
      const res = await completeOnboarding(payload(LAST));
      if (res?.error) setError(res.error);
    });

  const titles = ["Welcome to Nexus AI", "About you", "What kind of business do you run?", "What do you want to automate first?", "You're all set"];

  return (
    <div className="mx-auto w-full max-w-lg">
      <p className="text-sm text-muted" aria-live="polite">Step {step + 1} of {LAST + 1}</p>
      <div className="mt-2 h-1 rounded-full bg-line" aria-hidden="true">
        <div className="h-1 rounded-full bg-brand transition-all" style={{ width: `${((step + 1) / (LAST + 1)) * 100}%` }} />
      </div>
      <h1 className="mt-8 text-2xl font-semibold tracking-tight">{titles[step]}</h1>

      <div className="mt-6 space-y-5">
        {step === 0 && <p className="text-muted">A few quick questions will set up your workspace. You can skip any of them and change them later.</p>}
        {step === 1 && (
          <>
            <Field label="Your name" htmlFor="ob-name"><Input id="ob-name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" /></Field>
            <Field label="Business name" htmlFor="ob-biz"><Input id="ob-biz" value={businessName} onChange={(e) => setBusinessName(e.target.value)} autoComplete="organization" /></Field>
          </>
        )}
        {step === 2 && <Choice label="Business type" options={BUSINESS_TYPES} value={businessType} onChange={setBusinessType} />}
        {step === 3 && <Choice label="First automation goal" options={PRIMARY_GOALS} value={primaryGoal} onChange={setPrimaryGoal} />}
        {step === 4 && <p className="text-muted">Your workspace is ready. Open the dashboard to start.</p>}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 0 && step < LAST ? (
          <Button variant="ghost" disabled={pending} onClick={() => next(false)}>Skip</Button>
        ) : <span />}
        {step < LAST ? (
          <Button disabled={pending} onClick={() => next(step > 0)}>{step === 0 ? "Get started" : "Continue"}</Button>
        ) : (
          <Button disabled={pending} onClick={finish}>{pending ? "Saving..." : "Go to dashboard"}</Button>
        )}
      </div>
    </div>
  );
}
