import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128, "Use 128 characters or fewer")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address").max(254);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(128),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(80),
    businessName: z.string().trim().max(120).optional().or(z.literal("")),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms to continue" }) }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type LoginInput = z.input<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z
  .object({ token: z.string().min(20).max(200), password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });
