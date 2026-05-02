import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const SECRET = process.env.AUTH_SECRET ?? "dev-secret-change-me";
const TTL_MS = 10 * 60 * 1000;

function safeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function signState(payload: Record<string, unknown>): string {
  const body = {
    ...payload,
    exp: Date.now() + TTL_MS,
    nonce: randomBytes(8).toString("hex"),
  };
  const data = Buffer.from(JSON.stringify(body)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyState<T extends Record<string, unknown>>(state: string): T | null {
  const [data, sig] = state.split(".");
  if (!data || !sig) return null;
  const expected = createHmac("sha256", SECRET).update(data).digest("base64url");
  if (!safeEq(sig, expected)) return null;
  try {
    const body = JSON.parse(Buffer.from(data, "base64url").toString());
    if (typeof body.exp !== "number" || body.exp < Date.now()) return null;
    return body as T;
  } catch {
    return null;
  }
}
