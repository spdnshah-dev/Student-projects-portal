"use client";

import { useEffect, useRef, useState } from "react";
import { initials, avatarClasses } from "@/lib/initials";

type Phase = "loading" | "ready" | "slow";

const STATUS: Record<Phase, { text: string; color: string }> = {
  loading: { text: "Getting the project ready", color: "var(--brand-accent)" },
  ready: { text: "Your project is ready", color: "#1B6B3C" },
  slow: { text: "This is taking longer than usual", color: "#8A5A00" },
};

export function OpenProjectDialog({
  projectId,
  liveUrl,
  title,
  description,
  studentName,
  studentMeta,
}: {
  projectId: string;
  liveUrl: string;
  title: string;
  description: string;
  studentName: string;
  studentMeta?: string;
}) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("loading");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openInNewTab() {
    window.open(liveUrl, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const start = Date.now();
    setPhase("loading");

    async function tick() {
      let ok = false;
      try {
        const res = await fetch(`/api/projects/${projectId}/check`, {
          method: "POST",
        });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
        ok = Boolean(data.ok);
      } catch {
        ok = false;
      }
      if (cancelled) return;
      if (ok) {
        setPhase("ready");
        return; // stop polling once it answers
      }
      const elapsed = Date.now() - start;
      if (elapsed >= 90_000) setPhase("slow");
      timerRef.current = setTimeout(tick, elapsed >= 90_000 ? 15_000 : 5_000);
    }

    tick();
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open, projectId]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const status = STATUS[phase];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 flex-shrink-0 items-center gap-2.5 rounded-3xl bg-white px-6 text-base font-bold text-brand-ink"
      >
        Open project
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11.5 4h4.5v4.5M16 4l-6.5 6.5M14 11.5V16H4V6h4.5" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/60 p-6"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="open-title"
            onClick={(e) => e.stopPropagation()}
            className="relative flex w-[560px] max-w-full flex-col overflow-hidden rounded-[20px] bg-white shadow-sheet"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#F1F3F7] text-brand-ink"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true" className="fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" /></svg>
            </button>

            {/* mark + status */}
            <div className="flex flex-col items-center gap-3.5 px-9 pb-5 pt-8 text-center">
              <div className="relative h-[92px] w-[92px]">
                {phase === "loading" && (
                  <>
                    <div data-lb-anim className="absolute inset-1 rounded-full bg-brand-accent" style={{ animation: "lb-pulse 1.8s ease-out infinite" }} />
                    <div data-lb-anim className="absolute inset-0 rounded-full border-[3px] border-[#DCE6FA]" style={{ borderTopColor: "var(--brand-accent)", borderRightColor: "var(--brand-accent)", animation: "lb-spin 1.1s linear infinite" }} />
                  </>
                )}
                {phase === "ready" && <div className="absolute inset-0 rounded-full border-[3px] border-state-published" />}
                {phase === "slow" && <div className="absolute inset-0 rounded-full border-[3px] border-dashed border-[#D99A06]" />}
                <div className="absolute left-5 top-5 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-brand-accent text-[28px] font-bold leading-none text-white">
                  L
                </div>
                {phase === "ready" && (
                  <div className="absolute -bottom-1 -right-1 flex h-[30px] w-[30px] items-center justify-center rounded-full border-[3px] border-white bg-state-published">
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="fill-none stroke-white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg>
                  </div>
                )}
                {phase === "slow" && (
                  <div className="absolute -bottom-1 -right-1 flex h-[30px] w-[30px] items-center justify-center rounded-full border-[3px] border-white bg-[#FAB219]">
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="fill-none stroke-[#3B2A00]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4.5V8l2.5 1.5" /></svg>
                  </div>
                )}
              </div>
              <div aria-live="polite" className="text-sm font-bold" style={{ color: status.color }}>
                {status.text}
              </div>
              <div className="flex flex-col items-center gap-2">
                <h2 id="open-title" className="m-0 text-2xl font-bold leading-tight tracking-tight">
                  {title}
                </h2>
                <div className="flex items-center gap-2 text-brand-muted">
                  <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${avatarClasses(studentName)}`}>
                    {initials(studentName)}
                  </span>
                  <span>
                    <span className="font-semibold text-brand-ink">{studentName}</span>
                    {studentMeta ? ` · ${studentMeta}` : ""}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-9">
              <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-surface-canvas px-4 py-3.5">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                  About this project
                </div>
                <div className="leading-relaxed text-brand-ink-soft text-pretty">
                  {description}
                </div>
              </div>
            </div>

            {phase === "loading" && (
              <div className="flex flex-col items-center gap-3 px-9 pb-6 pt-5">
                <div role="progressbar" aria-label="Getting the project ready" className="h-1.5 w-full overflow-hidden rounded-full bg-[#E6EAF1]">
                  <div data-lb-anim className="h-1.5 w-[28%] rounded-full bg-brand-accent" style={{ animation: "lb-slide 1.5s ease-in-out infinite" }} />
                </div>
                <div className="text-center text-[13px] text-brand-muted text-pretty">
                  Waking the project up on the student&apos;s hosting. This
                  usually takes a few seconds and can take up to a minute.
                </div>
                <button type="button" onClick={() => setOpen(false)} className="h-[38px] px-4 font-semibold text-brand-muted">
                  Cancel
                </button>
              </div>
            )}

            {phase === "ready" && (
              <div className="flex flex-col items-center gap-2.5 px-9 pb-6 pt-5">
                <button type="button" onClick={openInNewTab} className="flex h-12 w-full items-center justify-center gap-2.5 rounded-3xl bg-brand-accent text-base font-bold text-white hover:bg-brand-accent-hover">
                  Open project
                  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11.5 4h4.5v4.5M16 4l-6.5 6.5M14 11.5V16H4V6h4.5" /></svg>
                </button>
                <div className="text-center text-[13px] text-brand-muted">
                  Opens in a new tab. This Learnbay page stays open.
                </div>
              </div>
            )}

            {phase === "slow" && (
              <div className="flex flex-col gap-3.5 px-9 pb-6 pt-4">
                <div className="text-center text-[13px] text-brand-ink-soft text-pretty">
                  The project has not answered after 90 seconds. Learnbay is
                  still trying. You can open it now, but it may show a loading or
                  error page.
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button type="button" onClick={() => setOpen(false)} className="h-[46px] rounded-[23px] border border-line-input bg-white px-5 font-semibold text-brand-ink">
                    Close
                  </button>
                  <button type="button" onClick={openInNewTab} className="flex h-[46px] items-center gap-2.5 rounded-[23px] bg-brand-ink px-6 font-bold text-white">
                    Open anyway
                    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" className="fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11.5 4h4.5v4.5M16 4l-6.5 6.5M14 11.5V16H4V6h4.5" /></svg>
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-canvas px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-accent text-xs font-bold leading-none text-white">L</span>
                <span className="text-[13px] font-bold">Built at Learnbay</span>
              </div>
              <div className="text-xs text-brand-muted">
                Hosted by the student, outside Learnbay
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
