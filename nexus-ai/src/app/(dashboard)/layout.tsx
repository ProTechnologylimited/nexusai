import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { requireWorkspaceContext } from "@/lib/workspace";
import { listUserWorkspaces } from "@/services/team/team";
import { VerifyBanner } from "@/components/account/verify-banner";
import { getTransactionalConfig } from "@/services/email/provider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace } = await requireWorkspaceContext();
  if (!workspace.onboardingCompletedAt) redirect("/onboarding");
  const workspaces = await listUserWorkspaces(user.id);

  return (
    <AppShell user={{ name: user.name, email: user.email }} workspaceName={workspace.name} workspaces={workspaces} activeWorkspaceId={workspace.id}>
      {!user.emailVerifiedAt && <VerifyBanner canSend={getTransactionalConfig().configured} />}
      {children}
    </AppShell>
  );
}
