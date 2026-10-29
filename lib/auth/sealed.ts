import { createHmac, timingSafeEqual } from "crypto";

/**
 * HMAC-SHA256 sealed JSON values, used for the session cookie and the short-
 * lived OAuth state cookie. Tamper-evident, not encrypted: never put secrets in
 * them, only identifiers and random nonces.
 */

export function authSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length > 0) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production.");
  }
  // Development fallback only — never used in production (guarded above).
  return "dev-insecure-secret-change-me";
}

export function seal(payload: unknown): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", authSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function unseal<T>(token: string): T | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", authSecret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()) as T;
  } catch {
    return null;
  }
}
