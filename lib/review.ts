import { prisma } from "@/lib/prisma";

/**
 * Submit-for-review transitions (the portion the student flow needs).
 *
 * A submit takes a frozen snapshot of the current fields into a version
 * (review_state PENDING) and moves the item to IN_REVIEW. The public keeps
 * seeing the last approved version until an admin approves this one.
 *
 * The full state machine — edits on a published item moving it to
 * CHANGES_IN_REVIEW while the old approved version stays live, resubmit from
 * CHANGES_NEEDED, take-down / restore — is built out in the state-machine and
 * admin milestones. Here we handle the student's first submit (from DRAFT or
 * CHANGES_NEEDED).
 */

export async function submitProjectForReview(projectId: string): Promise<void> {
  const p = await prisma.project.findUnique({ where: { id: projectId } });
  if (!p) throw new Error("Project not found.");

  const snapshot = {
    title: p.title,
    description: p.description,
    category: p.category,
    toolsText: p.toolsText,
    domain: p.domain,
    liveUrl: p.liveUrl,
  };

  await prisma.$transaction([
    prisma.projectVersion.create({
      data: { projectId: p.id, snapshot, reviewState: "PENDING" },
    }),
    prisma.project.update({
      where: { id: p.id },
      data: { state: "IN_REVIEW" },
    }),
  ]);
}

export async function submitProfileForReview(profileId: string): Promise<void> {
  const p = await prisma.studentProfile.findUnique({ where: { id: profileId } });
  if (!p) throw new Error("Profile not found.");

  const snapshot = {
    headline: p.headline,
    about: p.about,
    courseCompleted: p.courseCompleted,
    yearsExperience: p.yearsExperience,
    domain: p.domain,
    linkedinUrl: p.linkedinUrl,
  };

  await prisma.$transaction([
    prisma.profileVersion.create({
      data: { profileId: p.id, snapshot, reviewState: "PENDING" },
    }),
    prisma.studentProfile.update({
      where: { id: p.id },
      data: { state: "IN_REVIEW" },
    }),
  ]);
}
