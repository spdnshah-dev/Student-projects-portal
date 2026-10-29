"use client";

import { useActionState, useEffect, useRef } from "react";
import { COURSE_LABELS, COURSE_OPTIONS } from "@/lib/constants";
import type { AddStudentState } from "@/lib/student-form";

const fieldCls =
  "h-[42px] w-full rounded-[10px] border border-line-input bg-white px-3.5 text-sm text-brand-ink";

/**
 * Add a student: name, email, course and batch start date. The server
 * generates the Student ID (course abbreviation + batch date + counter) and
 * shows it back here so the admin can pass it on.
 */
export function AddStudentForm({
  action,
}: {
  action: (prev: AddStudentState, formData: FormData) => Promise<AddStudentState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
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
      <div className="font-bold">Add a student</div>
      <p className="m-0 text-sm text-brand-muted">
        The student&apos;s name stays private to admins; visitors see the Student
        ID, which is generated from the course and batch. The student sets their
        own password at <code>/set-password</code>.
      </p>
      {state.error && (
        <div role="alert" className="text-[13px] font-medium text-state-sentback">
          {state.error}
        </div>
      )}
      {state.ok && (
        <div role="status" className="text-[13px] font-medium text-state-published">
          Student added with ID{" "}
          <span className="font-mono font-bold">{state.studentId}</span>. Ask them
          to set their password.
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1.6fr_1.4fr_1fr_auto] lg:items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">Name</span>
          <input name="name" type="text" required autoComplete="off" className={fieldCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">Email</span>
          <input name="email" type="email" required placeholder="name@example.com" className={fieldCls} />
        </label>
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
          className="h-[42px] rounded-[21px] bg-brand-accent px-5 font-semibold text-white hover:bg-brand-accent-hover disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add student"}
        </button>
      </div>
    </form>
  );
}
