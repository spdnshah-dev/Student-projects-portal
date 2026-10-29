import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { OpenProjectDialog } from "@/components/public/OpenProjectDialog";
import { AssistantWidget } from "@/components/public/AssistantWidget";
import { CATEGORY_LABELS, COURSE_LABELS, DOMAIN_LABELS } from "@/lib/constants";
import { getMoreByProfile, getPublicProject, toolsList } from "@/lib/public";
import { publicStudentLabel } from "@/lib/student-id";
import { prisma } from "@/lib/prisma";

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

/**
 * The project page is a locked landing page: its one job is the "Open project"
 * button. The top bar carries only the Learnbay brand (no links), there is no
 * way back to the student's profile, and the student is identified by their
 * Student ID only.
 */
export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getPublicProject(id);
  if (!project) notFound();

  const profile = project.profile;
  const label = publicStudentLabel(profile.user.studentId);
  const tools = toolsList(project.toolsText);
  const [more, account] = await Promise.all([
    getMoreByProfile(project.profileId, project.id),
    // The course is public (it is part of the Student ID); nothing else from
    // the account is loaded here.
    prisma.user.findUnique({
      where: { id: profile.userId },
      select: { course: true },
    }),
  ]);
  const courseLabel = account?.course ? COURSE_LABELS[account.course] : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      {/* Learnbay bar — brand only, no navigation */}
      <div className="flex items-center border-b border-line bg-white px-5 py-2.5">
        <Logo href={null} />
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
          <div className="text-sm text-[#A9B4C8]">
            Built by student <span className="font-semibold text-white">{label}</span>
            {courseLabel ? ` · ${courseLabel}` : ""}
          </div>
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
              studentLabel={label}
              studentMeta={courseLabel}
            />
            <p className="m-0 max-w-[420px] text-[13px] leading-snug text-[#A9B4C8] text-pretty">
              It runs on the student&apos;s own hosting, outside Learnbay, and
              opens in a new tab.
            </p>
          </div>
        </div>

        {/* More by the same student */}
        {more.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="m-0 text-lg font-bold">More projects by {label}</h2>
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
      </main>

      <SiteFooter />
      <AssistantWidget />
    </div>
  );
}
