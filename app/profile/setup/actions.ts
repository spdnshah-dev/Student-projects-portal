"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { CourseCompleted, Domain } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { onProfileEdited, submitProfileForReview } from "@/lib/lifecycle";
import { processCertificateFile } from "@/lib/certificates";
import { deleteObject, StorageNotConfiguredError } from "@/lib/storage";
import { formAllowed } from "@/lib/rate-limit";
import { COURSE_COMPLETED_LABELS, DOMAIN_LABELS } from "@/lib/constants";

export type FormState = { error?: string; ok?: boolean };

const TOO_FAST = "You're doing that too fast — please wait a moment.";

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

  // Completing profile setup submits the profile for admin review. A brand-new
  // profile is still a DRAFT here, so send it to the review queue — otherwise it
  // would never become Live and the student's projects could never go public.
  // An already-reviewed or Live profile goes through onProfileEdited instead
  // (which opens a new pending version, and if it was Live moves it to Changes
  // in review while the old version stays public).
  if (profile.state === "DRAFT") {
    await submitProfileForReview(profile.id);
  } else {
    await onProfileEdited(profile.id);
  }

  redirect("/projects/new");
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
    if (e instanceof StorageNotConfiguredError) {
      return {
        error:
          "File storage isn't set up yet. Ask an admin to configure BLOB_READ_WRITE_TOKEN.",
      };
    }
    return { error: "Upload failed. Please try again." };
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
