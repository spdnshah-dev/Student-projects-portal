"use client";

import { useEffect, useState } from "react";

type Cert = {
  id: string;
  name: string;
  issuer: string | null;
  fileKey: string | null;
};

function isPdf(url: string): boolean {
  return /\.pdf($|\?)/i.test(url);
}

/**
 * Shows a student's certificates and opens each one in a pop-up (modal) instead
 * of a new browser tab. Images are shown inline; PDFs are embedded; a
 * belt-and-braces "Open in new tab" link is always available.
 */
export function CertificateViewer({ certificates }: { certificates: Cert[] }) {
  const [active, setActive] = useState<Cert | null>(null);

  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActive(null);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active]);

  return (
    <>
      {certificates.map((c) => (
        <div key={c.id} className="flex flex-col">
          {c.fileKey ? (
            <button
              type="button"
              onClick={() => setActive(c)}
              className="text-left font-semibold text-brand-accent underline decoration-from-font underline-offset-2"
            >
              {c.name}
            </button>
          ) : (
            <span className="font-semibold">{c.name}</span>
          )}
          {c.issuer && (
            <span className="text-[13px] text-brand-muted">{c.issuer}</span>
          )}
        </div>
      ))}

      {active?.fileKey && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.name}
          onClick={() => setActive(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_48px_rgba(16,24,43,0.28)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-bold">{active.name}</span>
                {active.issuer && (
                  <span className="truncate text-[13px] text-brand-muted">
                    {active.issuer}
                  </span>
                )}
              </div>
              <div className="flex flex-shrink-0 items-center gap-4">
                <a
                  href={active.fileKey}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-semibold text-brand-accent no-underline"
                >
                  Open in new tab
                </a>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1F3F7] text-brand-ink"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    className="fill-none stroke-current"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-grow overflow-auto bg-surface-canvas">
              {isPdf(active.fileKey) ? (
                <iframe
                  src={active.fileKey}
                  title={active.name}
                  className="h-[75vh] w-full border-0"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={active.fileKey}
                  alt={active.name}
                  className="mx-auto block max-h-[80vh] w-auto"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
