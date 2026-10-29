"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { COURSE_LABELS, COURSE_OPTIONS } from "@/lib/constants";
import { addUserAction, type ActionResult } from "../actions";

const initial: ActionResult = {};
const fieldCls =
  "h-[42px] w-full rounded-[10px] border border-line-input bg-white px-3.5 text-sm text-brand-ink";

/**
 * Super admin: add an admin (email + optional name) or a student (name, email,
 * course, batch start date → generated Student ID).
 */
export function AddUserForm() {
  const [state, formAction, pending] = useActionState(addUserAction, initial);
  const [role, setRole] = useState<"STUDENT" | "ADMIN">("STUDENT");
  const formRef = useRef<HTMLFormElement>(null);
  const isStudent = role === "STUDENT";

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
        <div role="status" className="text-[13px] font-medium text-state-published">
          {state.studentId ? (
            <>
              Student added with ID{" "}
              <span className="font-mono font-bold">{state.studentId}</span>.
              They can now set a password at /set-password.
            </>
          ) : (
            "Added. They can now set a password at /set-password."
          )}
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_1.6fr_auto] lg:items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">Role</span>
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value === "ADMIN" ? "ADMIN" : "STUDENT")}
            className={fieldCls}
          >
            <option value="STUDENT">Student</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">
            Name {isStudent ? "" : "(optional)"}
          </span>
          <input name="name" type="text" required={isStudent} autoComplete="off" className={fieldCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">Email</span>
          <input name="email" type="email" required placeholder="name@example.com" className={fieldCls} />
        </label>
        {!isStudent && (
          <button
            type="submit"
            disabled={pending}
            className="h-[42px] rounded-[21px] bg-brand-accent px-5 font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Adding…" : "Add"}
          </button>
        )}
      </div>
      {isStudent && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_auto] lg:items-end">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold">Course</span>
            <select name="course" required defaultValue="" className={fieldCls}>
              <option value="" disabled>
                Choose a course
              </option>
              {COURSE_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {COURSE_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold">Batch start date</span>
            <input name="batchStartDate" type="date" required className={fieldCls} />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="h-[42px] rounded-[21px] bg-brand-accent px-5 font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Adding…" : "Add student"}
          </button>
        </div>
      )}
      <p className="m-0 text-[13px] text-brand-muted">
        A student&apos;s name is private to admins. Visitors see the generated
        Student ID (course abbreviation, batch date, running number).
      </p>
    </form>
  );
}
