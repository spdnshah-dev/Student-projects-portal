import type { Metadata } from "next";
import { SignedInBar } from "@/components/auth/SignedInBar";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireRole("STUDENT");

  return (
    <div className="flex min-h-screen flex-col">
      <SignedInBar user={user} />
      <main className="mx-auto w-full max-w-shell flex-grow px-6 py-10">
        <h1 className="m-0 text-2xl font-bold tracking-tight">
          Welcome{user.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-2 max-w-md text-sm text-brand-muted">
          You&apos;re signed in as a student. Your projects, their review states,
          and the Link problems tab land here in the student-flow milestone.
        </p>
      </main>
    </div>
  );
}
