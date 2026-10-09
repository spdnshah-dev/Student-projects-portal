import type { User } from "@prisma/client";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { initials, avatarClasses } from "@/lib/initials";

/** Header for the signed-in student pages: logo, optional Add-project, avatar + log out. */
export function StudentHeader({
  user,
  showAddProject = false,
}: {
  user: User;
  showAddProject?: boolean;
}) {
  const name = user.name ?? user.email;
  return (
    <header className="flex h-16 flex-shrink-0 items-center gap-4 border-b border-line bg-white px-5">
      <Logo href="/" />
      <div className="flex-grow" />
      {showAddProject && (
        <ButtonLink href="/projects/new" variant="primary" size="md">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="fill-none stroke-current"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 4.5v11M4.5 10h11" />
          </svg>
          Add a project
        </ButtonLink>
      )}
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold ${avatarClasses(name)}`}
        >
          {initials(name)}
        </span>
        <span className="hidden font-semibold sm:inline">{name}</span>
        <LogoutButton />
      </div>
    </header>
  );
}
