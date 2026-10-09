import type { Metadata } from "next";
import Link from "next/link";
import type { ItemState, Prisma } from "@prisma/client";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ItemStatus } from "@/components/admin/ItemStatus";
import { ButtonLink } from "@/components/ui/Button";
import { initials, avatarClasses } from "@/lib/initials";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { COURSE_COMPLETED_LABELS } from "@/lib/constants";
import { timeAgo } from "@/lib/time";

export const metadata: Metadata = { title: "Profiles" };

type TabKey = "waiting" | "sentback" | "live";

const TAB_FILTER: Record<TabKey, ItemState[]> = {
  waiting: ["IN_REVIEW", "CHANGES_IN_REVIEW"],
  sentback: ["CHANGES_NEEDED"],
  live: ["PUBLISHED"],
};

function Tab({ tab, current, label, count }: { tab: TabKey; current: TabKey; label: string; count: number }) {
  const active = tab === current;
  return (
    <Link
      href={tab === "waiting" ? "/admin/profiles" : `/admin/profiles?tab=${tab}`}
      aria-current={active ? "page" : undefined}
      className={`flex h-[38px] items-center gap-2 border-b-2 text-sm font-semibold no-underline ${
        active ? "border-brand-accent text-brand-ink" : "border-transparent text-brand-muted"
      }`}
    >
      <span>{label}</span>
      <span className="rounded-pill bg-surface-chip px-2 py-0.5 text-xs font-bold text-brand-ink-soft">
        {count}
      </span>
    </Link>
  );
}

export default async function ProfileQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireRole(ADMIN_ROLES);
  const raw = (await searchParams).tab;
  const tab: TabKey = raw === "sentback" || raw === "live" ? raw : "waiting";

  const where: Prisma.StudentProfileWhereInput = { state: { in: TAB_FILTER[tab] } };

  const [rows, waiting, sentback, live] = await Promise.all([
    prisma.studentProfile.findMany({
      where,
      orderBy: tab === "live" ? { updatedAt: "desc" } : { updatedAt: "asc" },
      include: { user: true, _count: { select: { projects: true } } },
    }),
    prisma.studentProfile.count({ where: { state: { in: TAB_FILTER.waiting } } }),
    prisma.studentProfile.count({ where: { state: { in: TAB_FILTER.sentback } } }),
    prisma.studentProfile.count({ where: { state: { in: TAB_FILTER.live } } }),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      <AdminHeader user={user} active="profiles" />

      <main className="mx-auto flex w-full max-w-shell flex-grow flex-col gap-5 px-8 py-7">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-2xl font-bold tracking-tight">Profiles</h1>
          <p className="m-0 text-sm text-brand-muted">
            Student profiles waiting for review. A profile must be Live for the
            student&apos;s projects to appear in public.
          </p>
        </div>

        <div className="flex gap-6 border-b border-line">
          <Tab tab="waiting" current={tab} label="Waiting" count={waiting} />
          <Tab tab="sentback" current={tab} label="Sent back" count={sentback} />
          <Tab tab="live" current={tab} label="Live" count={live} />
        </div>

        <section className="overflow-hidden rounded-card border border-line bg-white shadow-card">
          {rows.length === 0 ? (
            <p className="m-0 px-5 py-10 text-center text-brand-muted">
              Nothing here right now.
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col p-0">
              {rows.map((pf) => {
                const name = pf.user.name ?? pf.user.email;
                return (
                  <li
                    key={pf.id}
                    className="grid grid-cols-[2fr_1.4fr_0.8fr_auto] items-center gap-4 border-b border-line px-5 py-3.5 last:border-b-0"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarClasses(name)}`}>
                        {initials(name)}
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-semibold">{name}</span>
                        <span className="truncate text-[13px] text-brand-muted">
                          {pf.user.email}
                        </span>
                      </div>
                    </div>
                    <span className="truncate text-sm text-brand-ink-soft">
                      {pf.courseCompleted ? COURSE_COMPLETED_LABELS[pf.courseCompleted] : "—"}
                    </span>
                    {tab === "live" ? (
                      <ItemStatus state={pf.state} kind="profile" />
                    ) : (
                      <span className="text-[13px] text-brand-muted">
                        {timeAgo(pf.updatedAt)}
                      </span>
                    )}
                    <ButtonLink
                      href={`/admin/profiles/${pf.id}`}
                      variant={tab === "waiting" ? "primary" : "secondary"}
                      size="sm"
                    >
                      {tab === "waiting" ? "Review" : "View"}
                    </ButtonLink>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
