"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { SUPER_ADMIN_EMAIL } from "@/lib/constants";
import { revokeFilesForUser } from "@/lib/revoke-files";
import { assignStudentId, createStudent } from "@/lib/students";
import { COURSE_LABELS } from "@/lib/constants";
import { parseBatchDate } from "@/lib/student-id";
import type { Course } from "@prisma/client";
import { parseStudentForm } from "@/lib/student-form";

export type ActionResult = { ok?: true; error?: string; studentId?: string };

/**
 * Add an admin by email, or a student (name, email, course, batch start date —
 * the Student ID is generated). They set a password via /set-password.
 */
export async function addUserAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireRole("SUPER_ADMIN");

  const roleRaw = String(formData.get("role") ?? "");
  if (roleRaw === "STUDENT") {
    const parsed = parseStudentForm(formData);
    if ("error" in parsed) return { error: parsed.error };
    const result = await createStudent(parsed, admin);
    if (!result.ok) return { error: result.error };
    revalidatePath("/super/people");
    revalidatePath("/admin/students");
    return { ok: true, studentId: result.studentId };
  }
  if (roleRaw !== "ADMIN") return { error: "Choose a role (student or admin)." };

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (email === SUPER_ADMIN_EMAIL) {
    return { error: "That email is reserved for the super admin." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "That email already has an account." };

  const created = await prisma.user.create({
    data: { email, name, role: "ADMIN", status: "ACTIVE" },
  });
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "USER_ADD",
      target: created.id,
      detail: { email, role: "ADMIN" },
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
  // Disabling a student also revokes their uploaded files: the photo and
  // certificate objects are deleted from storage and the references cleared,
  // so a previously shared public file link stops working. Re-enabling the
  // account does not bring the files back; the student re-uploads them.
  if (disable && target.role === "STUDENT") {
    await revokeFilesForUser(userId);
  }
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

/**
 * Give a student who was added before Student IDs existed their course, batch
 * and generated ID. Only the super admin can do this; students who already
 * have an ID are refused.
 */
export async function assignStudentIdAction(
  userId: string,
  courseRaw: string,
  batchRaw: string,
): Promise<ActionResult> {
  const admin = await requireRole("SUPER_ADMIN");
  if (!(courseRaw in COURSE_LABELS)) return { error: "Choose the student's course." };
  const batchStartDate = parseBatchDate(batchRaw);
  if (!batchStartDate) return { error: "Choose the batch start date." };

  const result = await assignStudentId(userId, courseRaw as Course, batchStartDate, admin);
  if (!result.ok) return { error: result.error };

  revalidatePath("/super/people");
  revalidatePath("/admin/students");
  return { ok: true, studentId: result.studentId };
}
