import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { AssistantWidget } from "@/components/public/AssistantWidget";
import { ProjectCard } from "@/components/public/ProjectCard";
import { StudentCard } from "@/components/public/StudentCard";
import { getLiveProfiles, getPublishedProjects } from "@/lib/public";

export const metadata: Metadata = { title: "Search" };

// Renders live data from the database on each request.
export const dynamic = "force-dynamic";

/**
 * Results for the header search box, which promises "projects, tools or
 * students": projects match on title / description / tools, students on name
 * / headline. Both come from the public queries, so the same visibility rules
 * (and the recruiter-only contact rule) apply here as everywhere else.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  const [projects, students] = q
    ? await Promise.all([getPublishedProjects({ q }), getLiveProfiles(q)])
    : [[], []];
  const total = projects.length + students.length;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader searchQuery={q} />

      <main className="flex-grow">
        <section className="flex flex-col items-center gap-1.5 border-b border-line bg-white px-6 pb-5 pt-6 text-center">
          <h1 className="m-0 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            {q ? (
              <>
                Results for &ldquo;{q}&rdquo;
              </>
            ) : (
              "Search"
            )}
          </h1>
          <p className="m-0 text-[15px] text-brand-muted">
            {q
              ? `${total} match${total === 1 ? "" : "es"} across projects and students.`
              : "Type a project, tool or student name in the search box above."}
          </p>
        </section>

        <section className="mx-auto flex w-full max-w-shell flex-col gap-8 px-6 py-8">
          {q && total === 0 && (
            <div className="rounded-card border border-dashed border-line-strong bg-white px-6 py-16 text-center">
              <h3 className="m-0 text-base font-bold">Nothing matched</h3>
              <p className="m-0 mt-1 text-sm text-brand-muted">
                Try a different word, or browse{" "}
                <Link href="/" className="font-semibold text-brand-accent no-underline">
                  all projects
                </Link>{" "}
                or{" "}
                <Link href="/students" className="font-semibold text-brand-accent no-underline">
                  all students
                </Link>
                .
              </p>
            </div>
          )}

          {students.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <h2 className="m-0 text-lg font-bold tracking-tight">Students</h2>
                <span className="rounded-pill bg-surface-chip px-2.5 py-0.5 text-xs font-semibold text-brand-ink-soft">
                  {students.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {students.map((p) => (
                  <StudentCard key={p.id} profile={p} />
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <h2 className="m-0 text-lg font-bold tracking-tight">Projects</h2>
                <span className="rounded-pill bg-surface-chip px-2.5 py-0.5 text-xs font-semibold text-brand-ink-soft">
                  {projects.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {projects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
      <AssistantWidget />
    </div>
  );
}
