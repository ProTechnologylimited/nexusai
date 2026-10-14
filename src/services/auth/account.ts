import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { rateLimit } from "@/lib/security/rate-limit";
import { getTransactionalConfig, sendTransactional } from "@/services/email/provider";
import { appLink, resetEmail, verifyEmail } from "./emails";
import { consumeToken, createToken } from "./tokens";

/** Best-effort: never throws, returns whether an email was handed to the provider. */
export async function sendVerification(userId: string, email: string, name: string) {
  if (!getTransactionalConfig().configured) return false;
  try {
    const url = appLink(process.env.APP_URL!, "/verify-email", await createToken(userId, "EMAIL_VERIFY"));
    await sendTransactional({ to: email, ...verifyEmail(url, name) });
    return true;
  } catch {
    console.error("verification email failed");
    return false;
  }
}

export async function requestPasswordReset(email: string, ip: string): Promise<"sent" | "not_configured"> {
  if (!getTransactionalConfig().configured) return "not_configured";
  // Rate limited quietly: the response never reveals whether the account exists or was throttled.
  if (!rateLimit(`reset:${email}`, 3, 60 * 60_000).ok || !rateLimit(`reset-ip:${ip}`, 10, 60 * 60_000).ok) return "sent";
  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (user) {
    try {
      const url = appLink(process.env.APP_URL!, "/reset-password", await createToken(user.id, "PASSWORD_RESET"));
      await sendTransactional({ to: email, ...resetEmail(url) });
    } catch {
      console.error("reset email failed");
    }
  }
  return "sent";
}

export async function resetPassword(token: string, newPassword: string) {
  const userId = await consumeToken(token, "PASSWORD_RESET");
  if (!userId) return false;
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(newPassword), passwordChangedAt: new Date() } }),
    db.authToken.deleteMany({ where: { userId, type: "PASSWORD_RESET" } }),
  ]);
  return true;
}

export async function verifyEmailToken(token: string) {
  const userId = await consumeToken(token, "EMAIL_VERIFY");
  if (!userId) return false;
  await db.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  return true;
}
