import { Logo } from "./Logo";
import { ButtonLink } from "@/components/ui/Button";

/**
 * The public site header: the Learnbay Projects lockup, a search field, and a
 * Log in link. Sits at the top of every visitor-facing page.
 */
export function SiteHeader() {
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

      <ButtonLink href="/login" variant="ghost" size="md">
        Log in
      </ButtonLink>
    </header>
  );
}
