import Link from "next/link";

/**
 * The Learnbay Projects wordmark: an accent "L" tile, the Learnbay name, and a
 * "Projects" pill. Matches the header lockup in the design boards.
 */
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="flex h-[38px] items-center gap-2.5 text-brand-ink no-underline"
      aria-label="Learnbay Projects home"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-accent text-base font-bold leading-none text-white">
        L
      </span>
      <span className="text-lg font-bold tracking-tight">Learnbay</span>
      <span className="rounded-pill border border-line-strong px-2 py-0.5 text-xs font-semibold text-brand-muted">
        Projects
      </span>
    </Link>
  );
}
