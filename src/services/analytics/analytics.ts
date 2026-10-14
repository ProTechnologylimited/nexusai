import { db } from "@/lib/db";
import { PLAN_LIMITS } from "@/config/limits";
import { startOfMonthUtc } from "@/services/agents/agents";
import { bucketByDay, countStatuses, dayKeys, rangeStart, type Range } from "./metrics";

const CAP = 20_000; // rows scanned per metric; charts are capped, not extrapolated

/** Every query is scoped by workspaceId. */
export async function getAnalytics(workspaceId: string, days: Range) {
  const since = rangeStart(days);
  const month = startOfMonthUtc();

  const [agentRuns, workflowRuns, leadsCreated, emailGroups, campaignGroups, campaignsCreated, dealGroups, sub,
    agentCount, agentRunsMonth, draftsMonth, workflowRunsMonth, emailsMonth] = await Promise.all([
    db.agentExecution.findMany({ where: { workspaceId, createdAt: { gte: since } }, select: { createdAt: true, status: true }, take: CAP }),
    db.workflowExecution.findMany({ where: { workspaceId, createdAt: { gte: since } }, select: { createdAt: true, status: true }, take: CAP }),
    db.lead.findMany({ where: { workspaceId, createdAt: { gte: since } }, select: { createdAt: true, status: true }, take: CAP }),
    db.emailMessage.groupBy({ by: ["status"], where: { workspaceId, createdAt: { gte: since } }, _count: { _all: true } }),
    db.campaign.groupBy({ by: ["status"], where: { workspaceId }, _count: { _all: true } }),
    db.campaign.count({ where: { workspaceId, createdAt: { gte: since } } }),
    db.deal.groupBy({ by: ["stage"], where: { workspaceId }, _count: { _all: true } }),
    db.subscription.findUnique({ where: { workspaceId } }),
    db.agent.count({ where: { workspaceId } }),
    db.agentExecution.count({ where: { workspaceId, createdAt: { gte: month }, status: { not: "FAILED" } } }),
    db.usageRecord.count({ where: { workspaceId, feature: { in: ["campaign_draft", "email_draft"] }, createdAt: { gte: month } } }),
    db.workflowExecution.count({ where: { workspaceId, createdAt: { gte: month } } }),
    db.emailMessage.count({ where: { workspaceId, status: "ACCEPTED", sentAt: { gte: month } } }),
  ]);

  const plan = sub?.plan ?? "FREE";
  const limits = PLAN_LIMITS[plan];
  const agentBuckets = bucketByDay(agentRuns.map((r) => r.createdAt), days);
  const workflowBuckets = bucketByDay(workflowRuns.map((r) => r.createdAt), days);
  const leadBuckets = bucketByDay(leadsCreated.map((r) => r.createdAt), days);

  const email = { drafted: 0, accepted: 0, failed: 0 };
  for (const g of emailGroups) {
    email.drafted += g._count._all;
    if (g.status === "ACCEPTED") email.accepted = g._count._all;
    if (g.status === "FAILED") email.failed = g._count._all;
  }

  return {
    days,
    series: dayKeys(days).map((day, i) => ({ day: day.slice(5), agentRuns: agentBuckets[i], workflowRuns: workflowBuckets[i], leads: leadBuckets[i] })),
    agents: countStatuses(agentRuns),
    workflows: countStatuses(workflowRuns),
    leads: {
      created: leadsCreated.length,
      nowQualified: leadsCreated.filter((l) => l.status === "QUALIFIED").length,
      nowConverted: leadsCreated.filter((l) => l.status === "CONVERTED").length,
    },
    email,
    campaigns: { createdInRange: campaignsCreated, byStatus: Object.fromEntries(campaignGroups.map((g) => [g.status, g._count._all])) as Record<string, number> },
    deals: Object.fromEntries(dealGroups.map((g) => [g.stage, g._count._all])) as Record<string, number>,
    truncated: agentRuns.length >= CAP || workflowRuns.length >= CAP || leadsCreated.length >= CAP,
    usage: {
      plan,
      rows: [
        { label: "AI agents", used: agentCount, limit: limits.maxAgents },
        { label: "Agent runs this month", used: agentRunsMonth, limit: limits.monthlyRuns },
        { label: "AI drafts this month", used: draftsMonth, limit: limits.monthlyCampaignDrafts },
        { label: "Workflow runs this month", used: workflowRunsMonth, limit: limits.monthlyWorkflowRuns },
        { label: "Emails sent this month", used: emailsMonth, limit: limits.monthlyEmails },
      ],
    },
  };
}
