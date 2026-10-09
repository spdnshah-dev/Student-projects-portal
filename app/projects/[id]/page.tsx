import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { OpenProjectDialog } from "@/components/public/OpenProjectDialog";
import { ShareButton } from "@/components/public/ShareButton";
import { initials, avatarClasses } from "@/lib/initials";
import {
  CATEGORY_LABELS,
  COURSE_COMPLETED_LABELS,
  DOMAIN_LABELS,
} from "@/lib/constants";
import { getMoreByProfile, getPublicProject, toolsList } from "@/lib/public";

// Renders live data from the database on each request.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await getPublicProject(id);
  if (!project) return { title: "Project not found" };
  return { title: project.title, description: project.description };
}

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getPublicProject(id);
  if (!project) notFound();

  const profile = project.profile;
  const name = profile.user.name ?? "Student";
  const tools = toolsList(project.toolsText);
  const more = await getMoreByProfile(project.profileId, project.id);

  const studentLine = [
    profile.courseCompleted ? COURSE_COMPLETED_LABELS[profile.courseCompleted] : null,
    profile.yearsExperience != null && profile.domain
      ? `${profile.yearsExperience} years in ${DOMAIN_LABELS[profile.domain]}`
      : profile.domain
        ? DOMAIN_LABELS[profile.domain]
        : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      {/* Learnbay bar — only on the project page, never inside the student's site */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-white px-5 py-2.5">
        <Link
          href={`/students/${project.profileId}`}
          className="flex h-9 items-center gap-1.5 rounded-field px-2 font-semibold text-brand-ink no-underline"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 10H4M9 5l-5 5 5 5" />
          </svg>
          Profile
        </Link>
        <div className="flex min-w-0 flex-grow items-center gap-3">
          <span className={`flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarClasses(name)}`}>
            {initials(name)}
          </span>
          <div className="flex min-w-0 flex-col">
            <Link href={`/students/${project.profileId}`} className="font-bold text-brand-ink no-underline">
              {name}
            </Link>
            {studentLine && (
              <span className="truncate text-[13px] text-brand-muted">{studentLine}</span>
            )}
          </div>
          {profile.linkedinUrl && (
            <a
              href={profile.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 flex h-[38px] items-center gap-2 rounded-pill border-[1.5px] border-[#0A66C2] bg-white px-3 font-semibold text-[#0A66C2] no-underline"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded bg-[#0A66C2] text-xs font-bold text-white">
                in
              </span>
              LinkedIn
            </a>
          )}
        </div>
        <ShareButton />
      </div>

      <main className="mx-auto flex w-full max-w-shell flex-grow flex-col gap-6 px-6 py-7">
        {/* Hero */}
        <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-night-from to-night-to p-8 text-white shadow-feature">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-pill bg-white/15 px-2.5 py-1 text-xs font-semibold">
              {CATEGORY_LABELS[project.category]}
            </span>
            <span className="rounded-pill bg-white/15 px-2.5 py-1 text-xs font-semibold">
              {DOMAIN_LABELS[project.domain]}
            </span>
          </div>
          <h1 className="m-0 text-[30px] font-bold leading-tight tracking-tight">
            {project.title}
          </h1>
          <p className="m-0 max-w-[760px] leading-relaxed text-[#D5DCEA] text-pretty">
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
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <OpenProjectDialog
              projectId={project.id}
              liveUrl={project.liveUrl}
              title={project.title}
              description={project.description}
              studentName={name}
              studentMeta={
                profile.courseCompleted
                  ? COURSE_COMPLETED_LABELS[profile.courseCompleted]
                  : undefined
              }
            />
            <p className="m-0 max-w-[420px] text-[13px] leading-snug text-[#A9B4C8] text-pretty">
              It runs on the student&apos;s own hosting, outside Learnbay, and
              opens in a new tab.
            </p>
          </div>
        </div>

        {/* More by student */}
        {more.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="m-0 text-lg font-bold">
                More projects by {name.split(" ")[0]}
              </h2>
              <Link
                href={`/students/${project.profileId}`}
                className="font-semibold text-brand-accent no-underline"
              >
                See their profile
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {more.map((m) => (
                <Link
                  key={m.id}
                  href={`/projects/${m.id}`}
                  className="flex flex-col gap-2 rounded-card border border-line bg-white p-[18px] text-brand-ink no-underline shadow-card hover:border-line-strong"
                >
                  <h3 className="m-0 text-[15px] font-bold leading-snug">{m.title}</h3>
                  <p className="m-0 line-clamp-3 text-[13px] leading-relaxed text-brand-muted">
                    {m.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <p className="text-[13px] text-brand-muted text-pretty">
          The &ldquo;Ask about this project&rdquo; assistant panel from the
          design arrives with the AI assistant milestone.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
