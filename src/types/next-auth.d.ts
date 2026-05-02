import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      tenantId?: string;
      role?: string;
    } & DefaultSession["user"];
  }

  interface User {
    tenantId?: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tenantId?: string;
    role?: string;
  }
}
