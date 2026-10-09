"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { acceptConsentAction, type FormState } from "./actions";

const initial: FormState = {};

export function ConsentForm() {
  const [state, formAction, pending] = useActionState(
    acceptConsentAction,
    initial,
  );
  const [a1, setA1] = useState(false);
  const [a2, setA2] = useState(false);
  const bothTicked = a1 && a2;

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

      <div className="flex flex-col gap-3">
        <label htmlFor="cs-1" className="flex cursor-pointer items-start gap-3">
          <input
            id="cs-1"
            name="agree1"
            type="checkbox"
            checked={a1}
            onChange={(e) => setA1(e.target.checked)}
            className="mt-0.5 h-5 w-5 flex-shrink-0 accent-brand-accent"
          />
          <span className="text-pretty">
            I have read and agree to how Learnbay will show my profile and
            projects.
          </span>
        </label>
        <label htmlFor="cs-2" className="flex cursor-pointer items-start gap-3">
          <input
            id="cs-2"
            name="agree2"
            type="checkbox"
            checked={a2}
            onChange={(e) => setA2(e.target.checked)}
            className="mt-0.5 h-5 w-5 flex-shrink-0 accent-brand-accent"
          />
          <span className="text-pretty">
            The projects and files I share are my own work.
          </span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!bothTicked || pending}
          className="flex h-[46px] items-center justify-center rounded-[23px] bg-brand-accent px-6 text-[15px] font-bold text-white hover:bg-brand-accent-hover disabled:opacity-50"
        >
          {pending ? "Saving…" : "Agree and continue"}
        </button>
        <Link
          href="/login"
          className="flex h-[46px] items-center rounded-[23px] border border-line-input bg-white px-5 font-semibold text-brand-ink no-underline"
        >
          Cancel
        </Link>
        <span className="text-[13px] text-brand-muted">
          Both boxes must be ticked to continue.
        </span>
      </div>
    </form>
  );
}
