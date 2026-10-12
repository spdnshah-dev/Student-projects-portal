"use client";

import { useEffect, useState, useTransition } from "react";
import { setAdminAssignmentsAction } from "../actions";

type Student = { id: string; name: string | null; email: string };

/**
 * Super-admin control to choose which students a given admin may review. The
 * admin then only sees those students across the whole admin area.
 */
export function AssignStudentsButton({
  adminId,
  adminName,
  students,
  assignedIds,
}: {
  adminId: string;
  adminName: string;
  students: Student[];
  assignedIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(assignedIds));
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

  function openModal() {
    setSelected(new Set(assignedIds));
    setError(null);
    setOpen(true);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function save() {
    setError(null);
    start(async () => {
      const res = await setAdminAssignmentsAction(adminId, Array.from(selected));
      if (res.error) setError(res.error);
      else setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="h-8 rounded-pill border border-line-input bg-white px-3 text-[13px] font-semibold text-brand-ink"
      >
        Students ({assignedIds.length})
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_48px_rgba(16,24,43,0.28)]"
          >
            <div className="flex flex-col gap-1 border-b border-line px-5 py-4">
              <h2 className="m-0 text-lg font-bold">Students for {adminName}</h2>
              <p className="m-0 text-sm text-brand-muted">
                This admin can review only the students you tick. The super admin
                always sees everyone.
              </p>
            </div>

            <div className="min-h-0 flex-grow overflow-auto p-2">
              {students.length === 0 ? (
                <p className="m-0 px-3 py-6 text-center text-brand-muted">
                  No students yet.
                </p>
              ) : (
                students.map((s) => (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 hover:bg-surface-canvas"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggle(s.id)}
                      className="h-4 w-4 flex-shrink-0 accent-brand-accent"
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold">
                        {s.name ?? s.email}
                      </span>
                      <span className="truncate text-[13px] text-brand-muted">
                        {s.email}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="px-5 py-1 text-[13px] font-medium text-state-sentback"
              >
                {error}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
              <span className="text-[13px] text-brand-muted">
                {selected.size} selected
              </span>
              <div className="flex gap-3">
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
                  disabled={pending}
                  className="h-[38px] rounded-pill bg-brand-accent px-5 text-sm font-semibold text-white hover:bg-brand-accent-hover disabled:opacity-60"
                >
                  {pending ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
