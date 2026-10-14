import { z } from "zod";

export const RESPONSE_STYLES = ["concise", "detailed", "friendly", "formal"] as const;

export const agentSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(80),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  objective: z.string().trim().max(500).optional().or(z.literal("")),
  instructions: z.string().trim().min(10, "Describe what this agent should do (at least 10 characters)").max(8000),
  responseStyle: z.enum(RESPONSE_STYLES),
  provider: z.string().min(1, "Choose a provider"),
  model: z.string().min(1, "Choose a model"),
});

export const runSchema = z.object({
  agentId: z.string().min(1),
  input: z.string().trim().min(1, "Enter a request for the agent").max(8000, "Keep the request under 8,000 characters"),
});

export type AgentInput = z.input<typeof agentSchema>;
