import { LEARNBAY_HOME_URL } from "@/lib/constants";

/** The public site footer, shown at the bottom of visitor-facing pages. */
export function SiteFooter() {
  return (
    <footer className="flex flex-shrink-0 flex-col gap-3 border-t border-line bg-white px-5 py-4 text-[13px] sm:h-14 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-8 sm:py-0">
      <div className="font-semibold">Learnbay Projects</div>
      <nav className="flex items-center gap-7">
        <a
          href={`${LEARNBAY_HOME_URL}/about`}
          className="flex min-h-[36px] items-center font-semibold text-brand-muted no-underline hover:text-brand-ink"
        >
          About Learnbay
        </a>
        <a
          href={`${LEARNBAY_HOME_URL}/courses`}
          className="flex min-h-[36px] items-center font-semibold text-brand-muted no-underline hover:text-brand-ink"
        >
          Courses
        </a>
        <a
          href={`${LEARNBAY_HOME_URL}/contact`}
          className="flex min-h-[36px] items-center font-semibold text-brand-muted no-underline hover:text-brand-ink"
        >
          Contact
        </a>
      </nav>
    </footer>
  );
}
