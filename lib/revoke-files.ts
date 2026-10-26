import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/storage";

/**
 * Revoke a student's uploaded files (profile photo + certificate files).
 *
 * Public blob URLs cannot be made private after the fact, so revoking means
 * deleting the objects and clearing the references. Used when a profile is
 * taken down (UNPUBLISHED) or the account is disabled. If the profile is
 * later restored, the student simply re-uploads; the certificate records
 * (name / issuer) are kept so they know what to re-upload.
 */
export async function revokeProfileFiles(profileId: string): Promise<void> {
  const profile = await prisma.studentProfile.findUnique({
    where: { id: profileId },
    include: { certificates: { select: { fileKey: true } } },
  });
  if (!profile) return;

  const urls = [profile.photoKey, ...profile.certificates.map((c) => c.fileKey)]
    .filter((u): u is string => Boolean(u));

  await prisma.$transaction([
    prisma.studentProfile.update({ where: { id: profileId }, data: { photoKey: null } }),
    prisma.certificate.updateMany({ where: { profileId }, data: { fileKey: null } }),
  ]);

  // Best effort: a missing object is fine (deleteObject swallows that).
  await Promise.all(urls.map((u) => deleteObject(u)));
}

/** Revoke by account: used when a student account is disabled. */
export async function revokeFilesForUser(userId: string): Promise<void> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (profile) await revokeProfileFiles(profile.id);
}
