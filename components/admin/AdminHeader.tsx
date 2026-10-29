import Link from "next/link";
import type { User } from "@prisma/client";
import { Logo } from "@/components/brand/Logo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/initials";

type AdminTab = "overview" | "queue" | "profiles" | "students" | "links";

const NEEDS_REVIEW = ["IN_REVIEW", "CHANGES_IN_REVIEW"] as const;

function NavLink({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-16 items-center gap-2 border-b-[3px] border-t-[3px] border-t-transparent text-sm font-semibold no-underline ${
        active
          ? "border-b-brand-accent text-brand-ink"
          : "border-b-transparent text-brand-muted"
      }`}
    >
      <span>{children}</span>
      {count != null && count > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-accent px-1.5 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

/** Desktop admin top nav. Admin and super admin share it. */
export async function AdminHeader({
  user,
  active,
}: {
  user: User;
  active: AdminTab;
}) {
  const [projectsWaiting, profilesWaiting] = await Promise.all([
    prisma.project.count({ where: { state: { in: [...NEEDS_REVIEW] } } }),
    prisma.studentProfile.count({ where: { state: { in: [...NEEDS_REVIEW] } } }),
  ]);

  return (
    <header className="flex h-16 flex-shrink-0 items-center gap-6 border-b border-line bg-white px-6">
      <Logo href="/admin" />
      <nav className="flex items-center gap-6">
        <NavLink href="/admin" active={active === "overview"}>
          Overview
        </NavLink>
        <NavLink href="/admin/queue" active={active === "queue"} count={projectsWaiting}>
          Review queue
        </NavLink>
        <NavLink
          href="/admin/profiles"
          active={active === "profiles"}
          count={profilesWaiting}
        >
          Profiles
        </NavLink>
        <NavLink href="/admin/students" active={active === "students"}>
          Students
        </NavLink>
        <NavLink href="/admin/links" active={active === "links"}>
          Link problems
        </NavLink>
      </nav>
      <div className="flex-grow" />
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-[38px] items-center gap-1.5 px-3 font-semibold text-brand-muted no-underline"
        >
          View site
        </Link>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-chip text-[13px] font-bold text-brand-ink-soft">
          {initials(user.name ?? user.email)}
        </span>
        <span className="hidden font-semibold sm:inline">
          {user.name ?? user.email}
        </span>
        <LogoutButton />
      </div>
    </header>
  );
}
