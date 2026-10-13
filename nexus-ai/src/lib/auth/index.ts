import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./config";
import { db } from "@/lib/db";
import { verifyPassword } from "./password";
import { loginSchema } from "@/lib/validation/auth";
import { rateLimit } from "@/lib/security/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        // 10 attempts per 15 minutes per email. Failures look identical to bad credentials.
        if (!rateLimit(`login:${email}`, 10, 15 * 60_000).ok) return null;

        const user = await db.user.findUnique({ where: { email } });
        const valid = await verifyPassword(password, user?.passwordHash);
        if (!user || !valid) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
