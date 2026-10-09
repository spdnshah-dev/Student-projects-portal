import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHome } from "@/lib/auth/roles";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

const SUPPORT_EMAIL = "support@learnbay.co";

export default async function LoginPage() {
  // Already signed in? Go straight to the role's home.
  const user = await getCurrentUser();
  if (user) redirect(roleHome(user.role));

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      <header className="flex h-16 flex-shrink-0 items-center border-b border-line bg-white px-5">
        <Logo href="/" />
      </header>

      <main className="flex flex-grow flex-col items-center gap-[18px] px-5 py-8 sm:px-10">
        <div className="w-full max-w-[420px] rounded-2xl border border-line bg-white p-8 shadow-[0_1px_2px_rgba(16,24,43,0.05),0_12px_32px_rgba(16,24,43,0.06)]">
          <div className="mb-[18px] flex flex-col gap-2">
            <h1 className="m-0 text-2xl font-bold leading-tight tracking-tight">
              Log in
            </h1>
            <p className="m-0 text-sm text-brand-muted">
              For Learnbay students and admins. Use the email address Learnbay
              has on record for you.
            </p>
          </div>
          <LoginForm />
        </div>

        <div className="flex w-full max-w-[420px] flex-col gap-1.5 text-center text-[13px] text-brand-muted">
          <div>
            Just browsing? You don&apos;t need an account.{" "}
            <Link
              href="/"
              className="font-semibold text-brand-accent no-underline"
            >
              See all projects
            </Link>
          </div>
          <div>
            Email not recognised? Write to{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-semibold text-brand-accent no-underline"
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            to be added.
          </div>
        </div>
      </main>
    </div>
  );
}
