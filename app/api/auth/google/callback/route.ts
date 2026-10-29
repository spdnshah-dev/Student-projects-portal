import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth/session";
import { unseal } from "@/lib/auth/sealed";
import {
  OAUTH_COOKIE,
  exchangeCodeForIdToken,
  googleConfigured,
  type OAuthState,
} from "@/lib/auth/google";
import { decodeJwtPayload, validateGoogleClaims } from "@/lib/auth/google-claims";
import { studentSignInDecision } from "@/lib/auth/student-gate";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/google/callback — Google sends the student back here.
 *
 * Allowlist gate: the verified Google email must already exist in `users` as
 * an ACTIVE STUDENT. Anyone else is refused ("Your email isn't registered…")
 * and NO user row is ever created here. On the first successful sign-in the
 * Google account id (sub) is linked to the student.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const fail = (code: string) =>
    NextResponse.redirect(new URL(`/login?error=${code}`, req.url));

  if (!googleConfigured()) return fail("google_off");

  const store = await cookies();
  const sealed = store.get(OAUTH_COOKIE)?.value;
  store.delete(OAUTH_COOKIE); // single use
  const pending = sealed ? unseal<OAuthState>(sealed) : null;
  if (!pending || pending.exp * 1000 < Date.now()) return fail("google");

  // Google reported a problem or the student cancelled.
  if (url.searchParams.get("error")) return fail("cancelled");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || state !== pending.state) return fail("google");

  let claims;
  try {
    const idToken = await exchangeCodeForIdToken(code, pending.verifier, req.url);
    claims = validateGoogleClaims(decodeJwtPayload(idToken), {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      nonce: pending.nonce,
    });
  } catch (e) {
    console.error("[google sign-in] token exchange failed:", e);
    return fail("google");
  }
  if (!claims.ok) {
    console.warn("[google sign-in] rejected id token:", claims.reason);
    return fail(claims.reason === "unverified_email" ? "unverified" : "google");
  }
  const { email, sub } = claims.identity;

  // The admin-added email is the key. Look it up; never create.
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, status: true, googleSub: true },
  });
  const decision = studentSignInDecision(user, sub);
  if (!decision.allow) return fail(decision.reason);

  if (decision.linkSub) {
    await prisma.user.update({
      where: { id: user!.id },
      data: { googleSub: sub, provider: "GOOGLE", googleLinkedAt: new Date() },
    });
  }

  await createSession(user!.id, "STUDENT");

  // A student without a profile still has consent to give; the guards on the
  // student pages send them there anyway, but be direct about it.
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user!.id },
    select: { consentAt: true },
  });
  return NextResponse.redirect(
    new URL(profile?.consentAt ? "/dashboard" : "/consent", req.url),
  );
}
