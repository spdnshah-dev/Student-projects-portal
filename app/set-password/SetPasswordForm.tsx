"use client";

import { useActionState, useState } from "react";
import { setPasswordAction, type FormState } from "./actions";

const initial: FormState = {};

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3.5">
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-ink text-xs font-bold text-white">
        {n}
      </div>
      <div className="flex min-w-0 flex-grow flex-col gap-1.5">{children}</div>
    </div>
  );
}

export function SetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    setPasswordAction,
    initial,
  );
  const [showPw, setShowPw] = useState(false);

  const fieldCls =
    "h-[42px] w-full rounded-[10px] border border-line-input bg-white px-3.5 text-sm text-brand-ink";

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && (
        <div
          role="alert"
          className="rounded-[10px] border border-state-sentback/30 bg-state-sentback/5 px-3.5 py-2.5 text-[13px] font-medium text-state-sentback"
        >
          {state.error}
        </div>
      )}

      <Step n={1}>
        <label htmlFor="sp-email" className="font-semibold">
          Email address
        </label>
        <input
          id="sp-email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="name@example.com"
          required
          className={fieldCls}
        />
        <p className="text-[13px] text-brand-muted">
          Use the email a Learnbay admin added for you.
        </p>
      </Step>

      <Step n={2}>
        <label htmlFor="sp-password" className="font-semibold">
          Create a password
        </label>
        <div className="flex gap-2">
          <input
            id="sp-password"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
            required
            className={fieldCls + " min-w-0 flex-grow"}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-pressed={showPw}
            className="h-[42px] w-[68px] flex-shrink-0 rounded-[10px] border border-line-input bg-white font-semibold text-brand-ink"
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
        <p className="text-[13px] text-brand-muted">Use at least 8 characters.</p>
      </Step>

      <button
        type="submit"
        disabled={pending}
        className="flex h-[42px] items-center justify-center rounded-[21px] bg-brand-accent text-[15px] font-semibold text-white hover:bg-brand-accent-hover disabled:opacity-60"
      >
        {pending ? "Setting password…" : "Set password and log in"}
      </button>
    </form>
  );
}
