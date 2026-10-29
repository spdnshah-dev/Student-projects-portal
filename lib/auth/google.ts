import { randomBytes, createHash } from "crypto";

/**
 * Google sign-in (OpenID Connect, authorization-code flow with PKCE) for
 * STUDENTS. Sign-in only: scopes are openid email profile, and no offline
 * access is requested, so Google never issues us a refresh token.
 *
 * Secrets come from the environment:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET — from Google Cloud Console.
 *   APP_URL — the public origin (e.g. https://student-projects-portal.vercel.app);
 *             the redirect URI registered with Google is
 *             `${APP_URL}/api/auth/google/callback`. NEXTAUTH_URL is accepted
 *             as an alias. When neither is set, the request's own origin is
 *             used (fine for local development).
 */

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

/**
 * Google's token endpoint. Outside production a test harness may point this at
 * a local stand-in (GOOGLE_TOKEN_ENDPOINT) to exercise the callback without
 * real Google credentials; production always talks to Google.
 */
function tokenEndpoint(): string {
  if (process.env.NODE_ENV !== "production" && process.env.GOOGLE_TOKEN_ENDPOINT) {
    return process.env.GOOGLE_TOKEN_ENDPOINT;
  }
  return GOOGLE_TOKEN_ENDPOINT;
}
export const CALLBACK_PATH = "/api/auth/google/callback";
/** Short-lived, signed, httpOnly cookie holding the pending state / nonce / PKCE verifier. */
export const OAUTH_COOKIE = "lb_oauth";

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function clientId(): string {
  const v = process.env.GOOGLE_CLIENT_ID;
  if (!v) throw new Error("GOOGLE_CLIENT_ID is not set.");
  return v;
}

function clientSecret(): string {
  const v = process.env.GOOGLE_CLIENT_SECRET;
  if (!v) throw new Error("GOOGLE_CLIENT_SECRET is not set.");
  return v;
}

export function redirectUri(requestUrl: string): string {
  const configured = process.env.APP_URL || process.env.NEXTAUTH_URL;
  const origin = configured?.replace(/\/+$/, "") || new URL(requestUrl).origin;
  return `${origin}${CALLBACK_PATH}`;
}

export type OAuthState = { state: string; nonce: string; verifier: string; exp: number };

export function newOAuthState(): OAuthState {
  return {
    state: randomBytes(24).toString("base64url"),
    nonce: randomBytes(24).toString("base64url"),
    verifier: randomBytes(48).toString("base64url"),
    exp: Math.floor(Date.now() / 1000) + 10 * 60,
  };
}

export function authorizationUrl(s: OAuthState, requestUrl: string): string {
  const challenge = createHash("sha256").update(s.verifier).digest("base64url");
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(requestUrl),
    response_type: "code",
    scope: "openid email profile",
    state: s.state,
    nonce: s.nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

/** Exchange the one-time code for tokens; returns the raw ID token (a JWT). */
export async function exchangeCodeForIdToken(
  code: string,
  verifier: string,
  requestUrl: string,
): Promise<string> {
  const res = await fetch(tokenEndpoint(), {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: redirectUri(requestUrl),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Google token endpoint responded ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = (await res.json()) as { id_token?: string };
  if (!data.id_token) throw new Error("Google token response had no id_token.");
  return data.id_token;
}
