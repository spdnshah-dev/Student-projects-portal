"use client";

import { useState, useTransition } from "react";
import { setUserStatusAction } from "../actions";

export function StatusButton({
  userId,
  disabled,
}: {
  userId: string;
  disabled: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    start(async () => {
      const res = await setUserStatusAction(userId, !disabled);
      if (res.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={`h-9 rounded-pill border px-4 text-[13px] font-semibold disabled:opacity-60 ${
          disabled
            ? "border-state-published/40 text-state-published"
            : "border-state-sentback/40 text-state-sentback"
        }`}
      >
        {pending ? "…" : disabled ? "Enable" : "Disable"}
      </button>
      {error && <span className="text-[11px] text-state-sentback">{error}</span>}
    </div>
  );
}
