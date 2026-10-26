"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { CourseCompleted, Domain } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { onProfileEdited, submitProfileForReview } from "@/lib/lifecycle";
import { canApply } from "@/lib/lifecycle-rules";
import { processCertificateFile } from "@/lib/certificates";
import { processProfilePhoto } from "@/lib/photo";
import { friendlyUploadError } from "@/lib/upload-errors";
import {
  deleteObject,
  storageConfigured,
  StorageNotConfiguredError,
} from "@/lib/storage";
import { formAllowed } from "@/lib/rate-limit";
import { COURSE_COMPLETED_LABELS, DOMAIN_LABELS } from "@/lib/constants";

export type FormState = { error?: string; ok?: boolean };

const TOO_FAST = "You're doing that too fast — please wait a moment.";
const STORAGE_OFF =
  "File storage isn't set up yet. Ask an admin to connect Vercel Blob (BLOB_READ_WRITE_TOKEN).";

function asEnum<T extends string>(
  value: FormDataEntryValue | null,
  allowed: Record<string, unknown>,
): T | null {
  const s = String(value ?? "");
  return s && s in allowed ? (s as T) : null;
}

export async function saveProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("STUDENT");
  if (!(await formAllowed())) return { error: TOO_FAST };
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) redirect("/consent");

  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName) return { error: "Enter your full name." };

  const headline = String(formData.get("headline") ?? "").trim() || null;
  const about = String(formData.get("about") ?? "").trim() || null;

  const yearsRaw = String(formData.get("yearsExperience") ?? "").trim();
  let yearsExperience: number | null = null;
  if (yearsRaw !== "") {
    const n = Number(yearsRaw);
    if (!Number.isInteger(n) || n < 0 || n > 70) {
      return {
        error: "Years of experience must be a whole number between 0 and 70.",
      };
    }
    yearsExperience = n;
  }

  const domain = asEnum<Domain>(formData.get("domain"), DOMAIN_LABELS);
  const courseCompleted = asEnum<CourseCompleted>(
    formData.get("courseCompleted"),
    COURSE_COMPLETED_LABELS,
  );

  const linkedinRaw = String(formData.get("linkedinUrl") ?? "").trim();
  let linkedinUrl: string | null = null;
  if (linkedinRaw !== "") {
    // Accept what people naturally paste (e.g. "linkedin.com/in/name" or
    // "www.linkedin.com/..."): upgrade http→https and add the scheme if it's
    // missing, then confirm it really is a linkedin.com address.
    let normalized = linkedinRaw.replace(/^http:\/\//i, "https://");
    if (!/^https:\/\//i.test(normalized)) normalized = `https://${normalized}`;
    if (!/^https:\/\/([a-z0-9-]+\.)*linkedin\.com\//i.test(normalized)) {
      return {
        error: "Enter a LinkedIn profile link, e.g. linkedin.com/in/your-name",
      };
    }
    linkedinUrl = normalized;
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { name: fullName } }),
    prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        headline,
        about,
        yearsExperience,
        domain,
        courseCompleted,
        linkedinUrl,
      },
    }),
  ]);

  // Saving submits the profile for admin review. From DRAFT (brand-new) or
  // CHANGES_NEEDED (an admin sent it back), that's a fresh SUBMIT into the
  // review queue. A Live or already-in-review profile goes through
  // onProfileEdited instead, which opens or updates a pending version (and, if
  // it was Live, moves it to Changes in review while the old version stays
  // public).
  if (canApply("SUBMIT", profile.state)) {
    await submitProfileForReview(profile.id);
  } else {
    await onProfileEdited(profile.id);
  }

  // A brand-new student with no project yet continues into adding their first
  // one; anyone just editing their profile goes back to their dashboard rather
  // than being forced into the project form.
  const projectCount = await prisma.project.count({
    where: { profileId: profile.id },
  });
  redirect(projectCount === 0 ? "/projects/new" : "/dashboard");
}

// --- Profile photo ---------------------------------------------------------

export async function uploadPhotoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("STUDENT");
  if (!(await formAllowed())) return { error: TOO_FAST };
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) redirect("/consent");

  const file = formData.get("photo");
  if (!(file instanceof File)) return { error: "Choose an image to upload." };
  // Bail out before doing any image work when storage isn't connected.
  if (!storageConfigured()) return { error: STORAGE_OFF };

  try {
    const processed = await processProfilePhoto(file);
    if (!processed.ok) return { error: processed.error };

    const previous = profile.photoKey;
    await prisma.studentProfile.update({
      where: { id: profile.id },
      data: { photoKey: processed.fileKey },
    });
    // Replacing a Live photo sends the profile back for re-review (same as any
    // other profile edit); a draft stays a draft until it's submitted.
    await onProfileEdited(profile.id);
    if (previous) await deleteObject(previous);

    revalidatePath("/profile/setup");
    return { ok: true };
  } catch (e) {
    if (e instanceof StorageNotConfiguredError) return { error: STORAGE_OFF };
    console.error("[photo upload] failed:", e);
    // Internal detail stays in the server log; the student gets plain English.
    return { error: friendlyUploadError(e) };
  }
}

export async function removePhotoAction(): Promise<FormState> {
  const user = await requireRole("STUDENT");
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) redirect("/consent");

  if (profile.photoKey) {
    const previous = profile.photoKey;
    await prisma.studentProfile.update({
      where: { id: profile.id },
      data: { photoKey: null },
    });
    await onProfileEdited(profile.id);
    await deleteObject(previous);
    revalidatePath("/profile/setup");
  }
  return {};
}

// --- Certificates ----------------------------------------------------------

export async function addCertificateAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("STUDENT");
  if (!(await formAllowed())) return { error: TOO_FAST };
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) redirect("/consent");

  const name = String(formData.get("name") ?? "").trim();
  const issuer = String(formData.get("issuer") ?? "").trim() || null;
  const file = formData.get("file");

  if (!name) return { error: "Give the certificate a name." };
  if (!(file instanceof File)) return { error: "Choose a file to upload." };
  // Bail out before doing any file work when storage isn't connected.
  if (!storageConfigured()) return { error: STORAGE_OFF };

  try {
    const processed = await processCertificateFile(file);
    if (!processed.ok) return { error: processed.error };

    await prisma.certificate.create({
      data: {
        profileId: profile.id,
        name,
        issuer,
        fileKey: processed.fileKey,
        fileName: processed.fileName,
      },
    });
    // Adding a certificate to a Live profile sends it back for re-review.
    await onProfileEdited(profile.id);
    revalidatePath("/profile/setup");
    return { ok: true };
  } catch (e) {
    if (e instanceof StorageNotConfiguredError) return { error: STORAGE_OFF };
    console.error("[certificate upload] failed:", e);
    // Internal detail stays in the server log; the student gets plain English.
    return { error: friendlyUploadError(e) };
  }
}

export async function removeCertificateAction(certId: string): Promise<FormState> {
  const user = await requireRole("STUDENT");
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) redirect("/consent");

  const cert = await prisma.certificate.findUnique({ where: { id: certId } });
  if (!cert || cert.profileId !== profile.id) {
    return { error: "That certificate was not found." };
  }

  if (cert.fileKey) await deleteObject(cert.fileKey);
  await prisma.certificate.delete({ where: { id: cert.id } });
  await onProfileEdited(profile.id);
  revalidatePath("/profile/setup");
  return {};
}
