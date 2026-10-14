"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";
import { registerAction } from "@/app/actions/auth";
import { Button, Field, Input } from "@/components/ui/primitives";

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { register, handleSubmit, setError: setFieldError, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (values: RegisterInput) =>
    start(async () => {
      setError(null);
      const res = await registerAction(values);
      if (res?.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          setFieldError(name as keyof RegisterInput, { message });
        }
      }
      if (res?.error) setError(res.error);
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>}
      <Field label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
        <Input id="fullName" autoComplete="name" aria-invalid={!!errors.fullName} {...register("fullName")} />
      </Field>
      <Field label="Business name (optional)" htmlFor="businessName" error={errors.businessName?.message}>
        <Input id="businessName" autoComplete="organization" {...register("businessName")} />
      </Field>
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message} hint="At least 10 characters with upper case, lower case, and a number.">
        <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
      </Field>
      <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <Input id="confirmPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
      </Field>
      <div>
        <label className="flex items-start gap-2.5 text-sm text-muted">
          <input type="checkbox" className="mt-0.5 size-4 accent-indigo-500" {...register("acceptTerms")} />
          <span>I accept the <Link href="/terms" target="_blank" className="text-brand hover:underline">Terms of Service</Link> and <Link href="/privacy" target="_blank" className="text-brand hover:underline">Privacy Policy</Link> (drafts, pending legal review).</span>
        </label>
        {errors.acceptTerms && <p role="alert" className="mt-1 text-xs text-danger">{errors.acceptTerms.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Creating account..." : "Create account"}</Button>
      <p className="text-center text-sm text-muted">
        Already have an account? <Link href="/login" className="font-medium text-brand hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
