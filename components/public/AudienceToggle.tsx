import Link from "next/link";

/** The Projects / Students segmented control used on the public landing pages. */
export function AudienceToggle({ active }: { active: "projects" | "students" }) {
  const base =
    "flex h-9 w-[148px] items-center justify-center rounded-pill text-sm font-semibold no-underline";
  return (
    <div className="flex gap-1 rounded-pill bg-surface-sunken p-1">
      <Link
        href="/"
        aria-current={active === "projects" ? "page" : undefined}
        className={`${base} ${active === "projects" ? "bg-brand-ink text-white" : "text-brand-ink"}`}
      >
        Projects
      </Link>
      <Link
        href="/students"
        aria-current={active === "students" ? "page" : undefined}
        className={`${base} ${active === "students" ? "bg-brand-ink text-white" : "text-brand-ink"}`}
      >
        Students
      </Link>
    </div>
  );
}
