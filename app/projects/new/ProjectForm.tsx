"use client";

import { useActionState, useState, type KeyboardEvent } from "react";
import { saveProjectAction, type FormState } from "./actions";
import {
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  DOMAIN_LABELS,
  DOMAIN_OPTIONS,
} from "@/lib/constants";

const initial: FormState = {};

const fieldCls =
  "h-[42px] w-full rounded-[10px] border border-line-input bg-white px-3.5 text-sm text-brand-ink";
const labelCls = "font-semibold";

export function ProjectForm() {
  const [state, formAction, pending] = useActionState(
    saveProjectAction,
    initial,
  );
  const [tools, setTools] = useState<string[]>([]);
  const [toolInput, setToolInput] = useState("");

  function addTool() {
    const t = toolInput.trim().replace(/,$/, "").trim();
    if (t && !tools.includes(t)) setTools((prev) => [...prev, t]);
    setToolInput("");
  }
  function onToolKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTool();
    } else if (e.key === "Backspace" && toolInput === "" && tools.length) {
      setTools((prev) => prev.slice(0, -1));
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-[22px]">
      {state.error && (
        <div
          role="alert"
          className="rounded-[10px] border border-state-sentback/30 bg-state-sentback/5 px-3.5 py-2.5 text-[13px] font-medium text-state-sentback"
        >
          {state.error}
        </div>
      )}

      {/* carries the chips to the server as free text */}
      <input type="hidden" name="toolsText" value={tools.join(", ")} />

      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pj-name" className={labelCls}>
            Project name
          </label>
          <input
            id="pj-name"
            name="title"
            type="text"
            required
            className={fieldCls}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pj-category" className={labelCls}>
            Category
          </label>
          <select
            id="pj-category"
            name="category"
            defaultValue=""
            className={fieldCls}
          >
            <option value="">Select a category</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 sm:w-1/2 sm:pr-2.5">
        <label htmlFor="pj-domain" className={labelCls}>
          Domain
        </label>
        <select
          id="pj-domain"
          name="domain"
          defaultValue=""
          className={fieldCls}
        >
          <option value="">Select a domain</option>
          {DOMAIN_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {DOMAIN_LABELS[d]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pj-desc" className={labelCls}>
          Detailed description
        </label>
        <textarea
          id="pj-desc"
          name="description"
          rows={5}
          required
          placeholder="Say what the project does, who it is for and how it works."
          className="min-h-[108px] w-full resize-y rounded-[10px] border border-line-input bg-white p-3.5 text-sm leading-relaxed text-brand-ink"
        />
        <div className="text-[13px] text-brand-muted">
          Visitors read this on your project page and in the popup while the
          project opens.
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="pj-tool" className={labelCls}>
          Tools and frameworks
        </label>
        <div className="flex flex-wrap gap-2">
          {tools.map((t) => (
            <button
              key={t}
              type="button"
              aria-label={`Remove ${t}`}
              onClick={() => setTools((prev) => prev.filter((x) => x !== t))}
              className="flex h-[34px] items-center gap-2 rounded-[17px] border border-line-strong bg-surface-canvas pl-3.5 pr-2.5 text-[13px] font-semibold text-brand-ink"
            >
              <span>{t}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                aria-hidden="true"
                className="fill-none stroke-brand-muted"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
              </svg>
            </button>
          ))}
          <input
            id="pj-tool"
            type="text"
            value={toolInput}
            onChange={(e) => setToolInput(e.target.value)}
            onKeyDown={onToolKey}
            onBlur={addTool}
            placeholder="Type a tool and press Enter"
            className="h-[34px] w-[230px] rounded-[17px] border border-line-input bg-white px-4 text-sm text-brand-ink"
          />
        </div>
      </div>

      <div className="h-px bg-line" />

      <div className="flex flex-col gap-1.5">
        <h2 className="m-0 text-base font-bold">Live project link</h2>
        <p className="m-0 text-pretty text-brand-muted">
          Your project must already be running on the internet. Visitors open it
          in a new tab from your project page.
        </p>
        <div className="mt-2 flex items-center gap-2.5">
          <input
            id="pj-link"
            name="liveUrl"
            type="url"
            required
            placeholder="https://your-project.example.app"
            className={fieldCls + " min-w-0 flex-grow"}
          />
          <button
            type="button"
            disabled
            title="Live link testing arrives with the link-checker milestone"
            className="h-[42px] flex-shrink-0 rounded-field border border-line-input bg-white px-4 font-semibold text-brand-ink disabled:opacity-50"
          >
            Test link
          </button>
        </div>
        <div className="text-[13px] text-brand-muted">
          Paste the full address, starting with https://.
        </div>
      </div>

      <div className="sticky bottom-0 -mx-7 -mb-7 flex flex-wrap items-center gap-3 rounded-b-2xl border-t border-line bg-white px-7 py-3.5 shadow-[0_-6px_16px_rgba(16,24,43,0.05)]">
        <button
          type="submit"
          name="intent"
          value="submit"
          disabled={pending}
          className="flex h-[42px] items-center rounded-[21px] bg-brand-accent px-6 text-[15px] font-semibold text-white hover:bg-brand-accent-hover disabled:opacity-60"
        >
          {pending ? "Saving…" : "Submit for review"}
        </button>
        <button
          type="submit"
          name="intent"
          value="draft"
          disabled={pending}
          className="flex h-[42px] items-center rounded-[21px] border border-line-input bg-white px-5 text-[15px] font-semibold text-brand-ink disabled:opacity-60"
        >
          Save draft
        </button>
        <span className="text-[13px] text-brand-muted">
          A Learnbay admin reviews every project before it goes public.
        </span>
      </div>
    </form>
  );
}
