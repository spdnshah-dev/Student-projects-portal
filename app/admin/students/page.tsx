import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ItemStatus } from "@/components/admin/ItemStatus";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { initials, avatarClasses } from "@/lib/initials";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Students" };

export default async function StudentsPage() {
  const user = await requireRole(ADMIN_ROLES);

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { createdAt: "desc" },
    include: {
      profile: {
        include: {
          _count: { select: { projects: { where: { state: "PUBLISHED" } } } },
        },
      },
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      <AdminHeader user={user} active="students" />

      <main className="mx-auto flex w-full max-w-shell flex-grow flex-col gap-5 px-8 py-7">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-2xl font-bold tracking-tight">Students</h1>
          <p className="m-0 text-sm text-brand-muted">
            Every student, for looking up. Adding and disabling students is done
            by the super admin.
          </p>
        </div>

        <section className="overflow-hidden rounded-card border border-line bg-white shadow-card">
          <div className="grid grid-cols-[2fr_1fr_0.8fr_auto] gap-4 border-b border-line px-5 py-3 text-xs font-bold uppercase tracking-wider text-brand-muted">
            <div>Student</div>
            <div>Profile</div>
            <div>Published</div>
            <div />
          </div>
          {students.length === 0 ? (
            <p className="m-0 px-5 py-10 text-center text-brand-muted">
              No students yet.
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col p-0">
              {students.map((s) => {
                const name = s.name ?? s.email;
                return (
                  <li
                    key={s.id}
                    className="grid grid-cols-[2fr_1fr_0.8fr_auto] items-center gap-4 border-b border-line px-5 py-3.5 last:border-b-0"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarClasses(name)}`}>
                        {initials(name)}
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <span className="flex items-center gap-2 truncate font-semibold">
                          {name}
                          {s.status === "DISABLED" && (
                            <Badge tone="neutral">Disabled</Badge>
                          )}
                        </span>
                        <span className="truncate text-[13px] text-brand-muted">
                          {s.email}
                        </span>
                      </div>
                    </div>
                    <div>
                      {s.profile ? (
                        <ItemStatus state={s.profile.state} kind="profile" />
                      ) : (
                        <span className="text-[13px] text-brand-muted">No profile</span>
                      )}
                    </div>
                    <div className="font-semibold tabular-nums">
                      {s.profile?._count.projects ?? 0}
                    </div>
                    <div className="justify-self-end">
                      {s.profile && (
                        <ButtonLink
                          href={`/admin/profiles/${s.profile.id}`}
                          variant="secondary"
                          size="sm"
                        >
                          View profile
                        </ButtonLink>
                      )}
                    </div>
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
