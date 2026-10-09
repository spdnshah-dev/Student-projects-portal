import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { initials, avatarClasses } from "@/lib/initials";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Link problems" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-bold uppercase tracking-wider text-brand-muted">
        {label}
      </dt>
      <dd className="m-0 text-sm text-brand-ink-soft">{children}</dd>
    </div>
  );
}

export default async function AdminLinksPage() {
  const user = await requireRole(ADMIN_ROLES);

  const broken = await prisma.project.findMany({
    where: { state: "PUBLISHED", linkOk: false },
    orderBy: { linkLastCheckedAt: "desc" },
    include: {
      profile: { include: { user: true } },
      linkChecks: { orderBy: { checkedAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      <AdminHeader user={user} active="links" />

      <main className="mx-auto flex w-full max-w-shell flex-grow flex-col gap-5 px-8 py-7">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-2xl font-bold tracking-tight">Link problems</h1>
          <p className="m-0 text-sm text-brand-muted">
            Published project links that are not working right now, across all
            students. Checked once a day and each time a visitor opens a project.
          </p>
        </div>

        {broken.length === 0 ? (
          <div className="rounded-card border border-line bg-white px-5 py-4 text-sm text-brand-muted shadow-card">
            All published links are working. Nothing to fix here.
          </div>
        ) : (
          <>
            <div className="rounded-card border border-[#F3C3C3] bg-[#FDECEC] px-[18px] py-3.5 text-[15px] font-bold text-[#6E1313]">
              {broken.length} published link{broken.length === 1 ? "" : "s"}{" "}
              {broken.length === 1 ? "is" : "are"} not working
            </div>
            {broken.map((p) => {
              const name = p.profile.user.name ?? p.profile.user.email;
              const last = p.linkChecks[0];
              return (
                <div
                  key={p.id}
                  className="flex flex-col gap-4 rounded-card border border-line bg-white p-6 shadow-card"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarClasses(name)}`}>
                        {initials(name)}
                      </span>
                      <div className="flex flex-col">
                        <h2 className="m-0 text-lg font-bold">{p.title}</h2>
                        <span className="text-[13px] text-brand-muted">{name}</span>
                      </div>
                    </div>
                    <span className="rounded-pill bg-[#C22F2F] px-3 py-1 text-xs font-bold text-white">
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
          </>
        )}
      </main>
    </div>
  );
}
