"use client";

import { useActionState } from "react";
import { saveProfileAction, type FormState } from "./actions";
import { DOMAIN_LABELS, DOMAIN_OPTIONS } from "@/lib/constants";

const initial: FormState = {};

export type ProfileDefaults = {
  fullName: string;
  email: string;
  /** Read-only, set by the admin who added the student. */
  studentId: string;
  /** Read-only course label, set by the admin who added the student. */
  course: string;
  headline: string;
  about: string;
  yearsExperience: string;
  domain: string;
};

const fieldCls =
  "h-[42px] w-full rounded-[10px] border border-line-input bg-white px-3.5 text-sm text-brand-ink";
const labelCls = "font-semibold";
const hintCls = "text-[13px] text-brand-muted";

export function ProfileForm({ defaults }: { defaults: ProfileDefaults }) {
  const [state, formAction, pending] = useActionState(
    saveProfileAction,
    initial,
  );

  return (
    <form action={formAction} className="flex flex-col gap-[22px]">
      {state.error && (
        <div
          role="alert"
          className="rounded-[10px] border border-state-sentback/30 bg-state-sentback/5 px-3.5 py-2.5 text-[13px] font-medium text-state-sentback"
        >
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pf-name" className={labelCls}>
            Full name
          </label>
          <input
            id="pf-name"
            name="fullName"
            type="text"
            autoComplete="name"
            defaultValue={defaults.fullName}
            required
            className={fieldCls}
          />
          <div className={hintCls}>
            Private — only Learnbay admins see your name. Visitors see your
            Student ID.
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pf-email" className={labelCls}>
            Email address
          </label>
          <input
            id="pf-email"
            type="email"
            defaultValue={defaults.email}
            disabled
            className="h-[42px] w-full rounded-[10px] border border-line-strong bg-surface-sunken px-3.5 text-sm text-brand-muted"
          />
          <div className={hintCls}>
            Added by a Learnbay admin. Not shown on your public profile.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pf-student-id" className={labelCls}>
            Student ID
          </label>
          <input
            id="pf-student-id"
            type="text"
            defaultValue={defaults.studentId || "Not assigned yet"}
            disabled
            className="h-[42px] w-full rounded-[10px] border border-line-strong bg-surface-sunken px-3.5 text-sm font-semibold text-brand-ink-soft"
          />
          <div className={hintCls}>
            This is how visitors see you on the public site.
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pf-course" className={labelCls}>
            Course
          </label>
          <input
            id="pf-course"
            type="text"
            defaultValue={defaults.course || "Not set"}
            disabled
            className="h-[42px] w-full rounded-[10px] border border-line-strong bg-surface-sunken px-3.5 text-sm text-brand-muted"
          />
          <div className={hintCls}>
            Set by a Learnbay admin. Ask them if it needs changing.
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pf-headline" className={labelCls}>
          Headline <span className="font-normal text-brand-muted">(optional)</span>
        </label>
        <input
          id="pf-headline"
          name="headline"
          type="text"
          defaultValue={defaults.headline}
          placeholder="For example, Data Scientist focused on BFSI risk models"
          className={fieldCls}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pf-about" className={labelCls}>
          About you
        </label>
        <textarea
          id="pf-about"
          name="about"
          rows={4}
          defaultValue={defaults.about}
          placeholder="A short paragraph about your work and what you enjoy building. Visitors read this on your profile."
          className="min-h-[104px] w-full resize-y rounded-[10px] border border-line-input bg-white p-3.5 text-sm leading-relaxed text-brand-ink"
        />
      </div>

      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pf-exp" className={labelCls}>
            Years of experience
          </label>
          <input
            id="pf-exp"
            name="yearsExperience"
            type="number"
            min={0}
            max={70}
            defaultValue={defaults.yearsExperience}
            className={fieldCls}
          />
          <div className={hintCls}>Enter 0 if you are a fresher.</div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pf-domain" className={labelCls}>
            Domain you work in
          </label>
          <select
            id="pf-domain"
            name="domain"
            defaultValue={defaults.domain}
            className={fieldCls}
          >
            <option value="">Select a domain</option>
            {DOMAIN_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {DOMAIN_LABELS[d]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="sticky bottom-0 -mx-7 -mb-7 flex items-center gap-3 rounded-b-2xl border-t border-line bg-white px-7 py-3.5 shadow-[0_-6px_16px_rgba(16,24,43,0.05)]">
        <button
          type="submit"
          disabled={pending}
          className="flex h-[42px] items-center rounded-[21px] bg-brand-accent px-6 text-[15px] font-semibold text-white hover:bg-brand-accent-hover disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save and continue"}
        </button>
      </div>
    </form>
  );
}
