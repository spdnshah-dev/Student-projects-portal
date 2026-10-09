import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StudentHeader } from "@/components/student/StudentHeader";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ProfileForm, type ProfileDefaults } from "./ProfileForm";
import { CertificateManager } from "./CertificateManager";

export const metadata: Metadata = { title: "Complete your profile" };

function Check({ done }: { done: boolean }) {
  return done ? (
    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-state-published">
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        aria-hidden="true"
        className="fill-none stroke-white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3.5 8.5l3 3 6-7" />
      </svg>
    </span>
  ) : (
    <span className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-brand-faint" />
  );
}

export default async function ProfileSetupPage() {
  const user = await requireRole("STUDENT");
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    include: {
      _count: { select: { projects: true } },
      certificates: { orderBy: { uploadedAt: "asc" } },
    },
  });
  if (!profile || !profile.consentAt) redirect("/consent");

  const publishedCount = await prisma.project.count({
    where: { profileId: profile.id, state: "PUBLISHED" },
  });

  const defaults: ProfileDefaults = {
    fullName: user.name ?? "",
    email: user.email,
    headline: profile.headline ?? "",
    about: profile.about ?? "",
    yearsExperience:
      profile.yearsExperience != null ? String(profile.yearsExperience) : "",
    domain: profile.domain ?? "",
    courseCompleted: profile.courseCompleted ?? "",
    linkedinUrl: profile.linkedinUrl ?? "",
  };

  const detailsDone = Boolean(user.name && profile.about);

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      <StudentHeader user={user} />

      <main className="flex flex-grow flex-col items-center gap-5 px-5 pt-7 sm:px-10">
        <div className="flex w-full max-w-[1120px] flex-col gap-1.5">
          <h1 className="m-0 text-2xl font-bold leading-tight tracking-tight">
            Complete your profile
          </h1>
          <p className="m-0 text-sm text-brand-muted">
            This is what visitors see on your public profile. You can change it
            any time.
          </p>
        </div>

        <div className="flex w-full max-w-[1120px] flex-col items-start gap-6 pb-8 lg:flex-row">
          <div className="flex min-w-0 flex-grow flex-col gap-6">
            <div className="rounded-2xl border border-line bg-white p-7 shadow-card">
              <ProfileForm defaults={defaults} />
            </div>
            <CertificateManager certificates={profile.certificates} />
          </div>

          <aside className="flex w-full flex-shrink-0 flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-card lg:w-[300px]">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-muted">
              What your profile needs
            </div>
            <div className="flex items-start gap-2.5">
              <Check done={detailsDone} />
              <div>
                Profile details
                {!detailsDone && (
                  <div className="text-brand-muted">
                    Add your name and a short About.
                  </div>
                )}
              </div>
            </div>
            <div className="h-px bg-line" />
            <div className="flex items-start gap-2.5">
              <Check done={publishedCount > 0} />
              <div className="flex flex-col gap-1">
                <div className="font-semibold">One published project</div>
                <div className="text-pretty text-brand-muted">
                  Add a project and submit it. A Learnbay admin reviews it and
                  publishes it to your profile.
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
