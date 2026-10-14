import { z } from "zod";

export const DEAL_STAGES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;
const opt = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const companySchema = z.object({
  name: z.string().trim().min(1, "Enter a company name").max(120),
  website: z.string().trim().max(200).refine((v) => v === "" || /^https?:\/\/.+\..+/i.test(v), "Use a full URL starting with http:// or https://").optional(),
  industry: opt(80),
  size: opt(40),
  notes: opt(4000),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter a contact name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254).optional().or(z.literal("")),
  phone: opt(40),
  source: opt(80),
  tags: z.string().max(200).optional().transform((v) => (v ?? "").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10)),
  companyId: opt(60),
  notes: opt(4000),
});

export const dealSchema = z.object({
  name: z.string().trim().min(1, "Enter a deal name").max(120),
  companyId: opt(60),
  value: z.string().trim().optional().refine(
    (v) => !v || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) <= 10_000_000),
    "Enter an amount up to 10,000,000 (for example 2500 or 2500.50)",
  ),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Use a 3-letter currency code").default("USD"),
  stage: z.enum(DEAL_STAGES).default("NEW"),
  expectedCloseDate: opt(10),
  notes: opt(4000),
});

export const stageSchema = z.object({ id: z.string().min(1), stage: z.enum(DEAL_STAGES) });

export const toCents = (v?: string) => (v ? Math.round(Number(v) * 100) : null);
