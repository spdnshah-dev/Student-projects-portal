import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHome } from "@/lib/auth/roles";
import { googleConfigured } from "@/lib/auth/google";
import { DENIAL_MESSAGES } from "@/lib/auth/student-gate";
import { LoginForm } from "./LoginForm";
import { GoogleSignInButton } from "./GoogleSignInButton";

export const metadata: Metadata = { title: "Log in" };

const SUPPORT_EMAIL = "support@learnbay.co";

// Why a Google sign-in was refused, keyed by the ?error= code the callback
// route redirects with. Only the exact codes below are recognised.
const ERRORS: Record<string, { title: string; body: string; tone: "warn" | "error" }> = {
  not_registered: {
    title: "Your email isn't registered",
    body: DENIAL_MESSAGES.not_registered,
    tone: "error",
  },
  disabled: {
    title: "Account disabled",
    body: DENIAL_MESSAGES.disabled,
    tone: "error",
  },
  mismatch: {
    title: "Different Google account",
    body: DENIAL_MESSAGES.mismatch,
    tone: "error",
  },
  unverified: {
    title: "Email not verified",
    body: "Google hasn't verified the email on that account, so we can't use it. Verify it with Google and try again.",
    tone: "error",
  },
  cancelled: {
    title: "Sign-in cancelled",
    body: "You closed the Google sign-in before it finished. Try again when you're ready.",
    tone: "warn",
  },
  google_off: {
    title: "Google sign-in isn't set up yet",
    body: "Ask a Learnbay admin to finish setting up Google sign-in.",
    tone: "warn",
  },
  google: {
    title: "Sign-in didn't complete",
    body: "Something went wrong talking to Google. Please try again.",
    tone: "warn",
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  // Already signed in? Go straight to the role's home.
  const user = await getCurrentUser();
  if (user) redirect(roleHome(user.role));

  const raw = (await searchParams).error;
  const code = Array.isArray(raw) ? raw[0] : raw;
  const problem = code ? ERRORS[code] : undefined;
  const googleOn = googleConfigured();

  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      <header className="flex h-16 flex-shrink-0 items-center border-b border-line bg-white px-5">
        <Logo href="/" />
      </header>

      <main className="flex flex-grow flex-col items-center gap-[18px] px-5 py-8 sm:px-10">
        {/* Students: Google only */}
        <div className="w-full max-w-[420px] rounded-2xl border border-line bg-white p-8 shadow-[0_1px_2px_rgba(16,24,43,0.05),0_12px_32px_rgba(16,24,43,0.06)]">
          <div className="mb-[18px] flex flex-col gap-2">
            <h1 className="m-0 text-2xl font-bold leading-tight tracking-tight">
              Student log in
            </h1>
            <p className="m-0 text-sm text-brand-muted">
              Sign in with the Gmail address your Learnbay admin added for you.
              No password needed.
            </p>
          </div>

          {problem && (
            <div
              role="alert"
              className={`mb-4 flex flex-col gap-1 rounded-[10px] border px-3.5 py-3 text-[13px] ${
                problem.tone === "error"
                  ? "border-state-sentback/30 bg-state-sentback/5 text-state-sentback"
                  : "border-[#F3D9A4] bg-[#FFF7E6] text-[#6B4A00]"
              }`}
            >
              <span className="font-bold">{problem.title}</span>
              <span>{problem.body}</span>
            </div>
          )}

          <GoogleSignInButton disabled={!googleOn} />
          {!googleOn && !problem && (
            <p className="mt-3 text-[13px] text-brand-muted">
              Google sign-in isn&apos;t set up on this deployment yet.
            </p>
          )}
        </div>

        {/* Staff: email + password (unchanged) */}
        <details className="w-full max-w-[420px] rounded-2xl border border-line bg-white shadow-card [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-4 text-sm font-semibold">
            Learnbay admin? Log in with email and password
            <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" className="fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 8l5 5 5-5" />
            </svg>
          </summary>
          <div className="border-t border-line px-6 pb-6 pt-5">
            <LoginForm />
          </div>
        </details>

        <div className="flex w-full max-w-[420px] flex-col gap-1.5 text-center text-[13px] text-brand-muted">
          <div>
            Just browsing? You don&apos;t need an account.{" "}
            <Link href="/" className="font-semibold text-brand-accent no-underline">
              See all projects
            </Link>
          </div>
          <div>
            Email not recognised? Write to{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-brand-accent no-underline">
              {SUPPORT_EMAIL}
            </a>{" "}
            to be added.
          </div>
        </div>
      </main>
    </div>
  );
}
