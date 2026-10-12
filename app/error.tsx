"use client";

import { useEffect } from "react";

/**
 * App-wide error boundary. Instead of the raw "server-side exception" page,
 * show a calm message with a way to retry. The digest is surfaced so it can be
 * matched against the server logs when something does go wrong.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Logged on the client so it shows up in the browser console too.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-canvas px-6 text-center">
      <h1 className="m-0 text-2xl font-bold tracking-tight">
        Something went wrong
      </h1>
      <p className="m-0 max-w-md text-sm text-brand-muted">
        We hit an unexpected error loading this page. Please try again — if it
        keeps happening, let us know.
      </p>
      <button
        type="button"
        onClick={reset}
        className="h-[42px] rounded-pill bg-brand-accent px-6 text-[15px] font-semibold text-white hover:bg-brand-accent-hover"
      >
        Try again
      </button>
      {error.digest && (
        <p className="m-0 text-xs text-brand-faint">Reference: {error.digest}</p>
      )}
    </div>
  );
}
