"use client";

import { useActionState } from "react";
import { saveProfileAction, type FormState } from "./actions";
import {
  COURSE_COMPLETED_LABELS,
  COURSE_COMPLETED_OPTIONS,
  DOMAIN_LABELS,
  DOMAIN_OPTIONS,
} from "@/lib/constants";
import { initials, avatarClasses } from "@/lib/initials";

const initial: FormState = {};

export type ProfileDefaults = {
  fullName: string;
  email: string;
  headline: string;
  about: string;
  yearsExperience: string;
  domain: string;
  courseCompleted: string;
  linkedinUrl: string;
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
  const name = defaults.fullName || defaults.email;

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

      {/* Photo */}
      <div className="flex items-center gap-5">
        <span
          className={`flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-full text-2xl font-bold ${avatarClasses(name)}`}
        >
          {initials(name)}
        </span>
        <div className="flex flex-col gap-2">
          <div className="font-semibold">Profile photo</div>
          <button
            type="button"
            disabled
            title="Photo upload arrives with the file-upload milestone"
            className="h-[38px] w-fit rounded-field border border-line-input bg-white px-4 font-semibold text-brand-ink disabled:opacity-50"
          >
            Upload photo
          </button>
          <div className={hintCls}>
            Photo upload is added with the certificate/file-upload milestone.
          </div>
        </div>
      </div>

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

      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pf-course" className={labelCls}>
            Course completed
          </label>
          <select
            id="pf-course"
            name="courseCompleted"
            defaultValue={defaults.courseCompleted}
            className={fieldCls}
          >
            <option value="">Select a course</option>
            {COURSE_COMPLETED_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {COURSE_COMPLETED_LABELS[c]}
              </option>
            ))}
          </select>
          <div className={hintCls}>The Learnbay course you finished.</div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pf-linkedin" className={labelCls}>
            LinkedIn profile link{" "}
            <span className="font-normal text-brand-muted">(optional)</span>
          </label>
          <input
            id="pf-linkedin"
            name="linkedinUrl"
            type="url"
            defaultValue={defaults.linkedinUrl}
            placeholder="https://www.linkedin.com/in/your-name"
            className={fieldCls}
          />
        </div>
      </div>

      <div className="h-px bg-line" />

      {/* Certificates — upload wired at the file-upload milestone */}
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-base font-bold">
          Certificates{" "}
          <span className="text-sm font-normal text-brand-muted">
            (optional)
          </span>
        </h2>
        <div className="rounded-xl border border-dashed border-line-strong bg-surface-canvas p-4 text-sm text-brand-muted">
          Certificate uploads (with malware scanning and image re-encoding)
          arrive at the file-upload milestone. You&apos;ll add a name, issuer,
          and image here.
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
