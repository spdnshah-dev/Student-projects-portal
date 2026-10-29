import type { Role, UserStatus } from "@prisma/client";

/**
 * The allowlist gate for Google sign-in. Pure (no Prisma) so it is unit-tested.
 *
 * Only an email an admin has ALREADY added as an active STUDENT may enter.
 * Nothing is ever created from a Google sign-in. Admins and the super admin use
 * email + password, so a Google sign-in with a staff email is also refused.
 */

export type GateUser = {
  role: Role;
  status: UserStatus;
  googleSub: string | null;
} | null;

export type GateDenial = "not_registered" | "disabled" | "mismatch";

export type GateDecision =
  | { allow: true; linkSub: boolean }
  | { allow: false; reason: GateDenial };

export const DENIAL_MESSAGES: Record<GateDenial, string> = {
  not_registered: "Your email isn't registered. Ask your Learnbay admin to add you.",
  disabled: "Your account has been disabled. Contact your Learnbay admin if you think this is a mistake.",
  mismatch:
    "This Google account doesn't match the one already linked to your email. Ask your Learnbay admin for help.",
};

export function studentSignInDecision(user: GateUser, googleSub: string): GateDecision {
  if (!user || user.role !== "STUDENT") return { allow: false, reason: "not_registered" };
  if (user.status !== "ACTIVE") return { allow: false, reason: "disabled" };
  if (user.googleSub && user.googleSub !== googleSub) return { allow: false, reason: "mismatch" };
  return { allow: true, linkSub: !user.googleSub };
}

/** Only Gmail addresses may be added as students (they sign in with Google). */
export function isGmailAddress(email: string): boolean {
  return /^[^@\s]+@gmail\.com$/i.test(email.trim());
}
