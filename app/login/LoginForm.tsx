"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        redirect?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      router.push(data.redirect ?? "/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const fieldCls =
    "h-[42px] w-full rounded-[10px] border border-line-input bg-white px-3.5 text-sm text-brand-ink";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-[18px]" noValidate>
      {error && (
        <div
          role="alert"
          className="rounded-[10px] border border-state-sentback/30 bg-state-sentback/5 px-3.5 py-2.5 text-[13px] font-medium text-state-sentback"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className="font-semibold">
          Email address
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={fieldCls}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="login-password" className="font-semibold">
            Password
          </label>
          <a
            href="/set-password"
            className="font-semibold text-brand-accent no-underline"
          >
            Forgot password?
          </a>
        </div>
        <div className="flex gap-2">
          <input
            id="login-password"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={fieldCls + " min-w-0 flex-grow"}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-pressed={showPw}
            className="h-[42px] w-[68px] flex-shrink-0 rounded-[10px] border border-line-input bg-white font-semibold text-brand-ink"
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex h-[42px] items-center justify-center rounded-[21px] bg-brand-accent text-[15px] font-semibold text-white hover:bg-brand-accent-hover disabled:opacity-60"
      >
        {loading ? "Logging in…" : "Log in"}
      </button>

      <div className="h-px bg-line" />

      <div className="flex flex-col gap-1.5">
        <div className="font-semibold">First time here?</div>
        <div className="text-brand-muted">
          Once a Learnbay admin has added your email, set a password to start.
        </div>
        <a
          href="/set-password"
          className="mt-1.5 flex h-[38px] items-center self-start rounded-[19px] border-[1.5px] border-brand-accent bg-white px-[18px] font-semibold text-brand-accent no-underline"
        >
          Set your password
        </a>
      </div>
    </form>
  );
}
