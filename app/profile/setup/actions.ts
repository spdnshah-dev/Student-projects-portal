"use server";

import { redirect } from "next/navigation";
import type { CourseCompleted, Domain } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { onProfileEdited } from "@/lib/lifecycle";
import { COURSE_COMPLETED_LABELS, DOMAIN_LABELS } from "@/lib/constants";

export type FormState = { error?: string };

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
    if (!/^https:\/\/([a-z]+\.)?linkedin\.com\//i.test(linkedinRaw)) {
      return {
        error:
          "Enter a full LinkedIn URL starting with https://www.linkedin.com/",
      };
    }
    linkedinUrl = linkedinRaw;
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

  // If the profile was already Live, editing opens a new pending version and
  // moves it to Changes in review (the old version stays public). Drafts stay
  // drafts.
  await onProfileEdited(profile.id);

  redirect("/projects/new");
}
