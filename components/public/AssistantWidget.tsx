"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type Msg = { role: "user" | "assistant"; text: string };

const GREETING: Msg = {
  role: "assistant",
  text: "Hi! Ask me anything about the students and projects on Learnbay Projects — a tool, a domain, or what someone built.",
};

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || pending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setPending(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        replies?: string[];
        error?: string;
      };
      const replies =
        data.replies && data.replies.length
          ? data.replies
          : [data.error ?? "Sorry, something went wrong. Please try again."];
      setMessages((m) => [
        ...m,
        ...replies.map((text) => ({ role: "assistant" as const, text })),
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Network error. Please try again." },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex h-12 items-center gap-2 rounded-pill bg-brand-accent px-5 font-semibold text-white shadow-feature"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4.5h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H9.5L6 16.5v-3H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z" />
          </svg>
          Ask AI
        </button>
      )}

      {open && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex max-h-[80vh] flex-col overflow-hidden rounded-t-2xl border border-line bg-white shadow-sheet sm:inset-x-auto sm:bottom-5 sm:right-5 sm:h-[640px] sm:max-h-[80vh] sm:w-[380px] sm:rounded-2xl">
          <div className="flex flex-shrink-0 items-center gap-2 border-b border-line px-4 py-3">
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="fill-none stroke-brand-accent" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4.5h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H9.5L6 16.5v-3H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z" />
            </svg>
            <span className="font-bold">Ask AI</span>
            <span className="rounded-pill bg-surface-chip px-2 py-0.5 text-[11px] font-bold text-brand-ink-soft">
              Learnbay Projects
            </span>
            <div className="flex-grow" />
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1F3F7] text-brand-ink"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" /></svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex flex-grow flex-col gap-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "max-w-[85%] self-end rounded-[14px] rounded-br-[4px] bg-brand-ink px-3 py-2 text-white"
                    : "max-w-[92%] self-start whitespace-pre-line rounded-[14px] rounded-bl-[4px] bg-[#F1F3F7] px-3 py-2.5 text-brand-ink text-pretty"
                }
              >
                {m.text}
              </div>
            ))}
            {pending && (
              <div className="max-w-[92%] self-start rounded-[14px] rounded-bl-[4px] bg-[#F1F3F7] px-3 py-2.5 text-brand-muted">
                Thinking…
              </div>
            )}
          </div>

          <form onSubmit={send} className="flex flex-shrink-0 flex-col gap-1.5 border-t border-line px-4 py-3">
            <div className="flex gap-2">
              <label htmlFor="ai-input" className="sr-only">
                Ask a question
              </label>
              <input
                id="ai-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a project or student"
                className="h-[38px] min-w-0 flex-grow rounded-pill border border-line-input bg-white px-4 text-sm text-brand-ink"
              />
              <button
                type="submit"
                disabled={pending}
                aria-label="Send"
                className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full bg-brand-accent text-white disabled:opacity-60"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3.5 10l13-6-4 12.5-2.5-5.5zM10 11l6.5-7" />
                </svg>
              </button>
            </div>
            <p className="m-0 text-[11px] text-brand-muted">
              Answers are written by AI from what students submitted, and can be
              wrong.
            </p>
          </form>
        </div>
      )}
    </>
  );
}
