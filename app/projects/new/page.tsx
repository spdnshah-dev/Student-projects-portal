import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StudentHeader } from "@/components/student/StudentHeader";
import { Badge } from "@/components/ui/Badge";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ProjectForm } from "./ProjectForm";

export const metadata: Metadata = { title: "Add a project" };

const STEPS = [
  { n: 1, title: "Describe it", body: "Name, category, domain, description and tools." },
  { n: 2, title: "Add the live link", body: "Paste the address where your project is already running." },
  { n: 3, title: "Submit for review", body: "It goes to a Learnbay admin." },
  { n: 4, title: "Admin publishes it", body: "It then appears on your profile and the home page." },
];

export default async function AddProjectPage() {
  const user = await requireRole("STUDENT");
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile || !profile.consentAt) redirect("/consent");

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      <StudentHeader user={user} />

      <main className="flex flex-grow flex-col items-center gap-5 px-5 pt-7 sm:px-10">
        <div className="flex w-full max-w-[1120px] flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h1 className="m-0 text-2xl font-bold leading-tight tracking-tight">
              Add a project
            </h1>
            <Badge tone="chip">Draft</Badge>
          </div>
          <p className="m-0 text-sm text-brand-muted">
            Describe your project and add its live link. It appears on your
            profile after a Learnbay admin approves it.
          </p>
        </div>

        <div className="flex w-full max-w-[1120px] flex-col items-start gap-6 pb-8 lg:flex-row">
          <div className="min-w-0 flex-grow rounded-2xl border border-line bg-white p-7 shadow-card">
            <ProjectForm />
          </div>

          <aside className="flex w-full flex-shrink-0 flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-card lg:w-[300px]">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-muted">
              How it works
            </div>
            {STEPS.map((s) => (
              <div key={s.n} className="flex items-start gap-3">
                <div className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-brand-ink text-xs font-bold text-white">
                  {s.n}
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-brand-muted">{s.body}</div>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </main>
    </div>
  );
}
