import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ButtonLink } from "@/components/ui/Button";
import { initials, avatarClasses } from "@/lib/initials";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Admin overview" };

const NEEDS_REVIEW = ["IN_REVIEW", "CHANGES_IN_REVIEW"] as const;

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1.5 rounded-card border border-line bg-white p-5 no-underline shadow-card hover:border-line-strong"
    >
      <div className="text-[13px] font-semibold text-brand-muted">{label}</div>
      <div className="text-[28px] font-semibold leading-none tracking-tight text-brand-ink">
        {value}
      </div>
    </Link>
  );
}

export default async function AdminOverviewPage() {
  const user = await requireRole(ADMIN_ROLES);

  const [projectsWaiting, profilesWaiting, publishedProjects, students, recent] =
    await Promise.all([
      prisma.project.count({ where: { state: { in: [...NEEDS_REVIEW] } } }),
      prisma.studentProfile.count({ where: { state: { in: [...NEEDS_REVIEW] } } }),
      prisma.project.count({ where: { state: "PUBLISHED" } }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.project.findMany({
        where: { state: { in: [...NEEDS_REVIEW] } },
        orderBy: { updatedAt: "asc" },
        take: 8,
        include: { profile: { include: { user: true } } },
      }),
    ]);

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      <AdminHeader user={user} active="overview" />

      <main className="mx-auto flex w-full max-w-shell flex-grow flex-col gap-6 px-8 py-7">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-2xl font-bold tracking-tight">
            Welcome, {(user.name ?? "admin").split(" ")[0]}
          </h1>
          <p className="m-0 text-sm text-brand-muted">
            Nothing goes public until an admin publishes it.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Projects waiting" value={projectsWaiting} href="/admin/queue" />
          <StatCard label="Profiles waiting" value={profilesWaiting} href="/admin/profiles" />
          <StatCard label="Published projects" value={publishedProjects} href="/admin/queue?tab=published" />
          <StatCard label="Students" value={students} href="/admin/students" />
        </div>

        <section className="rounded-card border border-line bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="m-0 text-lg font-bold">Waiting the longest</h2>
            <ButtonLink href="/admin/queue" variant="secondary" size="sm">
              Open review queue
            </ButtonLink>
          </div>
          {recent.length === 0 ? (
            <p className="m-0 px-5 py-8 text-brand-muted">
              Nothing is waiting for review right now.
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col p-0">
              {recent.map((p) => {
                const name = p.profile.user.name ?? p.profile.user.email;
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5 last:border-b-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarClasses(name)}`}
                      >
                        {initials(name)}
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-semibold">{p.title}</span>
                        <span className="truncate text-[13px] text-brand-muted">
                          {name}
                        </span>
                      </div>
                    </div>
                    <ButtonLink
                      href={`/admin/projects/${p.id}`}
                      variant="primary"
                      size="sm"
                    >
                      Review
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
