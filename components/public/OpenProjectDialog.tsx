"use client";

import { useEffect, useRef, useState } from "react";
import { initials, avatarClasses } from "@/lib/initials";

/** How long the popup stays before the student's project opens in a new tab. */
const HOLD_SECONDS = 5;

/**
 * "Open project": shows a short Learnbay interstitial for HOLD_SECONDS, then
 * opens the student's live site in a new tab.
 *
 * Browsers only let a page open a new tab during a click, so the tab is opened
 * (blank) in the click handler and pointed at the project when the countdown
 * ends. Its `opener` is severed so the student's site cannot reach this page.
 * If a popup blocker refuses the tab, the countdown ends on an "Open project"
 * button instead, which opens it from a direct click.
 */
export function OpenProjectDialog({
  liveUrl,
  title,
  description,
  studentLabel,
  studentMeta,
}: {
  liveUrl: string;
  title: string;
  description: string;
  /** The student's public identity (their Student ID), never their name. */
  studentLabel: string;
  studentMeta?: string;
}) {
  const [open, setOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(HOLD_SECONDS);
  const [blocked, setBlocked] = useState(false);
  const tabRef = useRef<Window | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function navigateTab() {
    stopTimer();
    const tab = tabRef.current;
    tabRef.current = null;
    if (tab && !tab.closed) {
      tab.location.href = liveUrl;
    } else {
      // Fallback (no pre-opened tab): only works from a direct click.
      window.open(liveUrl, "_blank", "noopener,noreferrer");
    }
    setOpen(false);
  }

  function cancel() {
    stopTimer();
    const tab = tabRef.current;
    tabRef.current = null;
    if (tab && !tab.closed) tab.close();
    setOpen(false);
  }

  function start() {
    // Open the tab now, while we still have the click, then fill it in later.
    const tab = window.open("", "_blank");
    if (tab) {
      tab.opener = null;
      try {
        tab.document.title = `Opening ${title}…`;
      } catch {
        /* cross-origin guard; harmless */
      }
    }
    tabRef.current = tab;
    setBlocked(!tab);
    setSecondsLeft(HOLD_SECONDS);
    setOpen(true);
  }

  // Countdown. When it reaches zero: navigate the pre-opened tab, or (if the
  // tab was blocked) stay on the button so the visitor can open it by clicking.
  useEffect(() => {
    if (!open) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return stopTimer;
  }, [open]);

  useEffect(() => {
    if (!open || secondsLeft > 0) return;
    if (!blocked) navigateTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, secondsLeft, blocked]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") cancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const done = secondsLeft === 0;
  const progress = ((HOLD_SECONDS - secondsLeft) / HOLD_SECONDS) * 100;

  return (
    <>
      <button
        type="button"
        onClick={start}
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
          onClick={cancel}
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
              onClick={cancel}
              className="absolute right-3 top-3 flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#F1F3F7] text-brand-ink"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true" className="fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" /></svg>
            </button>

            {/* mark + status */}
            <div className="flex flex-col items-center gap-3.5 px-9 pb-5 pt-8 text-center">
              <div className="relative h-[92px] w-[92px]">
                {!done && (
                  <div data-lb-anim className="absolute inset-0 rounded-full border-[3px] border-[#DCE6FA]" style={{ borderTopColor: "var(--brand-accent)", borderRightColor: "var(--brand-accent)", animation: "lb-spin 1.1s linear infinite" }} />
                )}
                {done && <div className="absolute inset-0 rounded-full border-[3px] border-state-published" />}
                <div className="absolute left-5 top-5 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-brand-accent text-[28px] font-bold leading-none text-white">
                  L
                </div>
              </div>
              <div aria-live="polite" className="text-sm font-bold text-brand-accent">
                {done
                  ? "Opening the project in a new tab"
                  : `Opening the project in ${secondsLeft}…`}
              </div>
              <div className="flex flex-col items-center gap-2">
                <h2 id="open-title" className="m-0 text-2xl font-bold leading-tight tracking-tight">
                  {title}
                </h2>
                <div className="flex items-center gap-2 text-brand-muted">
                  <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${avatarClasses(studentLabel)}`}>
                    {initials(studentLabel)}
                  </span>
                  <span>
                    <span className="font-semibold text-brand-ink">{studentLabel}</span>
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

            <div className="flex flex-col items-center gap-3 px-9 pb-6 pt-5">
              <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="Opening the project" className="h-1.5 w-full overflow-hidden rounded-full bg-[#E6EAF1]">
                <div className="h-1.5 rounded-full bg-brand-accent transition-[width] duration-1000 ease-linear" style={{ width: `${progress}%` }} />
              </div>
              {blocked && done ? (
                <>
                  <button type="button" onClick={navigateTab} className="flex h-12 w-full items-center justify-center gap-2.5 rounded-3xl bg-brand-accent text-base font-bold text-white hover:bg-brand-accent-hover">
                    Open project
                    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11.5 4h4.5v4.5M16 4l-6.5 6.5M14 11.5V16H4V6h4.5" /></svg>
                  </button>
                  <div className="text-center text-[13px] text-brand-muted text-pretty">
                    Your browser blocked the new tab. Click to open the project.
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center text-[13px] text-brand-muted text-pretty">
                    The project runs on the student&apos;s own hosting and opens in a
                    new tab. This Learnbay page stays open.
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={cancel} className="h-[38px] px-4 font-semibold text-brand-muted">
                      Cancel
                    </button>
                    <button type="button" onClick={navigateTab} className="h-[38px] rounded-pill bg-brand-ink px-5 text-sm font-bold text-white">
                      Open now
                    </button>
                  </div>
                </>
              )}
            </div>

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
