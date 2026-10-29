import type { Category, Domain, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Queries for the public portal. Everything here enforces the two visibility
 * rules by construction: only PUBLISHED items with an approved version, whose
 * student's profile is Live (PUBLISHED, approved) and whose account is ACTIVE.
 *
 * For a PUBLISHED item the working row equals its approved version (editing a
 * live item moves it to CHANGES_IN_REVIEW, which these filters exclude), so the
 * row fields are safe to show as "the last approved version".
 *
 * PRIVACY: a student's real name and email are NEVER loaded by these queries.
 * The only account field the public sees is the Student ID (PUBLIC_USER_SELECT),
 * so the name cannot appear in server-rendered HTML, RSC payloads, search
 * results, or anything else sent to the browser. Admin screens use their own
 * queries.
 */

/** The only fields of a student's account the public may see. */
export const PUBLIC_USER_SELECT = { studentId: true } as const;

const LIVE_PROFILE: Prisma.StudentProfileWhereInput = {
  state: "PUBLISHED",
  approvedVersionId: { not: null },
  user: { status: "ACTIVE" },
};

const PUBLIC_PROJECT: Prisma.ProjectWhereInput = {
  state: "PUBLISHED",
  approvedVersionId: { not: null },
  profile: LIVE_PROFILE,
};

export type ProjectFilters = {
  category?: Category;
  domain?: Domain;
  q?: string;
  sort?: "newest" | "az";
  take?: number;
};

export async function getPublishedProjects(filters: ProjectFilters = {}) {
  const where: Prisma.ProjectWhereInput = { ...PUBLIC_PROJECT };
  if (filters.category) where.category = filters.category;
  if (filters.domain) where.domain = filters.domain;
  if (filters.q && filters.q.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { toolsText: { contains: q, mode: "insensitive" } },
    ];
  }

  return prisma.project.findMany({
    where,
    orderBy:
      filters.sort === "az" ? { title: "asc" } : { updatedAt: "desc" },
    take: filters.take,
    include: { profile: { include: { user: { select: PUBLIC_USER_SELECT } } } },
  });
}

export async function countPublishedProjects(): Promise<number> {
  return prisma.project.count({ where: PUBLIC_PROJECT });
}

/**
 * Live profiles, optionally filtered. Students are searched by their public
 * Student ID and headline — never by name, which would let a visitor confirm
 * a person is enrolled by typing their name.
 */
export async function getLiveProfiles(q?: string) {
  const where: Prisma.StudentProfileWhereInput = { ...LIVE_PROFILE };
  const term = q?.trim();
  if (term) {
    where.OR = [
      { user: { studentId: { contains: term, mode: "insensitive" } } },
      { headline: { contains: term, mode: "insensitive" } },
    ];
  }
  return prisma.studentProfile.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: PUBLIC_USER_SELECT },
      _count: { select: { projects: { where: { state: "PUBLISHED" } } } },
    },
  });
}

/** A single public profile with its published projects, or null if not Live. */
export async function getPublicProfile(id: string) {
  const profile = await prisma.studentProfile.findFirst({
    where: { id, ...LIVE_PROFILE },
    include: {
      user: { select: PUBLIC_USER_SELECT },
      certificates: { orderBy: { uploadedAt: "asc" } },
      projects: {
        where: { state: "PUBLISHED", approvedVersionId: { not: null } },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
  return profile;
}

/** A single public project with its student, or null if not public. */
export async function getPublicProject(id: string) {
  return prisma.project.findFirst({
    where: { id, ...PUBLIC_PROJECT },
    include: { profile: { include: { user: { select: PUBLIC_USER_SELECT } } } },
  });
}

/** Other published projects by the same student (excluding one id). */
export async function getMoreByProfile(profileId: string, excludeId: string) {
  return prisma.project.findMany({
    where: {
      ...PUBLIC_PROJECT,
      profileId,
      id: { not: excludeId },
    },
    orderBy: { updatedAt: "desc" },
    take: 3,
  });
}

export function toolsList(toolsText: string): string[] {
  return toolsText
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
