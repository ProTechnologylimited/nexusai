"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { assertRole, requireWorkspaceContext } from "@/lib/workspace";
import { onboardingSchema } from "@/lib/validation/onboarding";

async function persist(input: unknown, complete: boolean) {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx.role, ["OWNER", "ADMIN"]);

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return { error: "Some answers are not valid. Check them and try again." };
  const { step, fullName, businessName, businessType, primaryGoal } = parsed.data;

  await db.$transaction(async (tx) => {
    await tx.workspace.update({
      where: { id: ctx.workspace.id },
      data: {
        onboardingStep: step,
        ...(businessName && { name: businessName }),
        ...(businessType && { businessType }),
        ...(primaryGoal && { primaryGoal }),
        ...(complete && { onboardingCompletedAt: new Date() }),
      },
    });
    if (fullName) await tx.user.update({ where: { id: ctx.user.id }, data: { name: fullName } });
    if (complete) {
      await tx.activityLog.create({
        data: { workspaceId: ctx.workspace.id, actorId: ctx.user.id, action: "onboarding.completed", summary: "Onboarding completed" },
      });
    }
  });
  return {};
}

export async function saveOnboardingStep(input: unknown) {
  return persist(input, false);
}

export async function completeOnboarding(input: unknown) {
  const res = await persist(input, true);
  if (res.error) return res;
  redirect("/dashboard");
}
