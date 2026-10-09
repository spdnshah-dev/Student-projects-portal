"use client";

import { useState } from "react";

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* user cancelled or clipboard blocked — no-op */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="flex h-[38px] items-center gap-2 rounded-pill bg-brand-accent px-4 font-semibold text-white"
    >
      <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" className="fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 12.5V3.5M6.5 7L10 3.5 13.5 7M4.5 10.5v5h11v-5" />
      </svg>
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
