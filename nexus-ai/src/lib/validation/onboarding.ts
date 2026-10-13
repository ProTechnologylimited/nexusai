import { z } from "zod";
import { BUSINESS_TYPES, PRIMARY_GOALS } from "@/config/onboarding";

export const onboardingSchema = z.object({
  step: z.number().int().min(0).max(5),
  fullName: z.string().trim().min(2).max(80).optional(),
  businessName: z.string().trim().min(1).max(120).optional(),
  businessType: z.enum(BUSINESS_TYPES).optional(),
  primaryGoal: z.enum(PRIMARY_GOALS).optional(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
