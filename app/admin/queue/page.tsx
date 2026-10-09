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
import { CATEGORY_LABELS } from "@/lib/constants";
import { hostOf } from "@/lib/url";
import { timeAgo } from "@/lib/time";

export const metadata: Metadata = { title: "Review queue" };

type TabKey = "waiting" | "sentback" | "published";

const TAB_FILTER: Record<TabKey, ItemState[]> = {
  waiting: ["IN_REVIEW", "CHANGES_IN_REVIEW"],
  sentback: ["CHANGES_NEEDED"],
  published: ["PUBLISHED"],
};

function Tab({ tab, current, label, count }: { tab: TabKey; current: TabKey; label: string; count: number }) {
  const active = tab === current;
  return (
    <Link
      href={tab === "waiting" ? "/admin/queue" : `/admin/queue?tab=${tab}`}
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

export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireRole(ADMIN_ROLES);
  const raw = (await searchParams).tab;
  const tab: TabKey = raw === "sentback" || raw === "published" ? raw : "waiting";

  const where: Prisma.ProjectWhereInput = { state: { in: TAB_FILTER[tab] } };

  const [rows, waiting, sentback, published] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: tab === "published" ? { updatedAt: "desc" } : { updatedAt: "asc" },
      include: { profile: { include: { user: true } } },
    }),
    prisma.project.count({ where: { state: { in: TAB_FILTER.waiting } } }),
    prisma.project.count({ where: { state: { in: TAB_FILTER.sentback } } }),
    prisma.project.count({ where: { state: { in: TAB_FILTER.published } } }),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      <AdminHeader user={user} active="queue" />

      <main className="mx-auto flex w-full max-w-shell flex-grow flex-col gap-5 px-8 py-7">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-2xl font-bold tracking-tight">Review queue</h1>
          <p className="m-0 text-sm text-brand-muted">
            Projects students have submitted. Nothing goes public until an admin
            publishes it.
          </p>
        </div>

        <div className="flex gap-6 border-b border-line">
          <Tab tab="waiting" current={tab} label="Waiting for review" count={waiting} />
          <Tab tab="sentback" current={tab} label="Sent back" count={sentback} />
          <Tab tab="published" current={tab} label="Published" count={published} />
        </div>

        <section className="overflow-hidden rounded-card border border-line bg-white shadow-card">
          {rows.length === 0 ? (
            <p className="m-0 px-5 py-10 text-center text-brand-muted">
              Nothing here right now.
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col p-0">
              {rows.map((p) => {
                const name = p.profile.user.name ?? p.profile.user.email;
                return (
                  <li
                    key={p.id}
                    className="grid grid-cols-[1.6fr_1.2fr_1fr_1fr_auto] items-center gap-4 border-b border-line px-5 py-3.5 last:border-b-0"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold">{p.title}</span>
                      <span className="truncate text-[13px] text-brand-muted">
                        {CATEGORY_LABELS[p.category]}
                      </span>
                    </div>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${avatarClasses(name)}`}
                      >
                        {initials(name)}
                      </span>
                      <span className="truncate">{name}</span>
                    </div>
                    <span className="truncate font-mono text-[13px] text-brand-ink-soft">
                      {hostOf(p.liveUrl)}
                    </span>
                    {tab === "published" ? (
                      <ItemStatus state={p.state} />
                    ) : (
                      <span className="text-[13px] text-brand-muted">
                        {timeAgo(p.updatedAt)}
                      </span>
                    )}
                    <ButtonLink
                      href={`/admin/projects/${p.id}`}
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
