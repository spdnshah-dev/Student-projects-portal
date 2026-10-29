/**
 * Validation of the ID token Google returns from its token endpoint. Pure (no
 * I/O) so it is unit-tested.
 *
 * The token arrives over TLS directly from Google's token endpoint in exchange
 * for the one-time code + our client secret, so (per OpenID Connect Core
 * §3.1.3.7.6) its claims can be trusted without re-checking the signature.
 * We still check who issued it, who it is for, that it has not expired, that
 * it answers OUR request (nonce) and that Google has verified the email.
 */

export const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export type GoogleIdentity = {
  sub: string;
  email: string; // lower-cased
  name: string | null;
  picture: string | null;
};

export type ClaimsResult =
  | { ok: true; identity: GoogleIdentity }
  | { ok: false; reason: "malformed" | "issuer" | "audience" | "expired" | "nonce" | "unverified_email" };

export function decodeJwtPayload(idToken: string): Record<string, unknown> | null {
  const parts = idToken.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    const obj = JSON.parse(json);
    return obj && typeof obj === "object" ? (obj as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function validateGoogleClaims(
  claims: Record<string, unknown> | null,
  expected: { clientId: string; nonce: string; now?: number },
): ClaimsResult {
  if (!claims) return { ok: false, reason: "malformed" };
  const now = expected.now ?? Date.now();

  if (typeof claims.iss !== "string" || !GOOGLE_ISSUERS.includes(claims.iss)) {
    return { ok: false, reason: "issuer" };
  }
  const aud = claims.aud;
  const audOk = Array.isArray(aud)
    ? aud.includes(expected.clientId)
    : aud === expected.clientId;
  if (!audOk) return { ok: false, reason: "audience" };
  if (typeof claims.exp !== "number" || claims.exp * 1000 <= now) {
    return { ok: false, reason: "expired" };
  }
  if (typeof claims.nonce !== "string" || claims.nonce !== expected.nonce) {
    return { ok: false, reason: "nonce" };
  }
  if (typeof claims.sub !== "string" || !claims.sub) return { ok: false, reason: "malformed" };
  if (typeof claims.email !== "string" || !claims.email.includes("@")) {
    return { ok: false, reason: "malformed" };
  }
  // Google sends a boolean; be strict — only `true` counts as verified.
  if (claims.email_verified !== true) return { ok: false, reason: "unverified_email" };

  return {
    ok: true,
    identity: {
      sub: claims.sub,
      email: claims.email.trim().toLowerCase(),
      name: typeof claims.name === "string" ? claims.name : null,
      picture: typeof claims.picture === "string" ? claims.picture : null,
    },
  };
}
