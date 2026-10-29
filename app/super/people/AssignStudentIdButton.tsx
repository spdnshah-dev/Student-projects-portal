"use client";

import { useEffect, useState, useTransition } from "react";
import { COURSE_LABELS, COURSE_OPTIONS } from "@/lib/constants";
import { assignStudentIdAction } from "../actions";

const fieldCls =
  "h-[42px] w-full rounded-[10px] border border-line-input bg-white px-3.5 text-sm text-brand-ink";

/**
 * Super-admin control for a student who was added before Student IDs existed:
 * pick their course and batch start date and the ID is generated the same way
 * as for a newly added student.
 */
export function AssignStudentIdButton({
  userId,
  studentName,
}: {
  userId: string;
  studentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [course, setCourse] = useState("");
  const [batch, setBatch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function save() {
    setError(null);
    start(async () => {
      const res = await assignStudentIdAction(userId, course, batch);
      if (res.error) setError(res.error);
      else setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="h-8 rounded-pill border border-brand-accent bg-white px-3 text-[13px] font-semibold text-brand-accent"
      >
        Assign ID
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_48px_rgba(16,24,43,0.28)]"
          >
            <div className="flex flex-col gap-1 border-b border-line px-5 py-4">
              <h2 className="m-0 text-lg font-bold">Student ID for {studentName}</h2>
              <p className="m-0 text-sm text-brand-muted">
                Choose the course and batch. The ID is generated from them and
                becomes how visitors see this student.
              </p>
            </div>
            <div className="flex flex-col gap-3 p-5">
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold">Course</span>
                <select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className={fieldCls}
                >
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
                <input
                  type="date"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className={fieldCls}
                />
              </label>
              {error && (
                <div role="alert" className="text-[13px] font-medium text-state-sentback">
                  {error}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-line px-5 py-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="h-[38px] rounded-pill px-4 text-sm font-semibold text-brand-ink-soft disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={pending || !course || !batch}
                className="h-[38px] rounded-pill bg-brand-accent px-5 text-sm font-semibold text-white hover:bg-brand-accent-hover disabled:opacity-60"
              >
                {pending ? "Assigning…" : "Assign ID"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
