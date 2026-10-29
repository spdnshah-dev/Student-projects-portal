/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

/**
 * The Learnbay logo (served from /public) plus a "Projects" pill marking this
 * as the Learnbay Projects portal. Shown in every header. Pass `href={null}`
 * for a plain, non-clickable brand mark (used on the locked project page).
 */
export function Logo({ href = "/" }: { href?: string | null }) {
  const inner = (
    <>
      <img
        src="/learnbay-logo.png"
        alt="Learnbay"
        width={193}
        height={44}
        className="h-11 w-auto"
      />
      <span className="rounded-pill border border-line-strong px-2 py-0.5 text-xs font-semibold text-brand-muted">
        Projects
      </span>
    </>
  );
  const cls = "flex h-11 items-center gap-2.5 text-brand-ink no-underline";
  if (href === null) {
    return (
      <div className={cls} aria-label="Learnbay Projects">
        {inner}
      </div>
    );
  }
  return (
    <Link href={href} className={cls} aria-label="Learnbay Projects home">
      {inner}
    </Link>
  );
}
