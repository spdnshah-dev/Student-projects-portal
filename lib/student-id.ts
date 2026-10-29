import type { Course } from "@prisma/client";

/**
 * Student IDs — the student's PUBLIC identity.
 *
 * Format: ABBR-DDMMYYYY-NNN, e.g. GAAI-05012026-002 is the 2nd student in
 * "Gen AI & Agentic AI" whose batch started on 05 Jan 2026. The counter comes
 * from a per course+batch sequence that only moves forward, so IDs are never
 * reused, and `users.student_id` is UNIQUE so concurrent adds cannot collide.
 *
 * Pure helpers live here (unit-tested); the database allocation is in
 * lib/students.ts.
 */

export const COURSE_ABBREVIATIONS: Record<Course, string> = {
  DATA_SCIENCE: "DS",
  BUSINESS_ANALYTICS_AND_DATA_ANALYTICS: "BADA",
  GEN_AI_AND_AGENTIC_AI: "GAAI",
  SOFTWARE_ENGINEERING: "SDE",
  FORWARD_DEPLOYED_ENGINEERING: "FDE",
  CLOUD_AND_DEVOPS: "CD",
  APPLIED_AI_PRACTITIONER: "AAP",
};

/** DDMMYYYY from a date, using its UTC calendar day (batch dates are plain dates). */
export function formatBatchDate(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getUTCFullYear());
  return `${dd}${mm}${yyyy}`;
}

/** Build a Student ID from its three parts. */
export function formatStudentId(
  course: Course,
  batchStartDate: Date,
  counter: number,
): string {
  if (!Number.isInteger(counter) || counter < 1) {
    throw new Error("Student ID counter must be a positive integer.");
  }
  return `${COURSE_ABBREVIATIONS[course]}-${formatBatchDate(batchStartDate)}-${String(counter).padStart(3, "0")}`;
}

/**
 * Parse a "YYYY-MM-DD" value from an <input type="date"> into a UTC-midnight
 * Date, or null when it is not a real calendar date.
 */
export function parseBatchDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== mo - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date;
}

/**
 * How a student is named everywhere outside the admin area: their Student ID.
 * A student who has not been given an ID yet (legacy account) is just
 * "Student" — the real name is never used as a fallback.
 */
export function publicStudentLabel(studentId: string | null | undefined): string {
  return studentId && studentId.trim() ? studentId : "Student";
}
