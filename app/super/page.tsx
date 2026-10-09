import type { Metadata } from "next";
import Link from "next/link";
import { SuperHeader } from "@/components/super/SuperHeader";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/time";

export const metadata: Metadata = { title: "Super admin" };

const ACTION_LABEL: Record<string, string> = {
  PROJECT_APPROVE: "approved a project",
  PROJECT_SEND_BACK: "sent a project back",
  PROJECT_TAKE_DOWN: "took a project down",
  PROJECT_RESTORE: "restored a project",
  PROFILE_APPROVE: "approved a profile",
  PROFILE_SEND_BACK: "sent a profile back",
  PROFILE_TAKE_DOWN: "took a profile down",
  PROFILE_RESTORE: "restored a profile",
  USER_ADD: "added an account",
  USER_DISABLE: "disabled an account",
  USER_ENABLE: "re-enabled an account",
};

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
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

export default async function SuperOverviewPage() {
  const user = await requireRole("SUPER_ADMIN");

  const [students, admins, published, sessions, activity] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.project.count({ where: { state: "PUBLISHED" } }),
    prisma.aiSession.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { actor: true },
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      <SuperHeader user={user} active="overview" />

      <main className="mx-auto flex w-full max-w-shell flex-grow flex-col gap-6 px-8 py-7">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-2xl font-bold tracking-tight">
            Super admin overview
          </h1>
          <p className="m-0 text-sm text-brand-muted">
            Everything an admin can do, plus managing accounts and reading the AI
            logs.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Students" value={students} href="/super/people" />
          <Stat label="Admins" value={admins} href="/super/people" />
          <Stat label="Published projects" value={published} href="/admin/queue?tab=published" />
          <Stat label="AI sessions" value={sessions} href="/super/ai-logs" />
        </div>

        <section className="rounded-card border border-line bg-white shadow-card">
          <h2 className="m-0 border-b border-line px-5 py-4 text-lg font-bold">
            Recent activity
          </h2>
          {activity.length === 0 ? (
            <p className="m-0 px-5 py-8 text-brand-muted">No activity yet.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col p-0">
              {activity.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-4 border-b border-line px-5 py-3 text-sm last:border-b-0"
                >
                  <span>
                    <span className="font-semibold">
                      {a.actor?.name ?? a.actor?.email ?? "System"}
                    </span>{" "}
                    {ACTION_LABEL[a.action] ?? a.action}
                  </span>
                  <span className="flex-shrink-0 text-[13px] text-brand-muted">
                    {timeAgo(a.createdAt)} ago
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
