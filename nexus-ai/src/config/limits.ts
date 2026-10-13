import type { Plan } from "@prisma/client";

// Proposed limits. Edit freely; enforced server-side.
export const PLAN_LIMITS: Record<Plan, { maxAgents: number; monthlyRuns: number; monthlyCampaignDrafts: number; monthlyWorkflowRuns: number; monthlyEmails: number }> = {
  FREE: { maxAgents: 1, monthlyRuns: 20, monthlyCampaignDrafts: 5, monthlyWorkflowRuns: 10, monthlyEmails: 20 },
  STARTER: { maxAgents: 3, monthlyRuns: 200, monthlyCampaignDrafts: 50, monthlyWorkflowRuns: 200, monthlyEmails: 300 },
  GROWTH: { maxAgents: 10, monthlyRuns: 1000, monthlyCampaignDrafts: 300, monthlyWorkflowRuns: 1500, monthlyEmails: 2000 },
  BUSINESS: { maxAgents: 50, monthlyRuns: 5000, monthlyCampaignDrafts: 1500, monthlyWorkflowRuns: 10000, monthlyEmails: 10000 },
};
