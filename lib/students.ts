import type { Course, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SUPER_ADMIN_EMAIL } from "@/lib/constants";
import { formatStudentId } from "@/lib/student-id";

/**
 * Adding a student: one code path shared by the admin Students page and the
 * super admin's people page. Creates the account and allocates the Student ID
 * in a single transaction.
 */

export type NewStudent = {
  email: string; // already trimmed + lower-cased by the caller
  name: string | null;
  course: Course;
  batchStartDate: Date; // UTC midnight (see parseBatchDate)
};

export type CreateStudentResult =
  | { ok: true; userId: string; studentId: string }
  | { ok: false; error: string };

/**
 * Atomically take the next counter for a course + batch. INSERT ... ON CONFLICT
 * is a single statement, so two concurrent adds in the same batch get
 * different numbers; the UNIQUE index on users.student_id is the final guard.
 */
export async function nextStudentCounter(
  tx: Prisma.TransactionClient,
  course: Course,
  batchStartDate: Date,
): Promise<number> {
  const rows = await tx.$queryRaw<{ last_counter: number }[]>`
    INSERT INTO "student_id_sequences" ("course", "batch_start_date", "last_counter")
    VALUES (${course}::"Course", ${batchStartDate}::date, 1)
    ON CONFLICT ("course", "batch_start_date")
    DO UPDATE SET "last_counter" = "student_id_sequences"."last_counter" + 1
    RETURNING "last_counter"`;
  return Number(rows[0].last_counter);
}

export async function createStudent(
  input: NewStudent,
  actor: { id: string; role: Role },
): Promise<CreateStudentResult> {
  if (!input.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (input.email === SUPER_ADMIN_EMAIL) {
    return { ok: false, error: "That email is reserved for the super admin." };
  }

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) return { ok: false, error: "That email already has an account." };

  const created = await prisma.$transaction(async (tx) => {
    const counter = await nextStudentCounter(tx, input.course, input.batchStartDate);
    const studentId = formatStudentId(input.course, input.batchStartDate, counter);
    const user = await tx.user.create({
      data: {
        email: input.email,
        name: input.name,
        role: "STUDENT",
        status: "ACTIVE",
        studentId,
        course: input.course,
        batchStartDate: input.batchStartDate,
      },
    });
    // A regular admin who adds a student should be able to review them, so the
    // new student is assigned to that admin. The super admin sees everyone.
    if (actor.role === "ADMIN") {
      await tx.adminAssignment.create({
        data: { adminId: actor.id, studentId: user.id },
      });
    }
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: "USER_ADD",
        target: user.id,
        detail: {
          email: input.email,
          role: "STUDENT",
          studentId,
          course: input.course,
          batchStartDate: input.batchStartDate.toISOString().slice(0, 10),
        },
      },
    });
    return { userId: user.id, studentId };
  });

  return { ok: true, ...created };
}

export type AssignStudentIdResult =
  | { ok: true; studentId: string }
  | { ok: false; error: string };

/**
 * Give an existing student (one added before Student IDs existed) their course,
 * batch and generated ID. Refuses to change a student who already has an ID,
 * since the ID encodes the course and batch and is the student's public
 * identity.
 */
export async function assignStudentId(
  userId: string,
  course: Course,
  batchStartDate: Date,
  actor: { id: string },
): Promise<AssignStudentIdResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "STUDENT") {
    return { ok: false, error: "That student was not found." };
  }
  if (user.studentId) {
    return { ok: false, error: `This student already has the ID ${user.studentId}.` };
  }

  const studentId = await prisma.$transaction(async (tx) => {
    const counter = await nextStudentCounter(tx, course, batchStartDate);
    const id = formatStudentId(course, batchStartDate, counter);
    await tx.user.update({
      where: { id: userId },
      data: { studentId: id, course, batchStartDate },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: "STUDENT_ID_ASSIGN",
        target: userId,
        detail: {
          studentId: id,
          course,
          batchStartDate: batchStartDate.toISOString().slice(0, 10),
        },
      },
    });
    return id;
  });
  return { ok: true, studentId };
}
