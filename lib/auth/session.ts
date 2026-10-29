import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { roleHome } from "@/lib/auth/roles";
import { seal, unseal } from "@/lib/auth/sealed";

/**
 * Lightweight, stateless session: a signed (HMAC-SHA256) cookie carrying the
 * user id, role, and expiry. Permission is always re-checked on the server via
 * the guards below (getCurrentUser / requireUser / requireRole), which also
 * re-load the user so a disabled account loses access immediately.
 *
 * These helpers run only on the server (route handlers and server components).
 */

const COOKIE = "lb_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

type Payload = { sub: string; role: Role; exp: number };

function sign(payload: Payload): string {
  return seal(payload);
}

function verify(token: string): Payload | null {
  const payload = unseal<Payload>(token);
  if (!payload || !payload.exp || payload.exp * 1000 < Date.now()) return null;
  return payload;
}

export async function createSession(userId: string, role: Role): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const store = await cookies();
  store.set(COOKIE, sign({ sub: userId, role, exp }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/** The signed-in user, or null. Re-loads from the DB and rejects disabled accounts. */
export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const payload = verify(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.status !== "ACTIVE") return null;
  return user;
}

/** Require any signed-in user; otherwise redirect to the login page. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Require one of the given roles. A signed-in user with the wrong role is sent
 * to their own home rather than the login page.
 */
export async function requireRole(roles: Role | Role[]): Promise<User> {
  const user = await requireUser();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(user.role)) redirect(roleHome(user.role));
  return user;
}
