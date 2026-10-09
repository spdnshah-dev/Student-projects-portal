import type { User } from "@prisma/client";
import { Logo } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABELS } from "@/lib/constants";
import { LogoutButton } from "./LogoutButton";

/** Top bar for signed-in areas: logo, the user's name + role, and log out. */
export function SignedInBar({ user }: { user: User }) {
  return (
    <header className="flex h-16 flex-shrink-0 items-center gap-4 border-b border-line bg-white px-5">
      <Logo href="/" />
      <div className="flex-grow" />
      <div className="flex items-center gap-3">
        <span className="hidden text-sm font-semibold sm:inline">
          {user.name ?? user.email}
        </span>
        <Badge tone="neutral">{ROLE_LABELS[user.role]}</Badge>
        <LogoutButton />
      </div>
    </header>
  );
}
