import type { TokenType } from "@prisma/client";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/security/token";

export const TOKEN_TTL: Record<TokenType, number> = { PASSWORD_RESET: 60 * 60_000, EMAIL_VERIFY: 24 * 60 * 60_000 };

/** Issues a new token and revokes any earlier unused ones of the same type. Returns the raw token (never stored). */
export async function createToken(userId: string, type: TokenType) {
  const token = generateToken();
  await db.$transaction([
    db.authToken.deleteMany({ where: { userId, type, usedAt: null } }),
    db.authToken.create({ data: { userId, type, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + TOKEN_TTL[type]) } }),
  ]);
  return token;
}

/** Checks validity without consuming the token. */
export async function peekToken(token: string, type: TokenType) {
  const t = await db.authToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: { select: { email: true } } } });
  return t && t.type === type && !t.usedAt && t.expiresAt > new Date() ? { email: t.user.email } : null;
}

/** Atomically marks the token used (single-use). Returns the user id, or null if invalid/expired/used. */
export async function consumeToken(token: string, type: TokenType) {
  const tokenHash = hashToken(token);
  return db.$transaction(async (tx) => {
    const claim = await tx.authToken.updateMany({ where: { tokenHash, type, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
    if (claim.count !== 1) return null;
    const t = await tx.authToken.findUniqueOrThrow({ where: { tokenHash } });
    return t.userId;
  });
}
