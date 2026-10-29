/** Starts the Google sign-in flow (a plain link to the server route). */
export function GoogleSignInButton({ disabled = false }: { disabled?: boolean }) {
  const cls =
    "flex h-12 w-full items-center justify-center gap-3 rounded-[24px] border border-line-input bg-white text-[15px] font-semibold text-brand-ink no-underline shadow-card hover:bg-surface-canvas";
  const mark = (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.5 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.6A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.1.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.5-5.8c-2.1 1.4-4.8 2.3-8.1 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
  if (disabled) {
    return (
      <span className={`${cls} cursor-not-allowed opacity-60`} aria-disabled="true">
        {mark}
        Sign in with Google
      </span>
    );
  }
  return (
    <a href="/api/auth/google/start" className={cls}>
      {mark}
      Sign in with Google
    </a>
  );
}
