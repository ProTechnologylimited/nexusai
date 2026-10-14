import { Prisma, type Role } from "@prisma/client";
import { db } from "@/lib/db";
import { PLAN_LIMITS } from "@/config/limits";
import { definitionSchema, type WorkflowDefinition } from "@/lib/validation/workflows";
import { getConfiguredProviders } from "@/services/ai/registry";
import { startOfMonthUtc } from "@/services/agents/agents";
import {
  evaluateConditions, idempotencyKeyForLeadCreated, nextStepIndex, renderTemplate, type Action, type StepLog,
} from "./rules";

export class WorkflowError extends Error {}
const STALE_MS = 10 * 60_000;
export const MAX_ATTEMPTS = 5;

type Payload = { leadId?: string; mode: "test" | "event" };
const json = (v: unknown) => v as Prisma.InputJsonValue;

export const listWorkflows = (workspaceId: string) =>
  db.workflow.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" }, include: { _count: { select: { executions: true } } } });

export const getWorkflow = (workspaceId: string, id: string) =>
  db.workflow.findFirst({
    where: { id, workspaceId },
    include: { executions: { orderBy: { createdAt: "desc" }, take: 20 } },
  });

export async function saveWorkflow(
  workspaceId: string, actorId: string, id: string | null,
  d: { name: string; description?: string; trigger: string; definition: WorkflowDefinition },
) {
  const data = { name: d.name, description: d.description || null, trigger: d.trigger, definition: json(d.definition) };
  if (!id) {
    return db.$transaction(async (tx) => {
      const w = await tx.workflow.create({ data: { ...data, workspaceId } });
      await tx.activityLog.create({ data: { workspaceId, actorId, action: "workflow.created", summary: `Created workflow "${w.name}"` } });
      return w;
    });
  }
  const res = await db.workflow.updateMany({ where: { id, workspaceId }, data });
  if (res.count === 0) throw new WorkflowError("Workflow not found.");
  return { id };
}

export async function setWorkflowStatus(workspaceId: string, actorId: string, id: string, status: "ACTIVE" | "PAUSED") {
  const w = await db.workflow.findFirst({ where: { id, workspaceId } });
  if (!w) throw new WorkflowError("Workflow not found.");
  if (!definitionSchema.safeParse(w.definition).success) throw new WorkflowError("Fix the workflow definition before activating it.");
  await db.workflow.updateMany({ where: { id, workspaceId }, data: { status } });
  await db.activityLog.create({ data: { workspaceId, actorId, action: `workflow.${status.toLowerCase()}`, summary: `${status === "ACTIVE" ? "Activated" : "Paused"} workflow "${w.name}"` } });
}

export async function deleteWorkflow(workspaceId: string, actorId: string, id: string) {
  const w = await db.workflow.findFirst({ where: { id, workspaceId }, select: { name: true } });
  if (!w) throw new WorkflowError("Workflow not found.");
  await db.workflow.deleteMany({ where: { id, workspaceId } });
  await db.activityLog.create({ data: { workspaceId, actorId, action: "workflow.deleted", summary: `Deleted workflow "${w.name}"` } });
}

/** Creates a PENDING execution. The unique (workflowId, idempotencyKey) makes repeats a no-op. */
export async function enqueueExecution(workspaceId: string, workflowId: string, key: string, payload: Payload) {
  const sub = await db.subscription.findUnique({ where: { workspaceId } });
  const limit = PLAN_LIMITS[sub?.plan ?? "FREE"].monthlyWorkflowRuns;
  const used = await db.workflowExecution.count({ where: { workspaceId, createdAt: { gte: startOfMonthUtc() } } });
  if (used >= limit) throw new WorkflowError(`You've used all ${limit} workflow runs for this month.`);

  try {
    const e = await db.workflowExecution.create({ data: { workspaceId, workflowId, idempotencyKey: key, payload: json(payload) } });
    return { id: e.id, duplicate: false };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const existing = await db.workflowExecution.findFirst({ where: { workflowId, idempotencyKey: key, workspaceId }, select: { id: true } });
      return { id: existing?.id ?? "", duplicate: true };
    }
    throw err;
  }
}

/** Called after a lead is created. Never throws: lead creation must not fail because of automation. */
export async function enqueueLeadCreated(workspaceId: string, leadId: string) {
  try {
    const workflows = await db.workflow.findMany({ where: { workspaceId, status: "ACTIVE", trigger: "LEAD_CREATED" }, select: { id: true } });
    for (const w of workflows) {
      await enqueueExecution(workspaceId, w.id, idempotencyKeyForLeadCreated(leadId), { leadId, mode: "event" }).catch(() => undefined);
    }
  } catch {
    console.error("enqueueLeadCreated failed");
  }
}

export async function runTest(workspaceId: string, workflowId: string, leadId: string | null, nonce: string) {
  const w = await db.workflow.findFirst({ where: { id: workflowId, workspaceId }, select: { id: true } });
  if (!w) throw new WorkflowError("Workflow not found.");
  if (leadId) {
    const lead = await db.lead.findFirst({ where: { id: leadId, workspaceId }, select: { id: true } });
    if (!lead) throw new WorkflowError("Choose a lead from your workspace.");
  }
  const { id } = await enqueueExecution(workspaceId, workflowId, `test:${nonce}`, { leadId: leadId ?? undefined, mode: "test" });
  await processPending(5, workspaceId);
  return id;
}

