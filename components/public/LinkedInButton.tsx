"use client";

import { useState } from "react";

/**
 * The LinkedIn button is shown to EVERY viewer. It carries no URL: clicking it
 * asks the recruiter-only endpoint, which authorizes the server-side session.
 * Recruiters get the URL and it opens; everyone else gets a 404 and a short
 * "recruiters only" note. The URL never exists in the page for non-recruiters.
 */
export function LinkedInButton({
  profileId,
  compact = false,
}: {
  profileId: string;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function open() {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(`/api/students/${profileId}/linkedin`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { url?: string };
        if (data.url) {
          window.open(data.url, "_blank", "noopener,noreferrer");
          return;
        }
      }
      setNote("Available to recruiters only.");
    } catch {
      setNote("Couldn't open LinkedIn right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className={`flex flex-col ${compact ? "ml-2 items-end" : "items-start"} gap-1`}>
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className={`flex h-[38px] items-center gap-2 rounded-pill border-[1.5px] border-[#0A66C2] bg-white font-semibold text-[#0A66C2] disabled:opacity-60 ${compact ? "px-3" : "px-4"}`}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded bg-[#0A66C2] text-xs font-bold text-white">
          in
        </span>
        LinkedIn
      </button>
      {note && (
        <span role="status" className="text-[13px] text-brand-muted">
          {note}
        </span>
      )}
    </span>
  );
}
