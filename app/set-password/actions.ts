"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { roleHome } from "@/lib/auth/roles";

export type FormState = { error?: string };

/**
 * Set a password for an account an admin has already added.
 *
 * Test phase: the email verification code is skipped (built before launch). We
 * still require that the email already exists as an active account, so only
 * admin-added people can set a password.
 */
export async function setPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email) return { error: "Enter your email address." };
  if (password.length < 8) {
    return { error: "Use at least 8 characters for your password." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE") {
    return {
      error:
        "We couldn't find that email. Ask a Learnbay admin to add it first.",
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(password) },
  });
  await createSession(user.id, user.role);

  // New students go through consent → profile setup; staff go to their home.
  redirect(user.role === "STUDENT" ? "/consent" : roleHome(user.role));
}
