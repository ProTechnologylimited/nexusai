import { z } from "zod";
import { LEAD_STATUSES } from "@/lib/validation/leads";

export const TRIGGERS = ["MANUAL", "LEAD_CREATED"] as const;

const condition = z.discriminatedUnion("field", [
  z.object({ field: z.literal("hasEmail") }),
  z.object({ field: z.literal("status"), value: z.enum(LEAD_STATUSES) }),
  z.object({ field: z.literal("source"), value: z.string().trim().min(1, "Enter a source").max(80) }),
]);

const action = z.discriminatedUnion("type", [
  z.object({ type: z.literal("NOTIFY"), message: z.string().trim().min(1, "Enter a message").max(300) }),
  z.object({ type: z.literal("UPDATE_LEAD_STATUS"), status: z.enum(LEAD_STATUSES) }),
  z.object({ type: z.literal("SET_FOLLOW_UP"), days: z.number().int().min(0).max(365) }),
  z.object({ type: z.literal("AI_DRAFT_NOTE"), instruction: z.string().trim().min(5, "Describe the draft you want (5+ characters)").max(500) }),
]);

export const definitionSchema = z.object({
  conditions: z.array(condition).max(5),
  actions: z.array(action).min(1, "Add at least one action").max(10),
});

export const workflowSchema = z.object({
  name: z.string().trim().min(2, "Enter a workflow name").max(120),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  trigger: z.enum(TRIGGERS),
  definition: definitionSchema,
});

export type WorkflowInput = z.input<typeof workflowSchema>;
export type WorkflowDefinition = z.infer<typeof definitionSchema>;
