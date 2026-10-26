import Link from "next/link";
import { Logo } from "./Logo";
import { ButtonLink } from "@/components/ui/Button";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHome } from "@/lib/auth/roles";

/**
 * The public site header: the Learnbay Projects lockup, a search field, and
 * either a Log in link or — for anyone signed in (including recruiters, who
 * browse the public portal) — their name, a link to their home, and Log out.
 */
export async function SiteHeader() {
  const user = await getCurrentUser();
  const firstName = user ? (user.name ?? user.email).split(" ")[0] : null;

  return (
    <header className="flex h-16 flex-shrink-0 items-center gap-5 border-b border-line bg-white px-4 sm:px-5">
      <Logo />

      <form
        role="search"
        action="/search"
        className="relative hidden min-w-0 flex-shrink items-center md:flex md:w-[420px]"
      >
        <label htmlFor="site-search" className="sr-only">
          Search projects, tools or students
        </label>
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 fill-none stroke-brand-muted"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 3.5a5.5 5.5 0 1 0 0 11a5.5 5.5 0 1 0 0-11zM13 13l3.5 3.5" />
        </svg>
        <input
          id="site-search"
          name="q"
          type="search"
          placeholder="Search projects, tools or students"
          className="h-[38px] w-full rounded-pill border border-line-input bg-surface-canvas pl-10 pr-4 text-sm text-brand-ink placeholder:text-brand-muted"
        />
      </form>

      <div className="flex-grow" />

      {user ? (
        <div className="flex items-center gap-3">
          {user.role !== "RECRUITER" && (
            <Link
              href={roleHome(user.role)}
              className="hidden h-[38px] items-center px-2 text-sm font-semibold text-brand-muted no-underline sm:flex"
            >
              My dashboard
            </Link>
          )}
          <span className="hidden text-sm font-semibold sm:inline">{firstName}</span>
          <LogoutButton />
        </div>
      ) : (
        <ButtonLink href="/login" variant="ghost" size="md">
          Log in
        </ButtonLink>
      )}
    </header>
  );
}
