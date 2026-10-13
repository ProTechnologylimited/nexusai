"use server";

import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { hashPassword } from "@/lib/auth/password";
import { loginSchema, registerSchema } from "@/lib/validation/auth";
import { rateLimit } from "@/lib/security/rate-limit";
import { sendVerification } from "@/services/auth/account";
import { safeRedirect } from "@/lib/security/redirect";

export type ActionResult = { error?: string; fieldErrors?: Record<string, string> };

export async function loginAction(values: unknown, callbackUrl?: string): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { error: "Enter a valid email and password." };

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeRedirect(callbackUrl),
    });
  } catch (err) {
    if (err instanceof AuthError) return { error: "Email or password is incorrect." };
    throw err; // lets Next.js handle the redirect
  }
  return {};
}

function slugify(input: string) {
  const base = input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "workspace";
  return `${base}-${randomBytes(3).toString("hex")}`;
}

export async function registerAction(values: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors };
  }
  const { fullName, businessName, email, password } = parsed.data;

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`register:${ip}`, 10, 60 * 60_000).ok) {
    return { error: "Too many sign-up attempts. Try again later." };
  }

  const passwordHash = await hashPassword(password);
  const workspaceName = businessName?.trim() || `${fullName.split(" ")[0]}'s workspace`;

  try {
    await db.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, name: fullName, passwordHash } });
      const workspace = await tx.workspace.create({ data: { name: workspaceName, slug: slugify(workspaceName) } });
      await tx.workspaceMembership.create({ data: { userId: user.id, workspaceId: workspace.id, role: "OWNER" } });
      await tx.subscription.create({ data: { workspaceId: workspace.id, plan: "FREE" } });
      await tx.activityLog.create({
        data: { workspaceId: workspace.id, actorId: user.id, action: "workspace.created", summary: "Workspace created" },
      });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { fieldErrors: { email: "An account with this email already exists." } };
    }
    console.error("register failed", err instanceof Error ? err.message : "unknown error");
    return { error: "We couldn't create your account. Try again." };
  }

  const created = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (created) await sendVerification(created.id, email, fullName);

  try {
    await signIn("credentials", { email, password, redirectTo: "/onboarding" });
  } catch (err) {
    if (err instanceof AuthError) return { error: "Account created. Sign in to continue." };
    throw err;
  }
  return {};
}
