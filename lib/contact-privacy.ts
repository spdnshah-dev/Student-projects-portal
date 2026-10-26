import type { Role } from "@prisma/client";

/**
 * Recruiter-only contact rule.
 *
 * A student's LinkedIn URL (and other private contact fields such as email)
 * may only ever reach a signed-in RECRUITER. The rule is enforced on the
 * server: public queries never load these fields (see lib/public.ts), and the
 * only way to obtain the URL is the authorized endpoint, which decides with
 * `linkedInLookupStatus` using the server-side session — never a client flag.
 *
 * Kept pure (no Prisma imports) so it is unit-tested.
 */

export type Viewer = { role: Role } | null | undefined;

/** Only a signed-in recruiter may see private contact details. */
export function canRevealContact(viewer: Viewer): boolean {
  return viewer?.role === "RECRUITER";
}

type WithContact = {
  linkedinUrl?: string | null;
  user?: { email?: string | null; [k: string]: unknown } | null;
};

/**
 * Return a copy of a student payload with private contact fields removed
 * unless the viewer is a recruiter. Safe to apply to any object that might be
 * serialized to the browser.
 */
export function stripPrivateContact<T extends WithContact>(
  payload: T,
  viewer: Viewer,
): Omit<T, "linkedinUrl"> & { linkedinUrl?: string | null } {
  if (canRevealContact(viewer)) return { ...payload };
  const { linkedinUrl: _dropped, user, ...rest } = payload;
  void _dropped;
  if (user && typeof user === "object") {
    const { email: _email, ...userRest } = user;
    void _email;
    return { ...rest, user: userRest } as Omit<T, "linkedinUrl">;
  }
  return rest as Omit<T, "linkedinUrl">;
}

/**
 * HTTP status for the LinkedIn lookup endpoint. 404 (not 403) for everyone
 * who is not a recruiter, so the endpoint never confirms whether a URL exists.
 * Also 404 when a recruiter asks for a student who has no URL.
 */
export function linkedInLookupStatus(
  viewer: Viewer,
  url: string | null | undefined,
): 200 | 404 {
  if (!canRevealContact(viewer)) return 404;
  return url && url.trim() ? 200 : 404;
}
