"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { agentSchema, RESPONSE_STYLES, type AgentInput } from "@/lib/validation/agents";
import { createAgentAction } from "@/app/actions/agents";
import { Button, Field, Input } from "@/components/ui/primitives";

type ProviderOpt = { id: string; label: string; models: { id: string; label: string }[] };
const area = "block w-full rounded-lg border border-line bg-white px-3 py-2 text-sm aria-[invalid=true]:border-danger";

export function NewAgentForm({ providers }: { providers: ProviderOpt[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { register, handleSubmit, watch, setError: setFieldError, formState: { errors } } = useForm<AgentInput>({
    resolver: zodResolver(agentSchema),
    defaultValues: { responseStyle: "concise", provider: providers[0]?.id, model: providers[0]?.models[0]?.id },
  });
  const models = providers.find((p) => p.id === watch("provider"))?.models ?? [];

  const onSubmit = (v: AgentInput) =>
    start(async () => {
      setError(null);
      const res = await createAgentAction(v);
      if (res?.fieldErrors) for (const [k, m] of Object.entries(res.fieldErrors)) setFieldError(k as keyof AgentInput, { message: m });
      if (res?.error) setError(res.error);
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>}
      <Field label="Agent name" htmlFor="name" error={errors.name?.message}>
        <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
      </Field>
      <Field label="Description (optional)" htmlFor="description" error={errors.description?.message}>
        <Input id="description" {...register("description")} />
      </Field>
      <Field label="Business objective (optional)" htmlFor="objective" hint="What outcome should this agent support?">
        <Input id="objective" {...register("objective")} />
      </Field>
      <Field label="Instructions" htmlFor="instructions" error={errors.instructions?.message} hint="Tell the agent its role, what to do, and what to avoid.">
        <textarea id="instructions" rows={6} className={area} aria-invalid={!!errors.instructions} {...register("instructions")} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Response style" htmlFor="responseStyle">
          <select id="responseStyle" className={area} {...register("responseStyle")}>
            {RESPONSE_STYLES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
        </Field>
        <Field label="Provider" htmlFor="provider">
          <select id="provider" className={area} {...register("provider")}>
            {providers.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </Field>
        <Field label="Model" htmlFor="model">
          <select id="model" className={area} {...register("model")}>
            {models.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </Field>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Creating..." : "Create agent"}</Button>
    </form>
  );
}
