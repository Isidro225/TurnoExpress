import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyState } from "@/lib/oauth-state";
import { exchangeMpCode } from "@/lib/mercadopago";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const back = (msg: string) => {
    const dest = new URL("/admin/settings", url);
    dest.searchParams.set("mp", msg);
    return NextResponse.redirect(dest);
  };

  if (error) return back("error");
  if (!code || !state) return back("missing-code");

  const payload = verifyState<{ tenantId: string }>(state);
  if (!payload?.tenantId) return back("invalid-state");

  const clientId = process.env.MP_OAUTH_CLIENT_ID;
  const clientSecret = process.env.MP_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return back("server-misconfigured");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? url.origin;
  const redirectUri = `${baseUrl}/api/mercadopago/oauth/callback`;

  let token: Awaited<ReturnType<typeof exchangeMpCode>>;
  try {
    token = await exchangeMpCode({ clientId, clientSecret, code, redirectUri });
  } catch {
    return back("exchange-failed");
  }

  await prisma.tenant.update({
    where: { id: payload.tenantId },
    data: {
      mpAccessToken: token.access_token,
      mpPublicKey: token.public_key ?? null,
    },
  });

  return back("connected");
}
