import type {
  Prisma,
  Project,
  StudentProfile,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { LifecycleError, canApply } from "@/lib/lifecycle-rules";

/**
 * Database operations for the project/profile lifecycle. Each operation checks
 * the transition is legal (lifecycle-rules), snapshots versions, keeps the
 * public pointer (approvedVersionId) correct, and records a review + audit row
 * for admin actions.
 *
 * Model: the Project / StudentProfile row holds the student's *working* copy.
 * `approvedVersionId` points at the frozen snapshot the public sees. Editing a
 * published item changes the working copy and opens a new pending version while
 * the old approved version stays public until an admin approves the new one.
 */

// ---- snapshots ------------------------------------------------------------

function snapshotProject(p: Project): Prisma.InputJsonObject {
  return {
    title: p.title,
    description: p.description,
    category: p.category,
    toolsText: p.toolsText,
    domain: p.domain,
    liveUrl: p.liveUrl,
  };
}

function snapshotProfile(p: StudentProfile): Prisma.InputJsonObject {
  return {
    headline: p.headline,
    about: p.about,
    courseCompleted: p.courseCompleted,
    yearsExperience: p.yearsExperience,
    domain: p.domain,
    linkedinUrl: p.linkedinUrl,
  };
}

// =====================================================================
// Projects
// =====================================================================

/** Student submits a draft / resubmits a sent-back project for review. */
export async function submitProjectForReview(id: string): Promise<void> {
  const p = await prisma.project.findUnique({ where: { id } });
  if (!p) throw new Error("Project not found.");
  if (!canApply("SUBMIT", p.state)) throw new LifecycleError("SUBMIT", p.state);

  await prisma.$transaction([
    prisma.projectVersion.create({
      data: { projectId: id, snapshot: snapshotProject(p), reviewState: "PENDING" },
    }),
    prisma.project.update({ where: { id }, data: { state: "IN_REVIEW" } }),
  ]);
}

/**
 * Call after a student saves edits to a project's working fields. Published
 * items open a new pending version and move to CHANGES_IN_REVIEW (old version
 * stays public); items already under review refresh their pending snapshot;
 * drafts/sent-back/unpublished just keep the saved fields.
 */
export async function onProjectEdited(id: string): Promise<void> {
  const p = await prisma.project.findUnique({ where: { id } });
  if (!p) throw new Error("Project not found.");

  if (p.state === "PUBLISHED") {
    await prisma.$transaction([
      prisma.projectVersion.create({
        data: { projectId: id, snapshot: snapshotProject(p), reviewState: "PENDING" },
      }),
      prisma.project.update({ where: { id }, data: { state: "CHANGES_IN_REVIEW" } }),
    ]);
  } else if (p.state === "IN_REVIEW" || p.state === "CHANGES_IN_REVIEW") {
    const v = await prisma.projectVersion.findFirst({
      where: { projectId: id, reviewState: "PENDING" },
      orderBy: { submittedAt: "desc" },
    });
    if (v) {
      await prisma.projectVersion.update({
        where: { id: v.id },
        data: { snapshot: snapshotProject(p), submittedAt: new Date() },
      });
    }
  }
}

export async function approveProject(
  id: string,
  adminId: string,
  note?: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const p = await tx.project.findUnique({ where: { id } });
    if (!p) throw new Error("Project not found.");
    if (!canApply("APPROVE", p.state))
      throw new LifecycleError("APPROVE", p.state);

    const version = await tx.projectVersion.findFirst({
      where: { projectId: id, reviewState: "PENDING" },
      orderBy: { submittedAt: "desc" },
    });
    if (!version) throw new Error("No pending version to approve.");

    await tx.projectVersion.update({
      where: { id: version.id },
      data: { reviewState: "APPROVED", reviewedById: adminId, reviewNote: note ?? null },
    });
    await tx.project.update({
      where: { id },
      data: { state: "PUBLISHED", approvedVersionId: version.id },
    });
    await tx.review.create({
      data: { targetType: "PROJECT", targetId: id, adminId, action: "APPROVE", note },
    });
    await tx.auditLog.create({
      data: { actorId: adminId, action: "PROJECT_APPROVE", target: id },
    });
  });
}

export async function sendBackProject(
  id: string,
  adminId: string,
  note: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const p = await tx.project.findUnique({ where: { id } });
    if (!p) throw new Error("Project not found.");
    if (!canApply("SEND_BACK", p.state))
      throw new LifecycleError("SEND_BACK", p.state);

    const version = await tx.projectVersion.findFirst({
      where: { projectId: id, reviewState: "PENDING" },
      orderBy: { submittedAt: "desc" },
    });
    if (version) {
      await tx.projectVersion.update({
        where: { id: version.id },
        data: { reviewState: "SENT_BACK", reviewedById: adminId, reviewNote: note },
      });
    }
    await tx.project.update({ where: { id }, data: { state: "CHANGES_NEEDED" } });
    await tx.review.create({
      data: { targetType: "PROJECT", targetId: id, adminId, action: "SEND_BACK", note },
    });
    await tx.auditLog.create({
      data: { actorId: adminId, action: "PROJECT_SEND_BACK", target: id },
    });
  });
}

export async function takeDownProject(
  id: string,
  adminId: string,
  note?: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const p = await tx.project.findUnique({ where: { id } });
    if (!p) throw new Error("Project not found.");
    if (!canApply("TAKE_DOWN", p.state))
      throw new LifecycleError("TAKE_DOWN", p.state);
    await tx.project.update({ where: { id }, data: { state: "UNPUBLISHED" } });
    await tx.review.create({
      data: { targetType: "PROJECT", targetId: id, adminId, action: "TAKE_DOWN", note },
    });
    await tx.auditLog.create({
      data: { actorId: adminId, action: "PROJECT_TAKE_DOWN", target: id },
    });
  });
}

