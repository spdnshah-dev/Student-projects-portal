import type { Prisma, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Scoped admin access.
 *
 * A regular ADMIN may only review the students assigned to them (rows in
 * admin_assignments). The SUPER_ADMIN is never scoped — they see everyone.
 *
 * `scopedStudentIds` returns the list of student user ids an admin may touch,
 * or `null` meaning "no restriction" (super admin). The where-fragment helpers
 * turn that into a filter for each kind of query; they return `{}` (no filter)
 * when unrestricted.
 */
export async function scopedStudentIds(admin: User): Promise<string[] | null> {
  if (admin.role === "SUPER_ADMIN") return null;
  const rows = await prisma.adminAssignment.findMany({
    where: { adminId: admin.id },
    select: { studentId: true },
  });
  return rows.map((r) => r.studentId);
}

/** Filter projects down to those owned by the given student user ids. */
export function projectScope(ids: string[] | null): Prisma.ProjectWhereInput {
  return ids === null ? {} : { profile: { is: { userId: { in: ids } } } };
}

/** Filter student profiles down to the given student user ids. */
export function profileScope(
  ids: string[] | null,
): Prisma.StudentProfileWhereInput {
  return ids === null ? {} : { userId: { in: ids } };
}

/** Filter STUDENT user rows down to the given student user ids. */
export function studentUserScope(ids: string[] | null): Prisma.UserWhereInput {
  return ids === null ? {} : { id: { in: ids } };
}

/** True if the admin may access this specific student (super admin always can). */
export async function canAccessStudent(
  admin: User,
  studentUserId: string,
): Promise<boolean> {
  if (admin.role === "SUPER_ADMIN") return true;
  const row = await prisma.adminAssignment.findUnique({
    where: { adminId_studentId: { adminId: admin.id, studentId: studentUserId } },
  });
  return Boolean(row);
}
