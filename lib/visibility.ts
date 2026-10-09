import type {
  Category,
  CourseCompleted,
  Domain,
  Prisma,
} from "@prisma/client";

/**
 * The two public-visibility rules (StateMachine board):
 *   1. The public only ever sees the last approved version.
 *   2. A project is public only if the project is Published AND its student's
 *      profile is Live (PUBLISHED) AND the account is active. Disabling a
 *      student therefore hides all their projects automatically — no per-item
 *      state change needed.
 */

type ProfileVisible = {
  state: string;
  approvedVersionId: string | null;
};
type ProjectVisible = {
  state: string;
  approvedVersionId: string | null;
};
type AccountVisible = { status: string };

export function isProfileLive(
  profile: ProfileVisible,
  account: AccountVisible,
): boolean {
  return (
    account.status === "ACTIVE" &&
    profile.state === "PUBLISHED" &&
    profile.approvedVersionId != null
  );
}

export function isProjectPublic(
  project: ProjectVisible,
  profile: ProfileVisible,
  account: AccountVisible,
): boolean {
  return (
    isProfileLive(profile, account) &&
    project.state === "PUBLISHED" &&
    project.approvedVersionId != null
  );
}

// ---- typed readers for the approved snapshots the public sees -------------

export type ProjectSnapshot = {
  title: string;
  description: string;
  category: Category;
  toolsText: string;
  domain: Domain;
  liveUrl: string;
};

export type ProfileSnapshot = {
  headline: string | null;
  about: string | null;
  courseCompleted: CourseCompleted | null;
  yearsExperience: number | null;
  domain: Domain | null;
  linkedinUrl: string | null;
};

// Snapshots are written by lib/lifecycle, so their shape is controlled by us.
export function asProjectSnapshot(json: Prisma.JsonValue): ProjectSnapshot {
  return json as unknown as ProjectSnapshot;
}

export function asProfileSnapshot(json: Prisma.JsonValue): ProfileSnapshot {
  return json as unknown as ProfileSnapshot;
}
