import { z } from "zod";
import { BUSINESS_TYPES, PRIMARY_GOALS } from "@/config/onboarding";
import { passwordSchema } from "@/lib/validation/auth";

export const profileSchema = z.object({ name: z.string().trim().min(2, "Enter your name").max(80) });

export const workspaceSchema = z.object({
  name: z.string().trim().min(1, "Enter a business name").max(120),
  businessType: z.enum(BUSINESS_TYPES).optional().or(z.literal("")),
  primaryGoal: z.enum(PRIMARY_GOALS).optional().or(z.literal("")),
});

export const passwordChangeSchema = z
  .object({ currentPassword: z.string().min(1, "Enter your current password").max(128), newPassword: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ["newPassword"], message: "Choose a different password from your current one" });

export const inviteSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
  label: z.string().trim().max(80).optional().or(z.literal("")),
  days: z.number().int().min(1).max(14),
});
