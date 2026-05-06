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

export type CreatePlatformSubscriptionArgs = {
  accessToken: string;
  tenantId: string;
  planName: string;
  amountCents: number;
  payerEmail: string;
  baseUrl: string;
  trialEndsAt?: Date;
};

export type UpdatePlatformSubscriptionArgs = {
  accessToken: string;
  subscriptionId: string;
  planName: string;
  amountCents: number;
};

export type MpPreapprovalResponse = {
  id?: string;
  init_point?: string;
  status?: string;
  external_reference?: string | number;
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
  // MP rechaza auto_return y notification_url si las URLs no son HTTPS públicas.
  // En desarrollo (localhost / http) las omitimos para que el cobro se pueda probar.
  const isPublicHttps = args.baseUrl.startsWith("https://");
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
      ...(isPublicHttps
        ? {
            auto_return: "approved" as const,
            notification_url: `${args.baseUrl}/api/mercadopago/webhook`,
          }
        : {}),
    },
  });
  return result;
}

export async function createPlatformSubscription(
  args: CreatePlatformSubscriptionArgs
): Promise<MpPreapprovalResponse> {
  const res = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      reason: `TurnoExpress ${args.planName}`,
      external_reference: args.tenantId,
      payer_email: args.payerEmail,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        ...(args.trialEndsAt ? { start_date: args.trialEndsAt.toISOString() } : {}),
        transaction_amount: args.amountCents / 100,
        currency_id: "ARS",
      },
      back_url: `${args.baseUrl}/admin?billing=return`,
      status: "pending",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`MP subscription create failed: ${res.status} ${text}`);
  }

  return (await res.json()) as MpPreapprovalResponse;
}

export async function getPlatformSubscription(
  accessToken: string,
  subscriptionId: string
): Promise<MpPreapprovalResponse> {
  const res = await fetch(
    `https://api.mercadopago.com/preapproval/${encodeURIComponent(subscriptionId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`MP subscription get failed: ${res.status} ${text}`);
  }

  return (await res.json()) as MpPreapprovalResponse;
}

export async function updatePlatformSubscription(
  args: UpdatePlatformSubscriptionArgs
): Promise<MpPreapprovalResponse> {
  const res = await fetch(
    `https://api.mercadopago.com/preapproval/${encodeURIComponent(args.subscriptionId)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        reason: `TurnoExpress ${args.planName}`,
        auto_recurring: {
          transaction_amount: args.amountCents / 100,
          currency_id: "ARS",
        },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`MP subscription update failed: ${res.status} ${text}`);
  }

  return (await res.json()) as MpPreapprovalResponse;
}
