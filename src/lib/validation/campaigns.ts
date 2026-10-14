import { z } from "zod";

export const CAMPAIGN_STATUSES = ["DRAFT", "PLANNED", "ACTIVE", "COMPLETED"] as const;
export const CHANNELS = ["Social media", "Email", "Content marketing", "Paid ads", "Events", "Other"] as const;
const opt = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date").optional().or(z.literal(""));

export const campaignSchema = z
  .object({
    name: z.string().trim().min(2, "Enter a campaign name").max(120),
    objective: opt(500),
    targetAudience: opt(500),
    offering: opt(300),
    keyMessage: opt(500),
    channel: z.enum(CHANNELS).optional().or(z.literal("")),
    startDate: date,
    endDate: date,
    budget: z.string().trim().optional().refine(
      (v) => !v || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) <= 10_000_000),
      "Enter an amount up to 10,000,000",
    ),
    status: z.enum(CAMPAIGN_STATUSES).default("DRAFT"),
    content: opt(20000),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    path: ["endDate"], message: "End date must be on or after the start date",
  });

export type CampaignInput = z.input<typeof campaignSchema>;
