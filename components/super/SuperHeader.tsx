import Link from "next/link";
import type { User } from "@prisma/client";
import { Logo } from "@/components/brand/Logo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Badge } from "@/components/ui/Badge";
import { initials } from "@/lib/initials";

type SuperTab = "overview" | "people" | "ai-logs";

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-16 items-center border-b-[3px] border-t-[3px] border-t-transparent text-sm font-semibold no-underline ${
        active ? "border-b-brand-accent text-brand-ink" : "border-b-transparent text-brand-muted"
      }`}
    >
      {children}
    </Link>
  );
}

/** Desktop super-admin top nav. */
export function SuperHeader({ user, active }: { user: User; active: SuperTab }) {
  return (
    <header className="flex h-16 flex-shrink-0 items-center gap-6 border-b border-line bg-white px-6">
      <Logo href="/super" />
      <Badge tone="info">Super admin</Badge>
      <nav className="flex items-center gap-6">
        <NavLink href="/super" active={active === "overview"}>
          Overview
        </NavLink>
        <NavLink href="/super/people" active={active === "people"}>
          Admins &amp; students
        </NavLink>
        <NavLink href="/super/ai-logs" active={active === "ai-logs"}>
          AI logs
        </NavLink>
        <Link
          href="/admin"
          className="flex h-16 items-center border-b-[3px] border-t-[3px] border-transparent text-sm font-semibold text-brand-muted no-underline"
        >
          Review area
        </Link>
      </nav>
      <div className="flex-grow" />
      <div className="flex items-center gap-3">
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
