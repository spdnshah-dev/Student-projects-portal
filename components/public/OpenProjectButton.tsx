"use client";

// Opens the student's live project. The full "getting ready" popup (checking
// the link, slow-state after 90s) is built in the Open-project milestone; for
// now this opens the live URL in a new tab.
export function OpenProjectButton({ liveUrl }: { liveUrl: string }) {
  return (
    <button
      type="button"
      onClick={() => window.open(liveUrl, "_blank", "noopener,noreferrer")}
      className="flex h-12 flex-shrink-0 items-center gap-2.5 rounded-3xl bg-white px-6 text-base font-bold text-brand-ink"
    >
      Open project
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.5 4h4.5v4.5M16 4l-6.5 6.5M14 11.5V16H4V6h4.5" />
      </svg>
    </button>
  );
}
