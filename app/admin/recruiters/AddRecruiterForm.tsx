"use client";

import { useActionState, useEffect, useRef } from "react";
import { addRecruiterAction } from "../actions";

const fieldCls =
  "h-[42px] w-full rounded-[10px] border border-line-input bg-white px-3.5 text-sm text-brand-ink";

export function AddRecruiterForm() {
  const [state, formAction, pending] = useActionState(addRecruiterAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-card border border-line bg-white p-5 shadow-card"
    >
      <div className="font-bold">Add a recruiter</div>
      <p className="m-0 text-sm text-brand-muted">
        Add their email. They then confirm it and set their own password at{" "}
        <code>/set-password</code>. Recruiters browse the site like a visitor
        and can open students&apos; LinkedIn profiles.
      </p>
      {state.error && (
        <div role="alert" className="text-[13px] font-medium text-state-sentback">
          {state.error}
        </div>
      )}
      {state.ok && (
        <div role="status" className="text-[13px] font-medium text-state-published">
          Recruiter added. Ask them to set their password.
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">Email</span>
          <input name="email" type="email" required className={fieldCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">Name (optional)</span>
          <input name="name" type="text" className={fieldCls} />
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-[38px] w-fit rounded-pill bg-brand-accent px-5 text-sm font-semibold text-white hover:bg-brand-accent-hover disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add recruiter"}
      </button>
    </form>
  );
}
