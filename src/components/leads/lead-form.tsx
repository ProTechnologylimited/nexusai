"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadSchema, LEAD_STATUSES, type LeadInput } from "@/lib/validation/leads";
import { createLeadAction, updateLeadAction } from "@/app/actions/leads";
import { Button, Field, Input } from "@/components/ui/primitives";

const sel = "block min-h-10 w-full rounded-lg border border-line bg-white px-3 text-sm";

export function LeadForm({ leadId, defaults }: { leadId?: string; defaults?: Partial<LeadInput> }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { register, handleSubmit, setError: setFieldError, formState: { errors } } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: { status: "NEW", ...defaults },
  });

  const onSubmit = (v: LeadInput) =>
    start(async () => {
      setError(null);
      const res = leadId ? await updateLeadAction(leadId, v) : await createLeadAction(v);
      if (res?.fieldErrors) for (const [k, m] of Object.entries(res.fieldErrors)) setFieldError(k as keyof LeadInput, { message: m });
      if (res?.error) setError(res.error);
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Contact name" htmlFor="name" error={errors.name?.message}><Input id="name" aria-invalid={!!errors.name} {...register("name")} /></Field>
        <Field label="Company" htmlFor="company"><Input id="company" {...register("company")} /></Field>
        <Field label="Business email" htmlFor="email" error={errors.email?.message}><Input id="email" type="email" aria-invalid={!!errors.email} {...register("email")} /></Field>
        <Field label="Website" htmlFor="website" error={errors.website?.message}><Input id="website" placeholder="https://" aria-invalid={!!errors.website} {...register("website")} /></Field>
        <Field label="Industry" htmlFor="industry"><Input id="industry" {...register("industry")} /></Field>
        <Field label="Job title" htmlFor="jobTitle"><Input id="jobTitle" {...register("jobTitle")} /></Field>
        <Field label="Source" htmlFor="source"><Input id="source" {...register("source")} /></Field>
        <Field label="Status" htmlFor="status">
          <select id="status" className={sel} {...register("status")}>
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s[0] + s.slice(1).toLowerCase()}</option>)}
          </select>
        </Field>
        <Field label="Follow-up date" htmlFor="followUpDate"><Input id="followUpDate" type="date" {...register("followUpDate")} /></Field>
      </div>
      <Field label="Notes" htmlFor="notes">
        <textarea id="notes" rows={4} className="block w-full rounded-lg border border-line bg-white px-3 py-2 text-sm" {...register("notes")} />
      </Field>
      <Button type="submit" disabled={pending}>{pending ? "Saving..." : leadId ? "Save changes" : "Add lead"}</Button>
    </form>
  );
}
