"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { takeDownProjectAction } from "@/app/admin/actions";

export function TakeDownButton({ id, backHref }: { id: string; backHref: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function takeDown() {
    setPending(true);
    setError(null);
    const res = await takeDownProjectAction(id);
    if ("error" in res) {
      setError(res.error);
      setPending(false);
      return;
    }
    router.push(backHref);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 border-t border-line bg-white p-5">
      {error && (
        <div role="alert" className="text-[13px] font-medium text-state-sentback">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] text-brand-muted">
          This project is live. Taking it down hides it from the public.
        </span>
        <button
          type="button"
          onClick={takeDown}
          disabled={pending}
          className="h-[42px] rounded-[21px] border border-state-sentback/40 bg-white px-5 font-semibold text-state-sentback disabled:opacity-60"
        >
          {pending ? "Taking down…" : "Take down"}
        </button>
      </div>
    </div>
  );
}
