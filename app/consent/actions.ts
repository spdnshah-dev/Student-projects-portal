"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { formAllowed } from "@/lib/rate-limit";

export type FormState = { error?: string };

/**
 * Placeholder consent. Not legally binding — it only records that the step was
 * taken and ensures a draft profile exists before profile setup. The real,
 * lawyer-reviewed consent form replaces this before launch.
 */
export async function acceptConsentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("STUDENT");
  if (!(await formAllowed())) {
    return { error: "You're doing that too fast — please wait a moment." };
  }

  const agree1 = formData.get("agree1") != null;
  const agree2 = formData.get("agree2") != null;
  if (!agree1 || !agree2) {
    return { error: "Please tick both boxes to continue." };
  }

  const existing = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });
  if (existing) {
    await prisma.studentProfile.update({
      where: { id: existing.id },
      data: { consentAt: new Date() },
    });
  } else {
    await prisma.studentProfile.create({
      data: { userId: user.id, consentAt: new Date(), state: "DRAFT" },
    });
  }

  redirect("/profile/setup");
}