export async function retryExecution(workspaceId: string, executionId: string) {
  const res = await db.workflowExecution.updateMany({
    where: { id: executionId, workspaceId, status: "FAILED", attempts: { lt: MAX_ATTEMPTS } },
    data: { status: "PENDING", error: null, finishedAt: null },
  });
  if (res.count === 0) throw new WorkflowError("Only failed runs with attempts remaining can be retried.");
  await processPending(5, workspaceId);
}

/** Worker entry point. Safe to call concurrently: each execution is claimed atomically. */
export async function processPending(limit: number, workspaceId?: string) {
  const scope = workspaceId ? { workspaceId } : {};
  await db.workflowExecution.updateMany({
    where: { ...scope, status: "RUNNING", startedAt: { lt: new Date(Date.now() - STALE_MS) } },
    data: { status: "FAILED", error: "Timed out. Retry to continue from the last finished step.", finishedAt: new Date() },
  });

  const pending = await db.workflowExecution.findMany({ where: { ...scope, status: "PENDING" }, orderBy: { createdAt: "asc" }, take: limit, select: { id: true } });
  let processed = 0;
  for (const { id } of pending) {
    const claim = await db.workflowExecution.updateMany({
      where: { id, status: "PENDING" },
      data: { status: "RUNNING", startedAt: new Date(), attempts: { increment: 1 } },
    });
    if (claim.count !== 1) continue; // another worker took it
    await runExecution(id);
    processed++;
  }
  return processed;
}

async function fail(id: string, error: string, log: StepLog[]) {
  await db.workflowExecution.update({ where: { id }, data: { status: "FAILED", error, log: json(log), finishedAt: new Date() } });
}

async function runExecution(id: string) {
  const exec = await db.workflowExecution.findUnique({ where: { id }, include: { workflow: true } });
  if (!exec) return;
  const { workspaceId } = exec;
  const log: StepLog[] = Array.isArray(exec.log) ? (exec.log as StepLog[]).filter((s) => s.status === "done") : [];
  const payload = (exec.payload ?? { mode: "test" }) as Payload;

  const def = definitionSchema.safeParse(exec.workflow.definition);
  if (!def.success) return fail(id, "The workflow definition is invalid.", log);
  if (payload.mode === "event" && exec.workflow.status !== "ACTIVE") return fail(id, "The workflow was paused before this run started.", log);

  const lead = payload.leadId ? await db.lead.findFirst({ where: { id: payload.leadId, workspaceId } }) : null;
  const cond = evaluateConditions(def.data.conditions, lead);
  if (!cond.ok) {
    log.push({ index: -1, type: "CONDITIONS", status: "done", detail: `Skipped: ${cond.reason}` });
    await db.workflowExecution.update({ where: { id }, data: { status: "SUCCEEDED", log: json(log), finishedAt: new Date() } });
    return;
  }

  for (const [index, action] of def.data.actions.entries()) {
    if (!nextStepIndex(log, index)) continue;
    try {
      const detail = await executeAction(workspaceId, action as Action, lead);
      log.push({ index, type: action.type, status: "done", detail });
      await db.workflowExecution.update({ where: { id }, data: { log: json(log) } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Step failed.";
      log.push({ index, type: action.type, status: "failed", detail: msg });
      return fail(id, `Step ${index + 1} (${action.type}) failed: ${msg}`, log);
    }
  }
  await db.workflowExecution.update({ where: { id }, data: { status: "SUCCEEDED", error: null, log: json(log), finishedAt: new Date() } });
}

type LeadRow = NonNullable<Awaited<ReturnType<typeof db.lead.findFirst>>>;

async function executeAction(workspaceId: string, action: Action, lead: LeadRow | null): Promise<string> {
  const needLead = () => { if (!lead) throw new WorkflowError("This step needs a lead, but none was provided."); return lead; };

  switch (action.type) {
    case "NOTIFY": {
      await db.notification.create({ data: { workspaceId, title: renderTemplate(action.message, lead) } });
      return "Notification created.";
    }
    case "UPDATE_LEAD_STATUS": {
      const l = needLead();
      await db.lead.updateMany({ where: { id: l.id, workspaceId }, data: { status: action.status as LeadRow["status"] } });
      return `Lead status set to ${action.status}.`;
    }
    case "SET_FOLLOW_UP": {
      const l = needLead();
      await db.lead.updateMany({ where: { id: l.id, workspaceId }, data: { followUpDate: new Date(Date.now() + action.days * 86_400_000) } });
      return `Follow-up set for ${action.days} day(s) from now.`;
    }
    case "AI_DRAFT_NOTE": {
      const l = needLead();
      const provider = getConfiguredProviders()[0];
      if (!provider) throw new WorkflowError("No AI provider is configured on the server.");
      const out = await provider.generate({
        model: provider.models[0].id,
        system: "You draft short, honest follow-up messages for a sales team to review. Never invent facts. Do not claim anything was sent.",
        prompt: `${action.instruction}\n\nLead: ${l.name}${l.company ? `, ${l.company}` : ""}${l.jobTitle ? `, ${l.jobTitle}` : ""}`,
        maxTokens: 600,
      });
      const stamp = new Date().toISOString().slice(0, 10);
      await db.lead.updateMany({ where: { id: l.id, workspaceId }, data: { notes: `${l.notes ? `${l.notes}\n\n` : ""}[AI draft ${stamp}, review before use]\n${out.text}` } });
      return "AI draft added to the lead's notes. Nothing was sent.";
    }
  }
}

export const canManageWorkflows = (role: Role) => role === "OWNER" || role === "ADMIN";
