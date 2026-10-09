import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ItemStatus } from "@/components/admin/ItemStatus";
import { ReviewActionBar } from "@/components/admin/ReviewActionBar";
import { TakeDownButton } from "@/components/admin/TakeDownButton";
import { initials, avatarClasses } from "@/lib/initials";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import {
  CATEGORY_LABELS,
  COURSE_COMPLETED_LABELS,
  DOMAIN_LABELS,
} from "@/lib/constants";
import { timeAgo } from "@/lib/time";

export const metadata: Metadata = { title: "Review a project" };

export default async function ProjectReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(ADMIN_ROLES);
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { profile: { include: { user: true } } },
  });
  if (!project) notFound();

  const student = project.profile.user;
  const studentName = student.name ?? student.email;
  const firstName = studentName.split(" ")[0];
  const tools = project.toolsText
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const awaiting =
    project.state === "IN_REVIEW" || project.state === "CHANGES_IN_REVIEW";

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      <AdminHeader user={user} active="queue" />

      <main className="mx-auto flex w-full max-w-shell flex-grow flex-col gap-4 px-8 py-6 lg:flex-row lg:items-start">
        {/* Left: the project */}
        <div className="flex min-w-0 flex-grow flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/queue"
              className="font-semibold text-brand-ink no-underline"
            >
              ← Review queue
            </Link>
            <span className="h-6 w-px bg-line-strong" />
            <h1 className="m-0 text-xl font-bold tracking-tight">
              {project.title}
            </h1>
            <ItemStatus state={project.state} />
            <span className="text-[13px] text-brand-muted">
              Submitted {timeAgo(project.updatedAt)} ago
            </span>
          </div>

          <div className="flex flex-col gap-3.5 rounded-card border border-line bg-white p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                Live project link
              </div>
              <div className="text-[13px] text-brand-muted">
                Hosted by the student, outside Learnbay
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[10px] border border-line bg-surface-canvas px-3 py-2.5">
              <span className="min-w-0 flex-grow truncate font-mono text-sm font-semibold">
                {project.liveUrl}
              </span>
            </div>
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[46px] w-fit items-center gap-2.5 rounded-[23px] bg-brand-accent px-6 text-[15px] font-bold text-white no-underline"
            >
              Open project in a new tab
              <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" className="fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11.5 4h4.5v4.5M16 4l-6.5 6.5M14 11.5V16H4V6h4.5" />
              </svg>
            </a>
            <p className="m-0 text-[13px] text-brand-muted">
              Try the project before you decide. Learnbay does not keep a copy of
              it.
            </p>
          </div>

          <div className="text-xs font-bold uppercase tracking-wider text-brand-muted">
            Project page, as visitors will see it
          </div>
          <div className="flex flex-col gap-3.5 rounded-2xl bg-gradient-to-br from-night-from to-night-to p-7 text-white shadow-feature">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-pill bg-white/15 px-2.5 py-1 text-xs font-semibold">
                {CATEGORY_LABELS[project.category]}
              </span>
              <span className="rounded-pill bg-white/15 px-2.5 py-1 text-xs font-semibold">
                {DOMAIN_LABELS[project.domain]}
              </span>
            </div>
            <h2 className="m-0 text-[26px] font-bold leading-tight tracking-tight">
              {project.title}
            </h2>
            <p className="m-0 max-w-[720px] leading-relaxed text-[#D5DCEA] text-pretty">
              {project.description}
            </p>
            {tools.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#A9B4C8]">
                  Tools and frameworks
                </div>
                <div className="flex flex-wrap gap-2">
                  {tools.map((t) => (
                    <span key={t} className="rounded-pill bg-white/15 px-2.5 py-1 text-xs font-semibold">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: review sidebar */}
        <aside className="flex w-full flex-shrink-0 flex-col overflow-hidden rounded-card border border-line bg-white shadow-card lg:w-[400px]">
          <div className="flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                Student
              </div>
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${avatarClasses(studentName)}`}>
                  {initials(studentName)}
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="font-bold">{studentName}</span>
                  <span className="text-[13px] text-brand-muted">
                    {[
                      project.profile.yearsExperience != null
                        ? `${project.profile.yearsExperience} yrs`
                        : null,
                      project.profile.domain ? DOMAIN_LABELS[project.profile.domain] : null,
                      project.profile.courseCompleted
                        ? COURSE_COMPLETED_LABELS[project.profile.courseCompleted]
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
              </div>
            </div>

            <div className="h-px bg-line" />

            <div className="flex flex-col gap-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                Automatic checks on the link
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <span className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-state-published">
                  <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" className="fill-none stroke-white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg>
                </span>
                The link starts with https://
              </div>
              <p className="m-0 text-[13px] text-brand-muted">
                The live reachability check runs with the link-checker milestone.
                Open the project above to try it now.
              </p>
            </div>

            <div className="h-px bg-line" />

            <div className="flex flex-col gap-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                Before you publish
              </div>
              <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-sm text-brand-ink-soft">
                <li>Open the live project and confirm it works.</li>
                <li>The name, description and tools match what it does.</li>
                <li>Nothing private or inappropriate is shown.</li>
              </ul>
            </div>
          </div>

          {awaiting ? (
            <ReviewActionBar
              targetType="PROJECT"
              id={project.id}
              backHref="/admin/queue"
              approveLabel="Publish project"
              subjectName={firstName}
            />
          ) : project.state === "PUBLISHED" ? (
            <TakeDownButton id={project.id} backHref="/admin/queue?tab=published" />
          ) : (
            <div className="border-t border-line bg-surface-canvas p-5 text-[13px] text-brand-muted">
              This project isn&apos;t waiting for review (it&apos;s{" "}
              {project.state === "CHANGES_NEEDED"
                ? "with the student after a send-back"
                : project.state.toLowerCase()}
              ).
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
