import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Link problems" };

export default async function AdminLinksPage() {
  const user = await requireRole(ADMIN_ROLES);

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      <AdminHeader user={user} active="links" />
      <main className="mx-auto flex w-full max-w-shell flex-grow flex-col gap-3 px-8 py-7">
        <h1 className="m-0 text-2xl font-bold tracking-tight">Link problems</h1>
        <div className="rounded-card border border-dashed border-line-strong bg-white px-6 py-12 text-center text-sm text-brand-muted">
          Broken links across all students appear here once the SSRF-safe daily
          link checker is built (its milestone). It will list which published
          links aren&apos;t working, who is affected, and since when.
        </div>
      </main>
    </div>
  );
}
