"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

/**
 * Sign in or sign up with Google.
 *
 * 49 accounts in production were created this way and 45 of them have no
 * password, so removing the button did not just remove a convenience, it
 * removed the only way those people knew how to get in.
 */
export function GoogleButton({
  callbackUrl = "/dashboard",
  label = "Continue with Google",
}: {
  callbackUrl?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        signIn("google", { callbackUrl });
      }}
      className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card text-[15px] font-medium text-slate-900 transition-colors hover:border-slate-300 disabled:opacity-60 dark:text-white dark:hover:border-white/20"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
          />
        </svg>
      )}
      {label}
    </button>
  );
}

/** The rule with a word in the middle, above or below the Google button. */
export function AuthDivider({ children = "or" }: { children?: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[12px] uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
        {children}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
