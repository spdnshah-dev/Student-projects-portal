import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/brand/SiteFooter";

/**
 * Public home — the landing page inside the Learnbay brand shell.
 *
 * Foundation build: this renders the brand shell (header, hero, segmented
 * Projects/Students toggle, footer) using the design tokens. The live project
 * catalogue, filters, and assistant panel are wired up in the public-portal and
 * AI milestones; until then the catalogue area shows an honest empty state.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-grow">
        {/* Hero */}
        <section className="flex flex-col items-center gap-1.5 border-b border-line bg-white px-6 pb-5 pt-6 text-center">
          <h1 className="m-0 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            Real projects, built by Learnbay students
          </h1>
          <p className="m-0 text-[15px] text-brand-muted">
            Open any project and try it live. Browse by domain, tool or
            industry, or look up a student.
          </p>

          {/* Projects / Students segmented toggle */}
          <div className="mt-3 flex gap-1 rounded-pill bg-surface-sunken p-1">
            <span
              aria-current="page"
              className="flex h-9 w-[148px] items-center justify-center rounded-pill bg-brand-ink text-sm font-semibold text-white"
            >
              Projects
            </span>
            <a
              href="/students"
              className="flex h-9 w-[148px] items-center justify-center rounded-pill text-sm font-semibold text-brand-ink no-underline"
            >
              Students
            </a>
          </div>
        </section>

        {/* Catalogue area — empty state until the public-portal milestone. */}
        <section className="mx-auto w-full max-w-shell px-6 py-10">
          <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line-strong bg-white px-6 py-16 text-center">
            <h2 className="m-0 text-lg font-bold tracking-tight">
              The project catalogue is being built
            </h2>
            <p className="m-0 max-w-md text-sm text-brand-muted">
              The brand shell, design tokens, and data model are in place.
              Published student projects and the filter row appear here once the
              public-portal milestone lands.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
