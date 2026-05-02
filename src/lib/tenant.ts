import { cache } from "react";
import { prisma } from "./prisma";

export const getTenantBySlug = cache(async (slug: string) => {
  return prisma.tenant.findUnique({
    where: { slug },
  });
});

export const SLUG_RESERVED = new Set([
  "admin",
  "api",
  "login",
  "signup",
  "logout",
  "register",
  "dashboard",
  "settings",
  "_next",
  "static",
  "public",
  "favicon.ico",
]);

export function isReservedSlug(slug: string): boolean {
  return SLUG_RESERVED.has(slug.toLowerCase());
}

export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
