import { z } from "zod";

export const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"] as const;
const text = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const leadSchema = z.object({
  name: z.string().trim().min(1, "Enter a contact name").max(120),
  company: text(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254).optional().or(z.literal("")),
  website: z
    .string().trim().max(200)
    .refine((v) => v === "" || /^https?:\/\/.+\..+/i.test(v), "Use a full URL starting with http:// or https://")
    .optional(),
  industry: text(80),
  jobTitle: text(80),
  source: text(80),
  status: z.enum(LEAD_STATUSES),
  followUpDate: z.string().optional().or(z.literal("")),
  notes: text(4000),
});

export type LeadInput = z.input<typeof leadSchema>;
