"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { loginAction } from "@/app/actions/auth";
import { Button, Field, Input } from "@/components/ui/primitives";

export function LoginForm({ callbackUrl, notice }: { callbackUrl?: string; notice?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (values: LoginInput) =>
    start(async () => {
      setError(null);
      const res = await loginAction(values, callbackUrl);
      if (res?.error) setError(res.error);
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {notice && <p role="status" className="rounded-lg bg-brand-soft px-3 py-2 text-sm">{notice}</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>}
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register("password")} />
      </Field>
      <div className="text-right"><Link href="/forgot-password" className="text-sm text-brand hover:underline">Forgot password?</Link></div>
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Signing in..." : "Sign in"}</Button>
      <p className="text-center text-sm text-muted">
        New to Nexus AI? <Link href="/register" className="font-medium text-brand hover:underline">Create an account</Link>
      </p>
    </form>
  );
}
