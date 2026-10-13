"use client";

import { useState, useTransition } from "react";
import { changePasswordAction, updateProfileAction, updateWorkspaceAction, type SettingsResult } from "@/app/actions/settings";
import { BUSINESS_TYPES, PRIMARY_GOALS } from "@/config/onboarding";
import { Button, Field, Input } from "@/components/ui/primitives";

const sel = "block min-h-10 w-full rounded-lg border border-line bg-white px-3 text-sm";

function useAction(action: (v: unknown) => Promise<SettingsResult>, onOk?: () => void) {
  const [res, setRes] = useState<SettingsResult>({});
  const [pending, start] = useTransition();
  const run = (values: unknown) => start(async () => { const r = await action(values); setRes(r); if (r.ok) onOk?.(); });
  return { res, pending, run };
}

const Status = ({ res }: { res: SettingsResult }) =>
  res.ok ? <p role="status" className="text-sm text-ok">Saved.</p> : res.error ? <p role="alert" className="text-sm text-danger">{res.error}</p> : null;

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [v, setV] = useState(name);
  const { res, pending, run } = useAction(updateProfileAction);
  return (
    <form onSubmit={(e) => { e.preventDefault(); run({ name: v }); }} className="space-y-4" noValidate>
      <Field label="Full name" htmlFor="p-name" error={res.fieldErrors?.name}><Input id="p-name" value={v} onChange={(e) => setV(e.target.value)} autoComplete="name" /></Field>
      <Field label="Email" htmlFor="p-email" hint="Changing your email isn't supported yet because it needs verification."><Input id="p-email" value={email} readOnly disabled /></Field>
      <Status res={res} />
      <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save profile"}</Button>
    </form>
  );
}

export function WorkspaceForm({ defaults, canEdit }: { defaults: { name: string; businessType: string; primaryGoal: string }; canEdit: boolean }) {
  const [v, setV] = useState(defaults);
  const { res, pending, run } = useAction(updateWorkspaceAction);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((o) => ({ ...o, [k]: e.target.value }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); run(v); }} className="space-y-4" noValidate>
      <Field label="Business name" htmlFor="w-name" error={res.fieldErrors?.name}><Input id="w-name" value={v.name} onChange={set("name")} disabled={!canEdit} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business type" htmlFor="w-type"><select id="w-type" className={sel} value={v.businessType} onChange={set("businessType")} disabled={!canEdit}><option value="">Not set</option>{BUSINESS_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="First thing to automate" htmlFor="w-goal"><select id="w-goal" className={sel} value={v.primaryGoal} onChange={set("primaryGoal")} disabled={!canEdit}><option value="">Not set</option>{PRIMARY_GOALS.map((t) => <option key={t}>{t}</option>)}</select></Field>
      </div>
      <Status res={res} />
      {canEdit ? <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save workspace"}</Button> : <p className="text-xs text-muted">Only owners and admins can edit workspace details.</p>}
    </form>
  );
}

export function PasswordForm() {
  const empty = { currentPassword: "", newPassword: "", confirmPassword: "" };
  const [v, setV] = useState(empty);
  const { res, pending, run } = useAction(changePasswordAction, () => setV(empty));
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((o) => ({ ...o, [k]: e.target.value }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); run(v); }} className="space-y-4" noValidate>
      <Field label="Current password" htmlFor="pw-cur" error={res.fieldErrors?.currentPassword}><Input id="pw-cur" type="password" autoComplete="current-password" value={v.currentPassword} onChange={set("currentPassword")} /></Field>
      <Field label="New password" htmlFor="pw-new" error={res.fieldErrors?.newPassword} hint="At least 10 characters with upper case, lower case, and a number."><Input id="pw-new" type="password" autoComplete="new-password" value={v.newPassword} onChange={set("newPassword")} /></Field>
      <Field label="Confirm new password" htmlFor="pw-conf" error={res.fieldErrors?.confirmPassword}><Input id="pw-conf" type="password" autoComplete="new-password" value={v.confirmPassword} onChange={set("confirmPassword")} /></Field>
      {res.ok && <p role="status" className="text-sm text-ok">Password changed.</p>}
      {res.error && <p role="alert" className="text-sm text-danger">{res.error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Updating..." : "Change password"}</Button>
    </form>
  );
}
