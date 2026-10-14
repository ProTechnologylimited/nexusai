import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { requireWorkspaceContext } from "@/lib/workspace";

export const metadata: Metadata = { title: "Set up your workspace" };

export default async function OnboardingPage() {
  const { user, workspace } = await requireWorkspaceContext();
  if (workspace.onboardingCompletedAt) redirect("/dashboard");

  return (
    <main className="min-h-dvh px-6 py-8">
      <Logo />
      <div className="mt-14">
        <OnboardingFlow
          initial={{
            step: workspace.onboardingStep,
            fullName: user.name,
            businessName: workspace.name,
            businessType: workspace.businessType ?? "",
            primaryGoal: workspace.primaryGoal ?? "",
          }}
        />
      </div>
    </main>
  );
}
