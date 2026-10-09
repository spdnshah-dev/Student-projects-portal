import Link from "next/link";
import type { Project, StudentProfile, User } from "@prisma/client";
import { initials, avatarClasses } from "@/lib/initials";
import { DOMAIN_LABELS } from "@/lib/constants";
import { toolsList } from "@/lib/public";

type CardProject = Project & { profile: StudentProfile & { user: User } };

function studentMeta(profile: StudentProfile): string {
  return [
    profile.yearsExperience != null
      ? `${profile.yearsExperience} year${profile.yearsExperience === 1 ? "" : "s"}`
      : null,
    profile.domain ? DOMAIN_LABELS[profile.domain] : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function ProjectCard({ project }: { project: CardProject }) {
  const name = project.profile.user.name ?? project.profile.user.email;
  const tools = toolsList(project.toolsText).slice(0, 5);

  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-white p-[18px] shadow-card">
      <Link
        href={`/students/${project.profileId}`}
        className="flex min-h-9 items-center gap-2.5 text-brand-ink no-underline"
      >
        <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarClasses(name)}`}>
          {initials(name)}
        </span>
        <span className="flex flex-col">
          <span className="font-semibold">{name}</span>
          <span className="text-xs text-brand-muted">{studentMeta(project.profile)}</span>
        </span>
      </Link>

      <div className="flex flex-col gap-1.5">
        <h3 className="m-0 text-base font-bold leading-snug">{project.title}</h3>
        <p className="m-0 line-clamp-3 leading-relaxed text-brand-ink-soft text-pretty">
          {project.description}
        </p>
      </div>

      {tools.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tools.map((t) => (
            <span key={t} className="rounded-pill bg-surface-chip px-2.5 py-1 text-xs font-semibold text-brand-ink-soft">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-end border-t border-line pt-3">
        <Link
          href={`/projects/${project.id}`}
          className="flex h-9 items-center gap-2 rounded-pill bg-brand-accent px-4 text-[13px] font-semibold text-white no-underline hover:bg-brand-accent-hover"
        >
          View project
          <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true" className="fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10h12M11 5l5 5-5 5" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
