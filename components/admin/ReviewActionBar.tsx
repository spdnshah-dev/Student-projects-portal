"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveProfileAction,
  approveProjectAction,
  sendBackProfileAction,
  sendBackProjectAction,
  type ActionResult,
} from "@/app/admin/actions";

export function ReviewActionBar({
  targetType,
  id,
  backHref,
  approveLabel = "Publish",
  subjectName,
}: {
  targetType: "PROJECT" | "PROFILE";
  id: string;
  backHref: string;
  approveLabel?: string;
  subjectName: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "sendback">("idle");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handle(res: ActionResult) {
    if ("error" in res) {
      setError(res.error);
      setPending(false);
      return;
    }
    router.push(backHref);
    router.refresh();
  }

  async function approve() {
    setPending(true);
    setError(null);
    handle(
      targetType === "PROJECT"
        ? await approveProjectAction(id)
        : await approveProfileAction(id),
    );
  }

  async function sendBack() {
    if (!note.trim()) {
      setError("Write a note telling the student what to fix.");
      return;
    }
    setPending(true);
    setError(null);
    handle(
      targetType === "PROJECT"
        ? await sendBackProjectAction(id, note)
        : await sendBackProfileAction(id, note),
    );
  }

  return (
    <div className="flex flex-col gap-3 border-t border-line bg-white p-5">
      {error && (
        <div
          role="alert"
          className="rounded-[10px] border border-state-sentback/30 bg-state-sentback/5 px-3.5 py-2.5 text-[13px] font-medium text-state-sentback"
        >
          {error}
        </div>
      )}

      {mode === "idle" ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMode("sendback")}
              disabled={pending}
              className="h-[42px] rounded-[21px] border border-line-input bg-white px-4 font-semibold text-brand-ink disabled:opacity-60"
            >
              Send back with a note
            </button>
            <button
              type="button"
              onClick={approve}
              disabled={pending}
              className="flex h-[42px] items-center gap-2 rounded-[21px] bg-state-published px-5 text-[15px] font-semibold text-white disabled:opacity-60"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3.5 8.5l3 3 6-7" />
              </svg>
              {pending ? "Working…" : approveLabel}
            </button>
          </div>
          <div className="text-right text-xs text-brand-muted">
            Goes live on {subjectName}&apos;s profile and the home page straight
            away.
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <div className="text-base font-bold">Send back to {subjectName}</div>
            <div className="text-[13px] text-brand-muted">
              It stays private. {subjectName} sees exactly what you write here.
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sb-note" className="font-semibold">
              Note to the student
            </label>
            <textarea
              id="sb-note"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Say what to fix and what to do next."
              className="min-h-[96px] resize-y rounded-[10px] border border-line-input bg-white p-3 text-sm leading-relaxed text-brand-ink"
            />
            <div className="text-xs text-brand-muted">A note is required.</div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setMode("idle");
                setError(null);
              }}
              disabled={pending}
              className="h-[42px] px-2 font-semibold text-brand-muted disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={sendBack}
              disabled={pending}
              className="h-[42px] rounded-[21px] bg-brand-ink px-5 text-[15px] font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Sending…" : `Send back to ${subjectName}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
