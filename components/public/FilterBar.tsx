"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  DOMAIN_LABELS,
  DOMAIN_OPTIONS,
} from "@/lib/constants";

const selectCls =
  "h-[38px] rounded-field border border-line-strong bg-white px-2.5 text-sm text-brand-ink";

export function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  function update(next: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    router.push(`/?${sp.toString()}`);
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    update({ q });
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold text-brand-muted">Category</span>
        <select
          className={selectCls}
          defaultValue={params.get("category") ?? ""}
          onChange={(e) => update({ category: e.target.value })}
        >
          <option value="">All categories</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold text-brand-muted">Domain</span>
        <select
          className={selectCls}
          defaultValue={params.get("domain") ?? ""}
          onChange={(e) => update({ domain: e.target.value })}
        >
          <option value="">All domains</option>
          {DOMAIN_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {DOMAIN_LABELS[d]}
            </option>
          ))}
        </select>
      </label>

      <form onSubmit={onSearch} className="flex flex-col gap-1">
        <span className="text-xs font-bold text-brand-muted">Tool or keyword</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. Python"
          className="h-[38px] w-[200px] rounded-field border border-line-input bg-white px-3 text-sm text-brand-ink"
        />
      </form>

      <div className="flex-grow" />

      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold text-brand-muted">Sort by</span>
        <select
          className={selectCls}
          defaultValue={params.get("sort") ?? "newest"}
          onChange={(e) => update({ sort: e.target.value })}
        >
          <option value="newest">Newest</option>
          <option value="az">A–Z</option>
        </select>
      </label>
    </div>
  );
}
