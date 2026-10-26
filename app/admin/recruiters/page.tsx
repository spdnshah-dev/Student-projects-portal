import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Badge } from "@/components/ui/Badge";
import { initials, avatarClasses } from "@/lib/initials";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/time";
import { AddRecruiterForm } from "./AddRecruiterForm";

export const metadata: Metadata = { title: "Recruiters" };

export default async function RecruitersPage() {
  const user = await requireRole(ADMIN_ROLES);

  const recruiters = await prisma.user.findMany({
    where: { role: "RECRUITER" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      <AdminHeader user={user} active="recruiters" />

      <main className="mx-auto flex w-full max-w-shell flex-grow flex-col gap-5 px-8 py-7">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-2xl font-bold tracking-tight">Recruiters</h1>
          <p className="m-0 text-sm text-brand-muted">
            Recruiter accounts can open students&apos; LinkedIn profiles. Everyone
            else only sees the button.
          </p>
        </div>

        <AddRecruiterForm />

        <section className="overflow-hidden rounded-card border border-line bg-white shadow-card">
          {recruiters.length === 0 ? (
            <p className="m-0 px-5 py-10 text-center text-brand-muted">
              No recruiters yet.
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col p-0">
              {recruiters.map((r) => {
                const name = r.name ?? r.email;
                return (
                  <li
                    key={r.id}
                    className="grid grid-cols-[2fr_1fr_1fr] items-center gap-4 border-b border-line px-5 py-3.5 last:border-b-0"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarClasses(name)}`}>
                        {initials(name)}
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-semibold">{name}</span>
                        <span className="truncate text-[13px] text-brand-muted">{r.email}</span>
                      </div>
                    </div>
                    <div>
                      {r.passwordHash ? (
                        <Badge tone="chip">Password set</Badge>
                      ) : (
                        <Badge tone="neutral">Awaiting password</Badge>
                      )}
                    </div>
                    <span className="text-[13px] text-brand-muted">
                      Added {timeAgo(r.createdAt)}
                    </span>
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
