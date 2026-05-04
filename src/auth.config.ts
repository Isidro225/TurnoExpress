import type { NextAuthConfig } from "next-auth";

// Config liviana para Proxy (sin Prisma ni bcryptjs).
export const authConfig = {
  pages: { signIn: "/login" },
  trustHost:
    process.env.AUTH_TRUST_HOST === "true" ||
    process.env.RAILWAY_ENVIRONMENT !== undefined ||
    process.env.NODE_ENV !== "production",
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = request.nextUrl.pathname.startsWith("/admin");
      if (isOnAdmin) return isLoggedIn;
      return true;
    },
  },
} satisfies NextAuthConfig;
