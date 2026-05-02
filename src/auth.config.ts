import type { NextAuthConfig } from "next-auth";

// Edge-safe config (sin Prisma ni bcryptjs). Lo importa el middleware.
export const authConfig = {
  pages: { signIn: "/login" },
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
