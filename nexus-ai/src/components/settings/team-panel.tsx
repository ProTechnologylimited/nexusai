"use client";

import { useState, useTransition } from "react";
import { changeRoleAction, createInviteAction, removeMemberAction, revokeInviteAction } from "@/app/actions/team";
import { canChangeRole, canInvite, canRemove, type Role } from "@/services/team/rules";
import { Button } from "@/components/ui/primitives";

type Member = { id: string; userId: string; name: string; email: string; role: Role };
type Invite = { id: string; role: string; label: string | null; expiresAt: string };
const sel = "min-h-9 rounded-lg border border-line bg-white px-2 text-sm";

export function TeamPanel({ members, invites, actorRole, selfUserId }: { members: Member[]; invites: Invite[]; actorRole: Role; selfUserId: string }) {
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [label, setLabel] = useState("");
  const [days, setDays] = useState(7);
  const [link, setLink] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ error?: string }>) => start(async () => { setMsg(null); const r = await fn(); if (r.error) setMsg(r.error); });
  const canManage = actorRole !== "MEMBER";

  return (
    <div className="space-y-6">
      {msg && <p role="alert" className="text-sm text-danger">{msg}</p>}
      <ul className="divide-y divide-line text-sm">
        {members.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div><p className="font-medium">{m.name}{m.userId === selfUserId && " (you)"}</p><p className="text-xs text-muted">{m.email}</p></div>
            <div className="flex items-center gap-2">
              {canChangeRole(actorRole, m.role, "MEMBER") ? (
                <select aria-label={`Role for ${m.name}`} className={sel} value={m.role} disabled={pending} onChange={(e) => run(() => changeRoleAction(m.id, e.target.value))}>
                  <option value="ADMIN">Admin</option><option value="MEMBER">Member</option>
                </select>
              ) : <span className="text-muted">{m.role[0] + m.role.slice(1).toLowerCase()}</span>}
              {canRemove(actorRole, m.role) && m.userId !== selfUserId && (
                <Button variant="ghost" disabled={pending} onClick={() => { if (window.confirm(`Remove ${m.name} from this workspace?`)) run(() => removeMemberAction(m.id)); }}>Remove</Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {canManage && (
        <div className="space-y-4 border-t border-line pt-6">
          <h3 className="text-sm font-semibold">Invite someone</h3>
          <p className="text-xs text-muted">Invites are single-use links that you share yourself. Nexus AI does not email them. The person must sign in (or create an account, then open the link again) to join.</p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">Role<select className={`${sel} ml-2`} value={role} onChange={(e) => setRole(e.target.value as "ADMIN" | "MEMBER")}>
              <option value="MEMBER">Member</option>{canInvite(actorRole, "ADMIN") && <option value="ADMIN">Admin</option>}</select></label>
            <label className="text-sm">Note<input className={`${sel} ml-2 w-40`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Who is it for?" /></label>
            <label className="text-sm">Expires in<select className={`${sel} ml-2`} value={days} onChange={(e) => setDays(Number(e.target.value))}>{[1, 7, 14].map((d) => <option key={d} value={d}>{d} day{d > 1 ? "s" : ""}</option>)}</select></label>
            <Button disabled={pending} onClick={() => start(async () => {
              setMsg(null); setLink(null);
              const r = await createInviteAction({ role, label, days });
              if (r.error) setMsg(r.error); else if (r.link) setLink(r.link);
            })}>Create invite link</Button>
          </div>
          {link && (
            <div role="status" className="space-y-2 rounded-lg bg-brand-soft p-3 text-sm">
              <p>Copy this link now. It will not be shown again.</p>
              <code className="block break-all text-xs">{link}</code>
              <Button variant="secondary" onClick={() => navigator.clipboard.writeText(link)}>Copy link</Button>
            </div>
          )}
          {invites.length > 0 && (
            <ul className="divide-y divide-line text-sm">
              {invites.map((i) => (
                <li key={i.id} className="flex items-center justify-between py-2">
                  <span>{i.role.toLowerCase()} invite{i.label ? ` for ${i.label}` : ""} <span className="text-xs text-muted">expires {new Date(i.expiresAt).toLocaleDateString("en-US")}</span></span>
                  <Button variant="ghost" disabled={pending} onClick={() => run(() => revokeInviteAction(i.id))}>Revoke</Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
