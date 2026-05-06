"use server";

import { redirect } from "next/navigation";
import {
  isPlatformPasswordConfigured,
  isValidPlatformPassword,
  lockPlatform,
  unlockPlatform,
} from "@/lib/platform-admin";

export async function unlockPlatformAction(formData: FormData) {
  if (!isPlatformPasswordConfigured()) {
    redirect("/platform/login?error=missing-config");
  }

  const password = String(formData.get("password") ?? "");
  if (!isValidPlatformPassword(password)) {
    redirect("/platform/login?error=invalid");
  }

  await unlockPlatform();
  redirect("/platform");
}

export async function lockPlatformAction() {
  await lockPlatform();
  redirect("/platform/login");
}
