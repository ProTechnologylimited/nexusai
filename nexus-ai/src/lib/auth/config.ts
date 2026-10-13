import type { NextAuthConfig } from "next-auth";

const PROTECTED = [
  "/dashboard", "/onboarding", "/agents", "/automation", "/leads", "/campaigns",
  "/email", "/crm", "/analytics", "/integrations", "/billing", "/settings", "/support",
];

// Edge-safe config (no database or bcrypt imports). Used by middleware.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const loggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      if (path === "/login" || path === "/register") {
        if (loggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }
      const isProtected = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`));
      return isProtected ? loggedIn : true;
    },
    jwt({ token, user }) {
      if (user?.id) { token.id = user.id; token.authAt = Date.now(); }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      session.authAt = token.authAt;
      return session;
    },
  },
} satisfies NextAuthConfig;
