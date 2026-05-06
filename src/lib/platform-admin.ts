import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

const PLATFORM_COOKIE = "turnoexpress-platform";
const PLATFORM_SESSION_SECONDS = 12 * 60 * 60;

function getPlatformPassword(): string {
  return process.env.PLATFORM_ADMIN_PASSWORD?.trim() ?? "";
}

function getSigningSecret(): string {
  return `${process.env.AUTH_SECRET ?? "turnoexpress-dev"}:${getPlatformPassword()}`;
}

function sign(expiresAt: number): string {
  return createHmac("sha256", getSigningSecret())
    .update(String(expiresAt))
    .digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function verifyToken(token: string | undefined): boolean {
  const password = getPlatformPassword();
  if (!password || !token) return false;

  const [expiresAtRaw, signature] = token.split(".");
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now() || !signature) return false;

  return safeEqual(sign(expiresAt), signature);
}

export function isPlatformPasswordConfigured(): boolean {
  return getPlatformPassword().length > 0;
}

export function isValidPlatformPassword(value: string): boolean {
  const password = getPlatformPassword();
  if (!password || !value) return false;
  return safeEqual(password, value);
}

export async function isPlatformUnlocked(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyToken(cookieStore.get(PLATFORM_COOKIE)?.value);
}

export async function unlockPlatform() {
  const expiresAt = Date.now() + PLATFORM_SESSION_SECONDS * 1000;
  const cookieStore = await cookies();
  cookieStore.set(PLATFORM_COOKIE, `${expiresAt}.${sign(expiresAt)}`, {
    httpOnly: true,
    maxAge: PLATFORM_SESSION_SECONDS,
    path: "/platform",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function lockPlatform() {
  const cookieStore = await cookies();
  cookieStore.delete(PLATFORM_COOKIE);
}

export async function requirePlatformAdmin() {
  if (!isPlatformPasswordConfigured()) notFound();
  if (!(await isPlatformUnlocked())) redirect("/platform/login");
}

export async function assertPlatformAdmin() {
  if (!isPlatformPasswordConfigured() || !(await isPlatformUnlocked())) {
    throw new Error("No autorizado");
  }
}
