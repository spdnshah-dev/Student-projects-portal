import Link from "next/link";
import type { Domain } from "@prisma/client";
import { Avatar } from "@/components/ui/Avatar";
import { DOMAIN_LABELS } from "@/lib/constants";

// Only the fields the card renders. Public queries never load private contact
// fields (LinkedIn URL, email), so this type deliberately has none.
export type StudentCardProfile = {
  id: string;
  headline: string | null;
  yearsExperience: number | null;
  domain: Domain | null;
  photoKey: string | null;
  user: { name: string | null };
  _count: { projects: number };
};

export function StudentCard({ profile: p }: { profile: StudentCardProfile }) {
  const name = p.user.name ?? "Student";
  const meta = [
    p.yearsExperience != null
      ? `${p.yearsExperience} year${p.yearsExperience === 1 ? "" : "s"}`
      : null,
    p.domain ? DOMAIN_LABELS[p.domain] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/students/${p.id}`}
      className="flex flex-col gap-3 rounded-card border border-line bg-white p-5 text-brand-ink no-underline shadow-card hover:border-line-strong"
    >
      <div className="flex items-center gap-3">
        <Avatar name={name} photoUrl={p.photoKey} size={48} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-bold">{name}</span>
          {meta && (
            <span className="truncate text-[13px] text-brand-muted">{meta}</span>
          )}
        </div>
      </div>
      {p.headline && (
        <p className="m-0 line-clamp-2 text-sm text-brand-ink-soft">{p.headline}</p>
      )}
      <div className="mt-auto text-[13px] font-semibold text-brand-muted">
        {p._count.projects} published project
        {p._count.projects === 1 ? "" : "s"}
      </div>
    </Link>
  );
}
