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
  // One email maps to exactly one role, fixed at creation.
  const role: Role | null =
    roleRaw === "ADMIN" || roleRaw === "STUDENT" || roleRaw === "RECRUITER"
      ? roleRaw
      : null;

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (!role) return { error: "Choose a role (student, admin or recruiter)." };
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

/**
 * Replace the set of students a regular admin may review. Passing an empty list
 * removes all of that admin's access. Only the super admin can do this.
 */
export async function setAdminAssignmentsAction(
  adminId: string,
  studentIds: string[],
): Promise<ActionResult> {
  const actor = await requireRole("SUPER_ADMIN");

  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin || admin.role !== "ADMIN") {
    return { error: "That admin was not found." };
  }

  // Keep only ids that are genuine students.
  const students = await prisma.user.findMany({
    where: { id: { in: studentIds }, role: "STUDENT" },
    select: { id: true },
  });
  const validIds = students.map((s) => s.id);

  await prisma.$transaction([
    prisma.adminAssignment.deleteMany({ where: { adminId } }),
    ...(validIds.length
      ? [
          prisma.adminAssignment.createMany({
            data: validIds.map((studentId) => ({ adminId, studentId })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "ADMIN_ASSIGN",
      target: adminId,
      detail: { studentIds: validIds },
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
