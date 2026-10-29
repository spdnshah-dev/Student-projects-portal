import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { AudienceToggle } from "@/components/public/AudienceToggle";
import { AssistantWidget } from "@/components/public/AssistantWidget";
import { StudentCard } from "@/components/public/StudentCard";
import { getLiveProfiles } from "@/lib/public";

export const metadata: Metadata = { title: "Students" };

// Renders live data from the database on each request.
export const dynamic = "force-dynamic";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const qRaw = (await searchParams).q;
  const q = (Array.isArray(qRaw) ? qRaw[0] : qRaw)?.trim() ?? "";
  const profiles = await getLiveProfiles(q);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-grow">
        <section className="flex flex-col items-center gap-1.5 border-b border-line bg-white px-6 pb-5 pt-6 text-center">
          <h1 className="m-0 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            Learnbay students
          </h1>
          <p className="m-0 text-[15px] text-brand-muted">
            Browse the students behind the projects and open their profiles.
            Students are shown by their Student ID.
          </p>
          <div className="mt-3">
            <AudienceToggle active="students" />
          </div>
        </section>

        <section className="mx-auto w-full max-w-shell px-6 py-8">
          <form
            method="get"
            className="mx-auto mb-6 flex w-full max-w-md items-center gap-2"
          >
            <div className="relative flex-grow">
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 fill-none stroke-brand-muted"
                strokeWidth="1.7"
                strokeLinecap="round"
              >
                <circle cx="9" cy="9" r="6" />
                <path d="M14 14l3.5 3.5" />
              </svg>
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search by Student ID"
                aria-label="Search students by Student ID"
                className="h-11 w-full rounded-pill border border-line-input bg-white pl-10 pr-4 text-sm text-brand-ink"
              />
            </div>
            <button
              type="submit"
              className="h-11 flex-shrink-0 rounded-pill bg-brand-accent px-5 text-sm font-semibold text-white hover:bg-brand-accent-hover"
            >
              Search
            </button>
          </form>

          {profiles.length === 0 ? (
            <div className="rounded-card border border-dashed border-line-strong bg-white px-6 py-16 text-center">
              {q ? (
                <>
                  <h3 className="m-0 text-base font-bold">No students found</h3>
                  <p className="m-0 mt-1 text-sm text-brand-muted">
                    No published student matches &ldquo;{q}&rdquo;.{" "}
                    <Link href="/students" className="font-semibold text-brand-accent no-underline">
                      Clear search
                    </Link>
                  </p>
                </>
              ) : (
                <>
                  <h3 className="m-0 text-base font-bold">No profiles are live yet</h3>
                  <p className="m-0 mt-1 text-sm text-brand-muted">
                    Student profiles appear here once an admin publishes them.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {profiles.map((p) => (
                <StudentCard key={p.id} profile={p} />
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
      <AssistantWidget />
    </div>
  );
}
