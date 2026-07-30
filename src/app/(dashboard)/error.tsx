"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * What the dashboard shows when a page throws instead of rendering.
 *
 * There was nothing here, so any error during render replaced the whole
 * application with Next's own "a client-side exception has occurred", which
 * tells the person nothing, gives them nothing to press, and looks like the
 * product is broken rather than one screen being broken.
 *
 * It earned its place on 2026-07-30: the accounts list called .slice on a name
 * that did not exist yet, and connecting a LinkedIn account for the first time
 * turned the dashboard into a blank page.
 *
 * This is not a way to live with crashes. It is a way for one to cost a panel
 * instead of an evening, and for the person to be able to say what they saw.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Into the browser console with the digest, which is the only handle on it
    // once the build is minified.
    console.error("dashboard render failed", error.digest ?? "", error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-start gap-4 p-8">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
        This screen did not load
      </h1>
      <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        Something on this page failed while it was rendering. Nothing you were
        working on is lost, and the rest of the dashboard still works. Trying
        again usually clears it.
      </p>
      {error.digest && (
        <p className="rounded-lg bg-slate-100 px-3 py-2 font-mono text-[12px] text-slate-500 dark:bg-white/5 dark:text-slate-400">
          {error.digest}
        </p>
      )}
      <div className="flex gap-2">
        <Button onClick={reset} type="button">
          Try again
        </Button>
        <Button asChild variant="ghost">
          <Link href="/dashboard">Back to the dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
