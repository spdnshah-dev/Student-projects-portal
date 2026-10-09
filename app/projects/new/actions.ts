"use server";

import { redirect } from "next/navigation";
import type { Category, Domain } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { CATEGORY_LABELS, DOMAIN_LABELS } from "@/lib/constants";
import { submitProjectForReview } from "@/lib/lifecycle";
import { formAllowed } from "@/lib/rate-limit";

export type FormState = { error?: string };

function asEnum<T extends string>(
  value: FormDataEntryValue | null,
  allowed: Record<string, unknown>,
): T | null {
  const s = String(value ?? "");
  return s && s in allowed ? (s as T) : null;
}

export async function saveProjectAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("STUDENT");
  if (!(await formAllowed())) {
    return { error: "You're doing that too fast — please wait a moment." };
  }
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) redirect("/consent");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const toolsText = String(formData.get("toolsText") ?? "").trim();
  const liveUrl = String(formData.get("liveUrl") ?? "").trim();
  const category = asEnum<Category>(formData.get("category"), CATEGORY_LABELS);
  const domain = asEnum<Domain>(formData.get("domain"), DOMAIN_LABELS);
  const submit = formData.get("intent") === "submit";

  if (!title) return { error: "Enter a project name." };
  if (!category) return { error: "Choose a category." };
  if (!domain) return { error: "Choose a domain." };
  if (!description) return { error: "Add a description of your project." };
  if (!liveUrl) return { error: "Add your live project link." };

  // Basic https check now; the full SSRF-safe validation runs in the link
  // checker milestone.
  try {
    const u = new URL(liveUrl);
    if (u.protocol !== "https:") {
      return { error: "The live link must start with https://" };
    }
  } catch {
    return { error: "Enter a valid link, starting with https://" };
  }

  const project = await prisma.project.create({
    data: {
      profileId: profile.id,
      title,
      description,
      category,
      domain,
      toolsText,
      liveUrl,
      state: "DRAFT",
    },
  });

  if (submit) await submitProjectForReview(project.id);

  redirect("/dashboard");
}
