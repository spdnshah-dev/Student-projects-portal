import type { Metadata } from "next";
import { SignedInBar } from "@/components/auth/SignedInBar";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  // Admins and the super admin may both reach the admin area.
  const user = await requireRole(ADMIN_ROLES);

  return (
    <div className="flex min-h-screen flex-col">
      <SignedInBar user={user} />
      <main className="mx-auto w-full max-w-shell flex-grow px-6 py-10">
        <h1 className="m-0 text-2xl font-bold tracking-tight">Admin overview</h1>
        <p className="mt-2 max-w-md text-sm text-brand-muted">
          You&apos;re signed in as an admin. The review queues, approve / send
          back, the students list, and link problems land here in the admin-flow
          milestone.
        </p>
      </main>
    </div>
  );
}
