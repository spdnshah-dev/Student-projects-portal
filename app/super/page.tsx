import type { Metadata } from "next";
import { SignedInBar } from "@/components/auth/SignedInBar";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Super admin" };

export default async function SuperOverviewPage() {
  const user = await requireRole("SUPER_ADMIN");

  return (
    <div className="flex min-h-screen flex-col">
      <SignedInBar user={user} />
      <main className="mx-auto w-full max-w-shell flex-grow px-6 py-10">
        <h1 className="m-0 text-2xl font-bold tracking-tight">
          Super admin overview
        </h1>
        <p className="mt-2 max-w-md text-sm text-brand-muted">
          You&apos;re signed in as the super admin. Managing admins and students,
          plus reading the AI conversation logs, land here in later milestones.
        </p>
      </main>
    </div>
  );
}
