import type { Course } from "@prisma/client";
import { COURSE_LABELS } from "@/lib/constants";
import { parseBatchDate } from "@/lib/student-id";
import type { NewStudent } from "@/lib/students";
import { isGmailAddress } from "@/lib/auth/student-gate";

/** Shared result type for the add-student forms (admin and super admin). */
export type AddStudentState = { ok?: true; error?: string; studentId?: string };

/**
 * Validate the add-student form fields (name, email, course, batch start
 * date). Shared by the admin Students page and the super admin's people page
 * so both produce identical accounts and IDs.
 */
export function parseStudentForm(
  formData: FormData,
): NewStudent | { error: string } {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  const courseRaw = String(formData.get("course") ?? "");
  const batchRaw = String(formData.get("batchStartDate") ?? "");

  if (!name) return { error: "Enter the student's name." };
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  // Students sign in with Google, so the address must be the Gmail they will
  // sign in with.
  if (!isGmailAddress(email)) {
    return { error: "Students sign in with Google: enter their @gmail.com address." };
  }
  if (!(courseRaw in COURSE_LABELS)) return { error: "Choose the student's course." };
  const batchStartDate = parseBatchDate(batchRaw);
  if (!batchStartDate) return { error: "Choose the batch start date." };

  return { email, name, course: courseRaw as Course, batchStartDate };
}
