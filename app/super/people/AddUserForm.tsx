"use client";

import { useActionState, useEffect, useRef } from "react";
import { addUserAction, type ActionResult } from "../actions";

const initial: ActionResult = {};
const fieldCls =
  "h-[42px] w-full rounded-[10px] border border-line-input bg-white px-3.5 text-sm text-brand-ink";

export function AddUserForm() {
  const [state, formAction, pending] = useActionState(addUserAction, initial);
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
      <div className="font-bold">Add an admin or student</div>
      {state.error && (
        <div role="alert" className="text-[13px] font-medium text-state-sentback">
          {state.error}
        </div>
      )}
      {state.ok && (
        <div className="text-[13px] font-medium text-state-published">
          Added. They can now set a password at /set-password.
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1.5fr_1fr_auto] sm:items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">Email</span>
          <input name="email" type="email" required placeholder="name@example.com" className={fieldCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">Name (optional)</span>
          <input name="name" type="text" className={fieldCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">Role</span>
          <select name="role" defaultValue="STUDENT" className={fieldCls}>
            <option value="STUDENT">Student</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-[42px] rounded-[21px] bg-brand-accent px-5 font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
    </form>
  );
}
