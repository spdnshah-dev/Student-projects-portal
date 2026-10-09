"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { SUPER_ADMIN_EMAIL } from "@/lib/constants";

export type ActionResult = { ok?: true; error?: string };

/** Add a student or admin by email. They set a password via /set-password. */
export async function addUserAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireRole("SUPER_ADMIN");

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  const roleRaw = String(formData.get("role") ?? "");
  const role: Role | null =
    roleRaw === "ADMIN" || roleRaw === "STUDENT" ? roleRaw : null;

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (!role) return { error: "Choose a role (student or admin)." };
  if (email === SUPER_ADMIN_EMAIL) {
    return { error: "That email is reserved for the super admin." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "That email already has an account." };

  const created = await prisma.user.create({
    data: { email, name, role, status: "ACTIVE" },
  });
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "USER_ADD",
      target: created.id,
      detail: { email, role },
    },
  });

  revalidatePath("/super/people");
  return { ok: true };
}

export async function setUserStatusAction(
  userId: string,
  disable: boolean,
): Promise<ActionResult> {
  const admin = await requireRole("SUPER_ADMIN");

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "That account was not found." };
  if (target.role === "SUPER_ADMIN" || target.email === SUPER_ADMIN_EMAIL) {
    return { error: "The super admin account can't be disabled." };
  }
  if (target.id === admin.id) {
    return { error: "You can't disable your own account." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: disable ? "DISABLED" : "ACTIVE" },
  });
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: disable ? "USER_DISABLE" : "USER_ENABLE",
      target: userId,
      detail: { email: target.email },
    },
  });

  revalidatePath("/super/people");
  return { ok: true };
}
