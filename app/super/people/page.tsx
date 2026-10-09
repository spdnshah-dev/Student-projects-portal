import type { Metadata } from "next";
import { SuperHeader } from "@/components/super/SuperHeader";
import { Badge } from "@/components/ui/Badge";
import { initials, avatarClasses } from "@/lib/initials";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS, SUPER_ADMIN_EMAIL } from "@/lib/constants";
import { AddUserForm } from "./AddUserForm";
import { StatusButton } from "./StatusButton";

export const metadata: Metadata = { title: "Admins & students" };

export default async function PeoplePage() {
  const user = await requireRole("SUPER_ADMIN");

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      <SuperHeader user={user} active="people" />

      <main className="mx-auto flex w-full max-w-shell flex-grow flex-col gap-5 px-8 py-7">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-2xl font-bold tracking-tight">
            Admins &amp; students
          </h1>
          <p className="m-0 text-sm text-brand-muted">
            Add people by email and disable or re-enable accounts. Disabling a
            student hides their profile and projects from the public.
          </p>
        </div>

        <AddUserForm />

        <section className="overflow-hidden rounded-card border border-line bg-white shadow-card">
          <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 border-b border-line px-5 py-3 text-xs font-bold uppercase tracking-wider text-brand-muted">
            <div>Person</div>
            <div>Role</div>
            <div>Status</div>
            <div />
          </div>
          <ul className="m-0 flex list-none flex-col p-0">
            {users.map((u) => {
              const name = u.name ?? u.email;
              const isSuper = u.role === "SUPER_ADMIN" || u.email === SUPER_ADMIN_EMAIL;
              return (
                <li
                  key={u.id}
                  className="grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-4 border-b border-line px-5 py-3.5 last:border-b-0"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarClasses(name)}`}>
                      {initials(name)}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold">{name}</span>
                      <span className="truncate text-[13px] text-brand-muted">
                        {u.email}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">{ROLE_LABELS[u.role]}</div>
                  <div>
                    {u.status === "ACTIVE" ? (
                      <Badge tone="chip">Active</Badge>
                    ) : (
                      <Badge tone="neutral">Disabled</Badge>
                    )}
                  </div>
                  <div className="justify-self-end">
                    {isSuper ? (
                      <span className="text-[13px] text-brand-muted">—</span>
                    ) : (
                      <StatusButton
                        userId={u.id}
                        disabled={u.status === "DISABLED"}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
