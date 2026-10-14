import { z } from "zod";

// No CR/LF in subjects: prevents email header injection.
const subject = z.string().trim().min(1, "Enter a subject").max(200).refine((v) => !/[\r\n]/.test(v), "Subject must be a single line");

export const templateSchema = z.object({
  name: z.string().trim().min(2, "Enter a template name").max(80),
  subject,
  body: z.string().trim().min(1, "Enter the email body").max(10000),
});

export const messageSchema = z.object({
  leadId: z.string().min(1, "Choose a recipient"),
  subject,
  body: z.string().trim().min(1, "Enter the email body").max(10000),
});

export const aiDraftSchema = z.object({
  leadId: z.string().min(1, "Choose a recipient first"),
  instruction: z.string().trim().min(5, "Describe the email you want (5+ characters)").max(500),
});
