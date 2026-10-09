import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { roleHome } from "@/lib/auth/roles";
import { loginAllowed } from "@/lib/rate-limit";

// Email + password sign-in, shared by students, admins, and the super admin.
// Permission is enforced server-side; the response only tells the client where
// to go next for the signed-in role.
export async function POST(req: Request) {
  let email = "";
  let password = "";
  try {
    const body = await req.json();
    email = String(body?.email ?? "")
      .trim()
      .toLowerCase();
    password = String(body?.password ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "Enter your email and password." },
      { status: 400 },
    );
  }

  if (!(await loginAllowed(email))) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  // One generic message for every failure, so we never reveal which emails exist.
  const invalid = NextResponse.json(
    { error: "That email and password don't match." },
    { status: 401 },
  );

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE" || !user.passwordHash) return invalid;

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return invalid;

  await createSession(user.id, user.role);
  return NextResponse.json({ redirect: roleHome(user.role) });
}
