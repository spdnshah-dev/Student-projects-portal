import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ItemState } from "@prisma/client";
import { StudentHeader } from "@/components/student/StudentHeader";
import { ButtonLink } from "@/components/ui/Button";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PROJECT_STATE_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Dashboard" };

const STATE_DOT: Record<ItemState, string> = {
  DRAFT: "bg-brand-faint",
  IN_REVIEW: "bg-[#FAB219]",
  CHANGES_IN_REVIEW: "bg-[#FAB219]",
  CHANGES_NEEDED: "bg-state-sentback",
  PUBLISHED: "bg-state-published",
  UNPUBLISHED: "bg-brand-faint",
};

function StatusPill({ state }: { state: ItemState }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${STATE_DOT[state]}`} />
      <span>{PROJECT_STATE_LABELS[state]}</span>
    </span>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-card border border-line bg-white p-5 shadow-card">
      <div className="text-[13px] font-semibold text-brand-muted">{label}</div>
      <div className="text-[28px] font-semibold leading-none tracking-tight">{value}</div>
      <div className="text-brand-muted">{hint}</div>
    </div>
  );
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-[38px] items-center border-b-2 text-sm font-semibold no-underline ${
        active
          ? "border-brand-accent text-brand-ink"
          : "border-transparent text-brand-muted"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireRole("STUDENT");
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) redirect("/consent");

  const projects = await prisma.project.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
    include: { linkChecks: { orderBy: { checkedAt: "desc" }, take: 1 } },
  });

  const published = projects.filter((p) => p.state === "PUBLISHED");
  const inReview = projects.filter(
    (p) => p.state === "IN_REVIEW" || p.state === "CHANGES_IN_REVIEW",
  );
  const broken = published.filter((p) => p.linkOk === false);

  const tab = (await searchParams).tab === "links" ? "links" : "overview";
  const firstName = (user.name ?? "there").split(" ")[0];

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      <StudentHeader user={user} showAddProject />

      <main className="mx-auto flex w-full max-w-shell flex-grow flex-col gap-5 px-6 py-7 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 text-2xl font-bold leading-tight tracking-tight">
              Welcome back, {firstName}
            </h1>
            <p className="m-0 text-sm text-brand-muted">
              {tab === "links"
                ? "Your published project links that are not working right now."
                : "Here is how your projects are doing."}
            </p>
          </div>
          <ButtonLink href="/profile/setup" variant="secondary" size="md">
            Edit profile
          </ButtonLink>
        </div>

        <div className="flex gap-6 border-b border-line">
          <Tab href="/dashboard" active={tab === "overview"}>
            Overview
          </Tab>
          <Tab href="/dashboard?tab=links" active={tab === "links"}>
            Link problems
          </Tab>
        </div>

        {tab === "overview" ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                label="Projects"
                value={String(projects.length)}
                hint={`${published.length} published · ${inReview.length} in review`}
              />
              <StatCard
                label="Published"
                value={String(published.length)}
                hint="Live on your public profile"
              />
              <StatCard
                label="In review"
                value={String(inReview.length)}
                hint="Waiting for an admin"
              />
            </div>

            <section className="rounded-card border border-line bg-white shadow-card">
              <h2 className="m-0 border-b border-line px-5 py-4 text-lg font-bold">
                Your projects
              </h2>
              {projects.length === 0 ? (
                <div className="flex flex-col items-start gap-3 px-5 py-8">
                  <p className="m-0 text-brand-muted">
                    You haven&apos;t added a project yet.
                  </p>
                  <ButtonLink href="/projects/new" variant="primary" size="md">
                    Add your first project
                  </ButtonLink>
                </div>
              ) : (
                <ul className="m-0 flex list-none flex-col p-0">
                  {projects.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5 last:border-b-0"
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-semibold">{p.title}</span>
                        {p.state === "PUBLISHED" && p.linkOk === false && (
                          <span className="text-[13px] font-semibold text-state-sentback">
                            Live link not working
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-5">
                        <StatusPill state={p.state} />
                        {p.state === "PUBLISHED" ? (
                          <a
                            href={p.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-brand-accent no-underline"
                          >
                            Open
                          </a>
                        ) : (
                          <span className="text-brand-muted">—</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <p className="text-[13px] text-brand-muted text-pretty">
              View counts and the &ldquo;who viewed your projects&rdquo; charts
              from the design are a later analytics milestone and aren&apos;t
              tracked yet.
            </p>
          </>
        ) : (
          <>
            {broken.length > 0 ? (
              <div className="flex items-start gap-3 rounded-card border border-[#F3C3C3] bg-[#FDECEC] px-[18px] py-4">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#C22F2F]">
                  <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" className="fill-none stroke-white" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M5 5l6 6M11 5l-6 6" />
                  </svg>
                </span>
                <div className="flex flex-col gap-0.5 text-[#6E1313]">
                  <div className="text-[15px] font-bold">
                    {broken.length} of your {published.length} published link
                    {published.length === 1 ? "" : "s"}{" "}
                    {broken.length === 1 ? "is" : "are"} not working
                  </div>
                  <div className="text-pretty text-sm">
                    Visitors who click Open project see a &ldquo;taking longer
                    than usual&rdquo; message instead of your project.
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-card border border-line bg-white px-5 py-4 text-sm text-brand-muted shadow-card">
                All your published links are working. Nothing to fix here.
              </div>
            )}

            {broken.map((p) => {
              const last = p.linkChecks[0];
              return (
                <div
                  key={p.id}
                  className="flex flex-col gap-4 rounded-card border border-line bg-white p-6 shadow-card"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="m-0 text-lg font-bold">{p.title}</h2>
                    <span className="flex-shrink-0 rounded-pill bg-[#C22F2F] px-3 py-1 text-xs font-bold text-white">
                      Not working
                    </span>
                  </div>
                  <dl className="grid grid-cols-1 gap-x-12 gap-y-4 sm:grid-cols-2">
                    <Field label="Link">
                      <span className="break-all font-mono text-[13.5px]">
                        {p.liveUrl}
                      </span>
                    </Field>
                    <Field label="What happened">
                      {last?.error ?? "The link did not answer."}
                    </Field>
                    <Field label="Last worked">
                      {p.linkLastWorkedAt
                        ? p.linkLastWorkedAt.toLocaleString()
                        : "Not recorded"}
                    </Field>
                    <Field label="Last checked">
                      {p.linkLastCheckedAt
                        ? p.linkLastCheckedAt.toLocaleString()
                        : "Not recorded"}
                    </Field>
                  </dl>
                </div>
              );
            })}

            <p className="text-[13px] text-brand-muted text-pretty">
              Learnbay tries every published link once a day, and each time a
              visitor opens a project. Working links are not listed here. (The
              daily checker is built in the link-checker milestone.)
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-bold uppercase tracking-wider text-brand-muted">
        {label}
      </dt>
      <dd className="m-0 text-sm">{children}</dd>
    </div>
  );
}