export async function restoreProject(id: string, adminId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const p = await tx.project.findUnique({ where: { id } });
    if (!p) throw new Error("Project not found.");
    if (!canApply("RESTORE", p.state))
      throw new LifecycleError("RESTORE", p.state);
    await tx.project.update({ where: { id }, data: { state: "PUBLISHED" } });
    await tx.review.create({
      data: { targetType: "PROJECT", targetId: id, adminId, action: "RESTORE" },
    });
    await tx.auditLog.create({
      data: { actorId: adminId, action: "PROJECT_RESTORE", target: id },
    });
  });
}

// =====================================================================
// Profiles (same lifecycle; PUBLISHED is shown as "Live")
// =====================================================================

export async function submitProfileForReview(id: string): Promise<void> {
  const p = await prisma.studentProfile.findUnique({ where: { id } });
  if (!p) throw new Error("Profile not found.");
  if (!canApply("SUBMIT", p.state)) throw new LifecycleError("SUBMIT", p.state);

  await prisma.$transaction([
    prisma.profileVersion.create({
      data: { profileId: id, snapshot: snapshotProfile(p), reviewState: "PENDING" },
    }),
    prisma.studentProfile.update({ where: { id }, data: { state: "IN_REVIEW" } }),
  ]);
}

export async function onProfileEdited(id: string): Promise<void> {
  const p = await prisma.studentProfile.findUnique({ where: { id } });
  if (!p) throw new Error("Profile not found.");

  if (p.state === "PUBLISHED") {
    await prisma.$transaction([
      prisma.profileVersion.create({
        data: { profileId: id, snapshot: snapshotProfile(p), reviewState: "PENDING" },
      }),
      prisma.studentProfile.update({
        where: { id },
        data: { state: "CHANGES_IN_REVIEW" },
      }),
    ]);
  } else if (p.state === "IN_REVIEW" || p.state === "CHANGES_IN_REVIEW") {
    const v = await prisma.profileVersion.findFirst({
      where: { profileId: id, reviewState: "PENDING" },
      orderBy: { submittedAt: "desc" },
    });
    if (v) {
      await prisma.profileVersion.update({
        where: { id: v.id },
        data: { snapshot: snapshotProfile(p), submittedAt: new Date() },
      });
    }
  }
}

export async function approveProfile(
  id: string,
  adminId: string,
  note?: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const p = await tx.studentProfile.findUnique({ where: { id } });
    if (!p) throw new Error("Profile not found.");
    if (!canApply("APPROVE", p.state))
      throw new LifecycleError("APPROVE", p.state);

    const version = await tx.profileVersion.findFirst({
      where: { profileId: id, reviewState: "PENDING" },
      orderBy: { submittedAt: "desc" },
    });
    if (!version) throw new Error("No pending version to approve.");

    await tx.profileVersion.update({
      where: { id: version.id },
      data: { reviewState: "APPROVED", reviewedById: adminId, reviewNote: note ?? null },
    });
    await tx.studentProfile.update({
      where: { id },
      data: { state: "PUBLISHED", approvedVersionId: version.id },
    });
    await tx.review.create({
      data: { targetType: "PROFILE", targetId: id, adminId, action: "APPROVE", note },
    });
    await tx.auditLog.create({
      data: { actorId: adminId, action: "PROFILE_APPROVE", target: id },
    });
  });
}

export async function sendBackProfile(
  id: string,
  adminId: string,
  note: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const p = await tx.studentProfile.findUnique({ where: { id } });
    if (!p) throw new Error("Profile not found.");
    if (!canApply("SEND_BACK", p.state))
      throw new LifecycleError("SEND_BACK", p.state);

    const version = await tx.profileVersion.findFirst({
      where: { profileId: id, reviewState: "PENDING" },
      orderBy: { submittedAt: "desc" },
    });
    if (version) {
      await tx.profileVersion.update({
        where: { id: version.id },
        data: { reviewState: "SENT_BACK", reviewedById: adminId, reviewNote: note },
      });
    }
    await tx.studentProfile.update({
      where: { id },
      data: { state: "CHANGES_NEEDED" },
    });
    await tx.review.create({
      data: { targetType: "PROFILE", targetId: id, adminId, action: "SEND_BACK", note },
    });
    await tx.auditLog.create({
      data: { actorId: adminId, action: "PROFILE_SEND_BACK", target: id },
    });
  });
}

export async function takeDownProfile(
  id: string,
  adminId: string,
  note?: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const p = await tx.studentProfile.findUnique({ where: { id } });
    if (!p) throw new Error("Profile not found.");
    if (!canApply("TAKE_DOWN", p.state))
      throw new LifecycleError("TAKE_DOWN", p.state);
    await tx.studentProfile.update({
      where: { id },
      data: { state: "UNPUBLISHED" },
    });
    await tx.review.create({
      data: { targetType: "PROFILE", targetId: id, adminId, action: "TAKE_DOWN", note },
    });
    await tx.auditLog.create({
      data: { actorId: adminId, action: "PROFILE_TAKE_DOWN", target: id },
    });
  });
}

export async function restoreProfile(id: string, adminId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const p = await tx.studentProfile.findUnique({ where: { id } });
    if (!p) throw new Error("Profile not found.");
    if (!canApply("RESTORE", p.state))
      throw new LifecycleError("RESTORE", p.state);
    await tx.studentProfile.update({
      where: { id },
      data: { state: "PUBLISHED" },
    });
    await tx.review.create({
      data: { targetType: "PROFILE", targetId: id, adminId, action: "RESTORE" },
    });
    await tx.auditLog.create({
      data: { actorId: adminId, action: "PROFILE_RESTORE", target: id },
    });
  });
}
