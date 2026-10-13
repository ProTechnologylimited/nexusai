import { db } from "@/lib/db";
import type { LeadStatus } from "@prisma/client";

export const PIPELINE_ORDER: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"];

/** All queries are scoped by workspaceId. Never pass a client-supplied id here. */
export async function getDashboardSummary(workspaceId: string) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [activeAgents, totalAgents, activeWorkflows, totalWorkflows, leadGroups, campaignGroups, execGroups, activity, workflows] =
    await Promise.all([
      db.agent.count({ where: { workspaceId, status: "ACTIVE" } }),
      db.agent.count({ where: { workspaceId } }),
      db.workflow.count({ where: { workspaceId, status: "ACTIVE" } }),
      db.workflow.count({ where: { workspaceId } }),
      db.lead.groupBy({ by: ["status"], where: { workspaceId }, _count: { _all: true } }),
      db.campaign.groupBy({ by: ["status"], where: { workspaceId }, _count: { _all: true } }),
      db.agentExecution.groupBy({ by: ["status"], where: { workspaceId, createdAt: { gte: since } }, _count: { _all: true } }),
      db.activityLog.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take: 8 }),
      db.workflow.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, name: true, status: true } }),
    ]);

  const leadsByStatus = Object.fromEntries(PIPELINE_ORDER.map((s) => [s, 0])) as Record<LeadStatus, number>;
  for (const g of leadGroups) leadsByStatus[g.status] = g._count._all;
  const totalLeads = Object.values(leadsByStatus).reduce((a, b) => a + b, 0);

  const exec = { succeeded: 0, failed: 0, total: 0 };
  for (const g of execGroups) {
    exec.total += g._count._all;
    if (g.status === "SUCCEEDED") exec.succeeded = g._count._all;
    if (g.status === "FAILED") exec.failed = g._count._all;
  }
  const finished = exec.succeeded + exec.failed;

  return {
    agents: { active: activeAgents, total: totalAgents },
    workflows: { active: activeWorkflows, total: totalWorkflows, recent: workflows },
    leads: { total: totalLeads, byStatus: leadsByStatus },
    campaigns: {
      total: campaignGroups.reduce((n, g) => n + g._count._all, 0),
      active: campaignGroups.find((g) => g.status === "ACTIVE")?._count._all ?? 0,
    },
    executions30d: { ...exec, successRate: finished > 0 ? Math.round((exec.succeeded / finished) * 100) : null },
    activity,
  };
}
