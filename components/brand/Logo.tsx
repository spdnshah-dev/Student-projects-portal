/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

/**
 * The Learnbay logo (served from /public) plus a "Projects" pill marking this
 * as the Learnbay Projects portal. Shown in every header.
 */
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="flex h-10 items-center gap-2.5 text-brand-ink no-underline"
      aria-label="Learnbay Projects home"
    >
      <img
        src="/learnbay-logo.png"
        alt="Learnbay"
        width={73}
        height={40}
        className="h-10 w-auto"
      />
      <span className="rounded-pill border border-line-strong px-2 py-0.5 text-xs font-semibold text-brand-muted">
        Projects
      </span>
    </Link>
  );
}
