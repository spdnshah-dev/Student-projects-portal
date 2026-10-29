import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  OAUTH_COOKIE,
  authorizationUrl,
  googleConfigured,
  newOAuthState,
} from "@/lib/auth/google";
import { seal } from "@/lib/auth/sealed";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/google/start — begin Google sign-in for a student. Stores the
 * one-time state / nonce / PKCE verifier in a short-lived, signed, httpOnly
 * cookie and sends the browser to Google.
 */
export async function GET(req: Request) {
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google_off", req.url));
  }
  const s = newOAuthState();
  const store = await cookies();
  store.set(OAUTH_COOKIE, seal(s), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
  return NextResponse.redirect(authorizationUrl(s, req.url));
}
