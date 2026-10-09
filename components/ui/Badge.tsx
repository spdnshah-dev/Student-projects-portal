import type { ReactNode } from "react";

type Tone = "neutral" | "chip" | "accent" | "draft" | "info";

const tones: Record<Tone, string> = {
  neutral: "border border-line-strong text-brand-muted",
  chip: "bg-surface-chip text-brand-ink-soft",
  accent: "bg-brand-accent text-white",
  draft: "border border-line-strong bg-surface-canvas text-brand-muted",
  info: "bg-night-chip text-white",
};

/** A rounded pill tag — tools, categories, status, etc. */
export function Badge({
  children,
  tone = "chip",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
