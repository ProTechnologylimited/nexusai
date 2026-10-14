"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { campaignSchema, CAMPAIGN_STATUSES, CHANNELS, type CampaignInput } from "@/lib/validation/campaigns";
import { createCampaignAction, generateDraftAction, updateCampaignAction } from "@/app/actions/campaigns";
import { Button, Field, Input } from "@/components/ui/primitives";

const sel = "block min-h-10 w-full rounded-lg border border-line bg-white px-3 text-sm";
const area = "block w-full rounded-lg border border-line bg-white px-3 py-2 text-sm";

export function CampaignForm({ campaignId, defaults }: { campaignId?: string; defaults?: Partial<CampaignInput> }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const { register, handleSubmit, setValue, setError, formState: { errors } } = useForm<CampaignInput>({
    resolver: zodResolver(campaignSchema),
    defaultValues: { status: "DRAFT", channel: "", ...defaults },
  });

  const onSubmit = (v: CampaignInput) =>
    start(async () => {
      setMsg(null);
      const res = campaignId ? await updateCampaignAction(campaignId, v) : await createCampaignAction(v);
      if (res?.fieldErrors) for (const [k, m] of Object.entries(res.fieldErrors)) setError(k as keyof CampaignInput, { message: m });
      if (res?.error) setMsg({ ok: false, text: res.error });
      if (res?.saved) setMsg({ ok: true, text: "Saved." });
    });

  const generate = () =>
    start(async () => {
      setMsg(null);
      const res = await generateDraftAction(campaignId!);
      if (res.error) return setMsg({ ok: false, text: res.error });
      setValue("content", res.text, { shouldDirty: true });
      setMsg({ ok: true, text: "AI draft added below. Review and edit it, then save." });
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {msg && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "text-sm text-ok" : "rounded-lg bg-red-50 px-3 py-2 text-sm text-danger"}>{msg.text}</p>}
      <Field label="Campaign name" htmlFor="name" error={errors.name?.message}><Input id="name" aria-invalid={!!errors.name} {...register("name")} /></Field>
      <Field label="Objective" htmlFor="objective"><Input id="objective" {...register("objective")} /></Field>
      <Field label="Target audience" htmlFor="targetAudience"><Input id="targetAudience" {...register("targetAudience")} /></Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Product or service" htmlFor="offering"><Input id="offering" {...register("offering")} /></Field>
        <Field label="Channel" htmlFor="channel">
          <select id="channel" className={sel} {...register("channel")}>
            <option value="">Not set</option>
            {CHANNELS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Key message" htmlFor="keyMessage"><Input id="keyMessage" {...register("keyMessage")} /></Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Start date" htmlFor="startDate" error={errors.startDate?.message}><Input id="startDate" type="date" {...register("startDate")} /></Field>
        <Field label="End date" htmlFor="endDate" error={errors.endDate?.message}><Input id="endDate" type="date" {...register("endDate")} /></Field>
        <Field label="Budget (USD, optional)" htmlFor="budget" error={errors.budget?.message}><Input id="budget" inputMode="decimal" {...register("budget")} /></Field>
      </div>
      <Field label="Status" htmlFor="status" hint="Status is tracked by you. Nexus AI does not publish campaigns or collect results yet.">
        <select id="status" className={sel} {...register("status")}>
          {CAMPAIGN_STATUSES.map((s) => <option key={s} value={s}>{s[0] + s.slice(1).toLowerCase()}</option>)}
        </select>
      </Field>

      {campaignId ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="content" className="text-sm font-medium">Campaign content</label>
            <Button variant="secondary" onClick={generate} disabled={pending}>{pending ? "Working..." : "Generate AI draft"}</Button>
          </div>
          <textarea id="content" rows={14} className={area} placeholder="Write your own content, or generate a draft and edit it." {...register("content")} />
          <p className="text-xs text-muted">Save your campaign details before generating, because the draft uses the saved values.</p>
        </div>
      ) : (
        <p className="text-sm text-muted">After you create the campaign you can generate and edit AI-drafted content.</p>
      )}
      <Button type="submit" disabled={pending}>{pending ? "Saving..." : campaignId ? "Save changes" : "Create campaign"}</Button>
    </form>
  );
}
