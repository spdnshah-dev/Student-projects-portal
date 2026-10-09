import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHome } from "@/lib/auth/roles";
import { SetPasswordForm } from "./SetPasswordForm";

export const metadata: Metadata = { title: "Set your password" };

export default async function SetPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect(roleHome(user.role));

  const testMode = process.env.FIXED_PASSWORD_TEST_MODE !== "false";

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      <header className="flex h-16 flex-shrink-0 items-center border-b border-line bg-white px-5">
        <Logo href="/" />
      </header>

      <main className="flex flex-grow flex-col items-center gap-4 px-5 py-7 sm:px-10">
        <div className="w-full max-w-[460px] rounded-2xl border border-line bg-white p-8 shadow-[0_1px_2px_rgba(16,24,43,0.05),0_12px_32px_rgba(16,24,43,0.06)]">
          <div className="mb-5 flex flex-col gap-2">
            <h1 className="m-0 text-2xl font-bold leading-tight tracking-tight">
              Set your password
            </h1>
            <p className="m-0 text-sm text-brand-muted">
              A Learnbay admin must have added your email first.
            </p>
            {testMode && (
              <p className="m-0 rounded-[10px] bg-surface-sunken px-3 py-2 text-[13px] text-brand-muted">
                Test phase: the email verification code is skipped for now.
              </p>
            )}
          </div>
          <SetPasswordForm />
          <p className="mt-5 text-[13px] text-brand-muted">
            Already set a password?{" "}
            <Link
              href="/login"
              className="font-semibold text-brand-accent no-underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
