import type { ItemState } from "@prisma/client";
import { PROFILE_STATE_LABELS, PROJECT_STATE_LABELS } from "@/lib/constants";

const DOT: Record<ItemState, string> = {
  DRAFT: "bg-brand-faint",
  IN_REVIEW: "bg-[#FAB219]",
  CHANGES_IN_REVIEW: "bg-[#FAB219]",
  CHANGES_NEEDED: "bg-state-sentback",
  PUBLISHED: "bg-state-published",
  UNPUBLISHED: "bg-brand-faint",
};

export function ItemStatus({
  state,
  kind = "project",
}: {
  state: ItemState;
  kind?: "project" | "profile";
}) {
  const label =
    kind === "profile" ? PROFILE_STATE_LABELS[state] : PROJECT_STATE_LABELS[state];
  return (
    <span className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${DOT[state]}`} />
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
}
