import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { ProjectCard } from "@/components/public/ProjectCard";
import { initials, avatarClasses } from "@/lib/initials";
import { COURSE_COMPLETED_LABELS, DOMAIN_LABELS } from "@/lib/constants";
import { getPublicProfile } from "@/lib/public";

// Renders live data from the database on each request.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  if (!profile) return { title: "Profile not found" };
  return { title: profile.user.name ?? "Student profile" };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  if (!profile) notFound();

  const name = profile.user.name ?? "Student";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-shell flex-grow flex-col gap-6 px-6 py-8 lg:flex-row lg:items-start">
        {/* Sidebar */}
        <aside className="flex w-full flex-shrink-0 flex-col gap-5 rounded-card border border-line bg-white p-6 shadow-card lg:w-[320px] lg:sticky lg:top-6">
          <div className="flex flex-col items-start gap-3">
            <span className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold ${avatarClasses(name)}`}>
              {initials(name)}
            </span>
            <div className="flex flex-col gap-1.5">
              <h1 className="m-0 text-xl font-bold tracking-tight">{name}</h1>
              {profile.yearsExperience != null && (
                <div className="text-sm text-brand-muted">
                  {profile.yearsExperience} year
                  {profile.yearsExperience === 1 ? "" : "s"} of experience
                </div>
              )}
              {profile.domain && (
                <div className="text-sm text-brand-muted">
                  Works in {DOMAIN_LABELS[profile.domain]}
                </div>
              )}
            </div>
            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[38px] items-center gap-2 rounded-pill border-[1.5px] border-[#0A66C2] bg-white px-4 font-semibold text-[#0A66C2] no-underline"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded bg-[#0A66C2] text-xs font-bold text-white">
                  in
                </span>
                LinkedIn
              </a>
            )}
          </div>

          {profile.about && (
            <>
              <div className="h-px bg-line" />
              <p className="m-0 whitespace-pre-line text-sm leading-relaxed text-brand-ink-soft text-pretty">
                {profile.about}
              </p>
            </>
          )}

          {profile.courseCompleted && (
            <>
              <div className="h-px bg-line" />
              <div className="flex flex-col gap-2">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                  Course completed
                </div>
                <div className="font-semibold">
                  {COURSE_COMPLETED_LABELS[profile.courseCompleted]}
                </div>
                <div className="text-[13px] text-brand-muted">Learnbay program</div>
              </div>
            </>
          )}

          {profile.certificates.length > 0 && (
            <>
              <div className="h-px bg-line" />
              <div className="flex flex-col gap-2">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                  Certificates earned
                </div>
                {profile.certificates.map((c) => (
                  <div key={c.id} className="flex flex-col">
                    <span className="font-semibold">{c.name}</span>
                    {c.issuer && (
                      <span className="text-[13px] text-brand-muted">{c.issuer}</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>

        {/* Projects */}
        <section className="flex min-w-0 flex-grow flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <h2 className="m-0 text-lg font-bold tracking-tight">Projects</h2>
            <span className="rounded-pill bg-surface-chip px-2.5 py-0.5 text-xs font-semibold text-brand-ink-soft">
              {profile.projects.length}
            </span>
          </div>
          {profile.projects.length === 0 ? (
            <p className="m-0 text-sm text-brand-muted">
              No published projects yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {profile.projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={{ ...p, profile: { ...profile, user: profile.user } }}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
