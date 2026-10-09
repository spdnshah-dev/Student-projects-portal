import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ItemStatus } from "@/components/admin/ItemStatus";
import { ReviewActionBar } from "@/components/admin/ReviewActionBar";
import { initials, avatarClasses } from "@/lib/initials";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { COURSE_COMPLETED_LABELS, DOMAIN_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Review a profile" };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs font-bold uppercase tracking-wider text-brand-muted">
        {label}
      </div>
      <div className="text-sm text-brand-ink-soft">{children || "—"}</div>
    </div>
  );
}

export default async function ProfileReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(ADMIN_ROLES);
  const { id } = await params;

  const profile = await prisma.studentProfile.findUnique({
    where: { id },
    include: {
      user: true,
      projects: { orderBy: { createdAt: "desc" } },
      certificates: { orderBy: { uploadedAt: "asc" } },
    },
  });
  if (!profile) notFound();

  const name = profile.user.name ?? profile.user.email;
  const firstName = name.split(" ")[0];
  const awaiting =
    profile.state === "IN_REVIEW" || profile.state === "CHANGES_IN_REVIEW";
  const publishedProjects = profile.projects.filter((p) => p.state === "PUBLISHED");

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      <AdminHeader user={user} active="profiles" />

      <main className="mx-auto flex w-full max-w-shell flex-grow flex-col gap-4 px-8 py-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-grow flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/profiles" className="font-semibold text-brand-ink no-underline">
              ← Profiles
            </Link>
            <span className="h-6 w-px bg-line-strong" />
            <h1 className="m-0 text-xl font-bold tracking-tight">{name}</h1>
            <ItemStatus state={profile.state} kind="profile" />
          </div>

          <div className="flex items-center gap-4 rounded-card border border-line bg-white p-5 shadow-card">
            <span className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold ${avatarClasses(name)}`}>
              {initials(name)}
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-bold">{name}</span>
              <span className="text-[13px] text-brand-muted">{profile.user.email}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-card border border-line bg-white p-5 shadow-card sm:grid-cols-2">
            <Row label="Headline">{profile.headline}</Row>
            <Row label="Years of experience">
              {profile.yearsExperience != null ? String(profile.yearsExperience) : ""}
            </Row>
            <Row label="Domain">{profile.domain ? DOMAIN_LABELS[profile.domain] : ""}</Row>
            <Row label="Course completed">
              {profile.courseCompleted ? COURSE_COMPLETED_LABELS[profile.courseCompleted] : ""}
            </Row>
            <Row label="LinkedIn">
              {profile.linkedinUrl ? (
                <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-accent no-underline">
                  {profile.linkedinUrl}
                </a>
              ) : (
                ""
              )}
            </Row>
            <div className="sm:col-span-2">
              <Row label="About">
                <span className="whitespace-pre-line text-pretty">{profile.about}</span>
              </Row>
            </div>
          </div>

          {profile.certificates.length > 0 && (
            <div className="rounded-card border border-line bg-white p-5 shadow-card">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                Certificates ({profile.certificates.length})
              </div>
              <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
                {profile.certificates.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold">{c.name}</span>
                      {c.issuer && (
                        <span className="truncate text-[13px] text-brand-muted">
                          {c.issuer}
                        </span>
                      )}
                    </span>
                    {c.fileKey && (
                      <a
                        href={c.fileKey}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 text-[13px] font-semibold text-brand-accent no-underline"
                      >
                        View
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-card border border-line bg-white p-5 shadow-card">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-muted">
              Projects ({publishedProjects.length} published of {profile.projects.length})
            </div>
            {profile.projects.length === 0 ? (
              <p className="m-0 mt-2 text-sm text-brand-muted">No projects yet.</p>
            ) : (
              <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
                {profile.projects.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3">
                    <span className="truncate font-semibold">{p.title}</span>
                    <ItemStatus state={p.state} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="flex w-full flex-shrink-0 flex-col overflow-hidden rounded-card border border-line bg-white shadow-card lg:w-[360px]">
          <div className="flex flex-col gap-2.5 p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-muted">
              Before you publish
            </div>
            <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-sm text-brand-ink-soft">
              <li>The headline and About read well and are the student&apos;s own words.</li>
              <li>Nothing private or inappropriate is shown.</li>
              <li>Publishing makes the profile Live so published projects appear in public.</li>
            </ul>
          </div>
          {awaiting ? (
            <ReviewActionBar
              targetType="PROFILE"
              id={profile.id}
              backHref="/admin/profiles"
              approveLabel="Publish profile"
              subjectName={firstName}
            />
          ) : (
            <div className="border-t border-line bg-surface-canvas p-5 text-[13px] text-brand-muted">
              This profile isn&apos;t waiting for review (it&apos;s{" "}
              {profile.state === "PUBLISHED"
                ? "Live"
                : profile.state === "CHANGES_NEEDED"
                  ? "with the student after a send-back"
                  : profile.state.toLowerCase()}
              ).
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
