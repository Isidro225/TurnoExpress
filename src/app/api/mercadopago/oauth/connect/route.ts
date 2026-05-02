import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { signState } from "@/lib/oauth-state";
import { MP_OAUTH_AUTHORIZE_URL } from "@/lib/mercadopago";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const clientId = process.env.MP_OAUTH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "MP OAuth no está configurado en el servidor" },
      { status: 500 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;
  const redirectUri = `${baseUrl}/api/mercadopago/oauth/callback`;

  const state = signState({ tenantId: session.user.tenantId });

  const authorizeUrl = new URL(MP_OAUTH_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("platform_id", "mp");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);

  return NextResponse.redirect(authorizeUrl.toString());
}
