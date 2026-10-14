import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { PLAN_LIMITS } from "@/config/limits";
import { getProvider } from "@/services/ai/registry";
import { AiProviderError } from "@/services/ai/provider";

export class ServiceError extends Error {}

export function startOfMonthUtc(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function checkLimits(opts: { agentCount?: number; maxAgents: number; runsThisMonth?: number; monthlyRuns: number }) {
  if (opts.agentCount !== undefined && opts.agentCount >= opts.maxAgents)
    return `Your plan allows ${opts.maxAgents} agent${opts.maxAgents === 1 ? "" : "s"}. Upgrade to add more.`;
  if (opts.runsThisMonth !== undefined && opts.runsThisMonth >= opts.monthlyRuns)
    return `You've used all ${opts.monthlyRuns} agent runs for this month.`;
  return null;
}

async function planFor(workspaceId: string) {
  const sub = await db.subscription.findUnique({ where: { workspaceId } });
  return PLAN_LIMITS[sub?.plan ?? "FREE"];
}

export async function listAgents(workspaceId: string) {
  return db.agent.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { executions: true } }, executions: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } } },
  });
}

export async function getAgent(workspaceId: string, id: string) {
  return db.agent.findFirst({
    where: { id, workspaceId }, // tenant isolation: id alone is never enough
    include: { executions: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
}

export async function createAgent(
  workspaceId: string, actorId: string,
  data: { name: string; description?: string; objective?: string; instructions: string; responseStyle: string; provider: string; model: string },
) {
  const limits = await planFor(workspaceId);
  const count = await db.agent.count({ where: { workspaceId } });
  const msg = checkLimits({ agentCount: count, maxAgents: limits.maxAgents, monthlyRuns: limits.monthlyRuns });
  if (msg) throw new ServiceError(msg);

  return db.$transaction(async (tx) => {
    const agent = await tx.agent.create({
      data: { ...data, description: data.description || null, objective: data.objective || null, workspaceId },
    });
    await tx.activityLog.create({
      data: { workspaceId, actorId, action: "agent.created", summary: `Created AI agent "${agent.name}"` },
    });
    return agent;
  });
}

export async function setAgentStatus(workspaceId: string, id: string, status: "ACTIVE" | "PAUSED") {
  const res = await db.agent.updateMany({ where: { id, workspaceId }, data: { status } });
  if (res.count === 0) throw new ServiceError("Agent not found.");
}

export function buildSystemPrompt(a: { instructions: string; objective: string | null; responseStyle: string }) {
  return [
    a.instructions,
    a.objective ? `Business objective: ${a.objective}` : "",
    `Response style: ${a.responseStyle}.`,
    "You can only produce text. Do not claim to have sent messages, run code, or taken actions outside this reply.",
  ].filter(Boolean).join("\n\n");
}

export async function runAgent(workspaceId: string, actorId: string, role: Role, agentId: string, input: string) {
  const agent = await db.agent.findFirst({ where: { id: agentId, workspaceId } });
  if (!agent) throw new ServiceError("Agent not found.");
  if (agent.status !== "ACTIVE") throw new ServiceError("This agent is paused. Resume it to run requests.");

  const provider = getProvider(agent.provider);
  if (!provider || !provider.isConfigured()) throw new ServiceError("This agent's AI provider is not configured on the server.");

  const limits = await planFor(workspaceId);
  const runs = await db.agentExecution.count({
    where: { workspaceId, createdAt: { gte: startOfMonthUtc() }, status: { not: "FAILED" } },
  });
  const msg = checkLimits({ maxAgents: limits.maxAgents, runsThisMonth: runs, monthlyRuns: limits.monthlyRuns });
  if (msg) throw new ServiceError(msg);

  const exec = await db.agentExecution.create({ data: { workspaceId, agentId, input, status: "RUNNING" } });
  const started = Date.now();
  try {
    const out = await provider.generate({ model: agent.model, system: buildSystemPrompt(agent), prompt: input });
    await db.$transaction([
      db.agentExecution.update({
        where: { id: exec.id },
        data: { status: "SUCCEEDED", output: out.text, inputTokens: out.inputTokens, outputTokens: out.outputTokens, durationMs: Date.now() - started },
      }),
      db.usageRecord.create({ data: { workspaceId, feature: "agent_run" } }),
    ]);
    return { id: exec.id };
  } catch (err) {
    const message = err instanceof AiProviderError ? err.message : "The run failed unexpectedly.";
    await db.agentExecution.update({ where: { id: exec.id }, data: { status: "FAILED", error: message, durationMs: Date.now() - started } });
    throw new ServiceError(message);
  }
}
