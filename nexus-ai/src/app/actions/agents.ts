"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { agentSchema, runSchema } from "@/lib/validation/agents";
import { assertRole, requireWorkspaceContext } from "@/lib/workspace";
import { isValidModel, getProvider } from "@/services/ai/registry";
import { createAgent, runAgent, ServiceError, setAgentStatus } from "@/services/agents/agents";

export type AgentActionResult = { error?: string; fieldErrors?: Record<string, string> };

export async function createAgentAction(values: unknown): Promise<AgentActionResult> {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx.role, ["OWNER", "ADMIN"]);

  const parsed = agentSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { fieldErrors };
  }
  const d = parsed.data;
  const provider = getProvider(d.provider);
  if (!provider?.isConfigured() || !isValidModel(d.provider, d.model)) {
    return { error: "Choose a configured provider and a supported model." };
  }

  let id: string;
  try {
    id = (await createAgent(ctx.workspace.id, ctx.user.id, d)).id;
  } catch (e) {
    if (e instanceof ServiceError) return { error: e.message };
    throw e;
  }
  revalidatePath("/agents");
  redirect(`/agents/${id}`);
}

export async function setAgentStatusAction(agentId: string, status: "ACTIVE" | "PAUSED"): Promise<AgentActionResult> {
  const ctx = await requireWorkspaceContext();
  assertRole(ctx.role, ["OWNER", "ADMIN"]);
  try {
    await setAgentStatus(ctx.workspace.id, agentId, status);
  } catch (e) {
    if (e instanceof ServiceError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/agents/${agentId}`);
  revalidatePath("/agents");
  return {};
}

export async function runAgentAction(values: unknown): Promise<AgentActionResult> {
  const ctx = await requireWorkspaceContext();
  const parsed = runSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request." };
  try {
    await runAgent(ctx.workspace.id, ctx.user.id, ctx.role, parsed.data.agentId, parsed.data.input);
  } catch (e) {
    if (e instanceof ServiceError) return { error: e.message };
    throw e;
  } finally {
    revalidatePath(`/agents/${parsed.data.agentId}`);
  }
  return {};
}
