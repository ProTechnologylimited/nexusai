import type { Metadata } from "next";
import Link from "next/link";
import { PasswordForm, ProfileForm, WorkspaceForm } from "@/components/settings/simple-forms";
import { TeamPanel } from "@/components/settings/team-panel";
import { Card } from "@/components/ui/primitives";
import { requireWorkspaceContext } from "@/lib/workspace";
import { listInvites, listMembers } from "@/services/team/team";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user, workspace, role } = await requireWorkspaceContext();
  const [members, invites] = await Promise.all([listMembers(workspace.id), role === "MEMBER" ? [] : listInvites(workspace.id)]);

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card className="p-6"><h2 className="mb-4 font-semibold">{title}</h2>{children}</Card>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">Your profile, workspace, security, and team.</p>
      </div>
      <Section title="Profile"><ProfileForm name={user.name} email={user.email} /></Section>
      <Section title="Business details"><WorkspaceForm canEdit={role !== "MEMBER"} defaults={{ name: workspace.name, businessType: workspace.businessType ?? "", primaryGoal: workspace.primaryGoal ?? "" }} /></Section>
      <Section title="Password and security"><PasswordForm /></Section>
      <Section title="Team members">
        <TeamPanel
          actorRole={role} selfUserId={user.id}
          members={members.map((m) => ({ id: m.id, userId: m.userId, name: m.user.name, email: m.user.email, role: m.role }))}
          invites={invites.map((i) => ({ id: i.id, role: i.role, label: i.label, expiresAt: i.expiresAt.toISOString() }))}
        />
      </Section>
      <Section title="Notifications">
        <p className="text-sm text-muted">Nexus AI doesn&apos;t send email or push notifications yet, so there are no notification preferences to set. In-app activity is on the Overview page.</p>
      </Section>
      <Section title="Subscription and integrations">
        <p className="text-sm text-muted">Manage your plan on <Link href="/billing" className="text-brand hover:underline">Billing</Link> and provider connections on <Link href="/integrations" className="text-brand hover:underline">Integrations</Link>.</p>
      </Section>
    </div>
  );
}
