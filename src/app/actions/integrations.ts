"use server";

import { revalidatePath } from "next/cache";
import { assertRole, requireWorkspaceContext } from "@/lib/workspace";
import { IntegrationError, runCheck } from "@/services/integrations/integrations";

export async function checkIntegrationAction(key: string): Promise<{ ok?: boolean; message?: string; error?: string }> {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx.role, ["OWNER", "ADMIN"]);
  try {
    const r = await runCheck(ctx.workspace.id, ctx.user.id, String(key));
    revalidatePath("/integrations");
    return r;
  } catch (e) {
    if (e instanceof IntegrationError) return { error: e.message };
    throw e;
  }
}
