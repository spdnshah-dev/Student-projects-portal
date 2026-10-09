import type { Category, Domain } from "@prisma/client";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { AudienceToggle } from "@/components/public/AudienceToggle";
import { FilterBar } from "@/components/public/FilterBar";
import { ProjectCard } from "@/components/public/ProjectCard";
import { CATEGORY_LABELS, DOMAIN_LABELS } from "@/lib/constants";
import {
  countPublishedProjects,
  getPublishedProjects,
  type ProjectFilters,
} from "@/lib/public";

// Renders live data from the database on each request.
export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const categoryRaw = one(sp.category);
  const domainRaw = one(sp.domain);
  const filters: ProjectFilters = {
    category:
      categoryRaw && categoryRaw in CATEGORY_LABELS
        ? (categoryRaw as Category)
        : undefined,
    domain:
      domainRaw && domainRaw in DOMAIN_LABELS ? (domainRaw as Domain) : undefined,
    q: one(sp.q),
    sort: one(sp.sort) === "az" ? "az" : "newest",
  };

  const [projects, total] = await Promise.all([
    getPublishedProjects(filters),
    countPublishedProjects(),
  ]);

  const filtered =
    filters.category || filters.domain || (filters.q && filters.q.trim());

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-grow">
        <section className="flex flex-col items-center gap-1.5 border-b border-line bg-white px-6 pb-5 pt-6 text-center">
          <h1 className="m-0 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            Real projects, built by Learnbay students
          </h1>
          <p className="m-0 text-[15px] text-brand-muted">
            Open any project and try it live. Browse by domain, tool or
            industry, or look up a student.
          </p>
          <div className="mt-3">
            <AudienceToggle active="projects" />
          </div>
        </section>

        <section className="mx-auto w-full max-w-shell px-6 py-8">
          <div className="mb-5 flex items-baseline gap-3">
            <h2 className="m-0 text-lg font-bold tracking-tight">All projects</h2>
            <span className="text-[13px] font-semibold text-brand-muted">
              {total} published
            </span>
          </div>

          <FilterBar />

          {projects.length === 0 ? (
            <div className="mt-6 rounded-card border border-dashed border-line-strong bg-white px-6 py-16 text-center">
              <h3 className="m-0 text-base font-bold">
                {filtered ? "No projects match these filters" : "No published projects yet"}
              </h3>
              <p className="m-0 mt-1 text-sm text-brand-muted">
                {filtered
                  ? "Try clearing a filter."
                  : "Published student projects will appear here."}
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
