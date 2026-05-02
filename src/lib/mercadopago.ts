import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

export function mpClient(accessToken: string) {
  return new MercadoPagoConfig({
    accessToken,
    options: { timeout: 5000 },
  });
}

export function mpPreference(accessToken: string) {
  return new Preference(mpClient(accessToken));
}

export function mpPayment(accessToken: string) {
  return new Payment(mpClient(accessToken));
}

export type CreateDepositArgs = {
  accessToken: string;
  appointmentId: string;
  tenantSlug: string;
  serviceName: string;
  amountCents: number;
  payerEmail: string;
  baseUrl: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// OAuth — cada negocio conecta su cuenta MP.
// Docs: https://www.mercadopago.com.ar/developers/es/docs/security/oauth/introduction
// ─────────────────────────────────────────────────────────────────────────────

export const MP_OAUTH_AUTHORIZE_URL = "https://auth.mercadopago.com/authorization";
export const MP_OAUTH_TOKEN_URL = "https://api.mercadopago.com/oauth/token";

export type MpOAuthTokenResponse = {
  access_token: string;
  refresh_token?: string;
  public_key?: string;
  user_id?: number | string;
  live_mode?: boolean;
  expires_in?: number;
  token_type?: string;
};

export async function exchangeMpCode(args: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<MpOAuthTokenResponse> {
  const res = await fetch(MP_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: args.clientId,
      client_secret: args.clientSecret,
      code: args.code,
      redirect_uri: args.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`MP OAuth token exchange falló: ${res.status} ${text}`);
  }
  return (await res.json()) as MpOAuthTokenResponse;
}

export async function createDepositPreference(args: CreateDepositArgs) {
  const pref = mpPreference(args.accessToken);
  const result = await pref.create({
    body: {
      items: [
        {
          id: args.appointmentId,
          title: `Seña - ${args.serviceName}`,
          quantity: 1,
          unit_price: args.amountCents / 100,
          currency_id: "ARS",
        },
      ],
      payer: { email: args.payerEmail },
      external_reference: args.appointmentId,
      back_urls: {
        success: `${args.baseUrl}/${args.tenantSlug}/book/success?id=${args.appointmentId}`,
        failure: `${args.baseUrl}/${args.tenantSlug}/book/failure?id=${args.appointmentId}`,
        pending: `${args.baseUrl}/${args.tenantSlug}/book/pending?id=${args.appointmentId}`,
      },
      auto_return: "approved",
      notification_url: `${args.baseUrl}/api/mercadopago/webhook`,
    },
  });
  return result;
}
