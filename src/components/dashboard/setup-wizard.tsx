"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * The first thing a new account sees, once.
 *
 * This used to be a 3-step tour (LinkedIn OAuth, BYOK keys, voice), all of it
 * written for v1: the OAuth it described no longer exists, and every step it
 * covered lives inside the agent wizard anyway. So it is one screen with one
 * job now: send the person to /dashboard/agents/new, where the real setup
 * happens (Nicolas, 2026-08-19).
 */
export function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  const markDone = useCallback(async () => {
    try {
      await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingCompleted: true }),
      });
    } catch { /* worst case this shows once more */ }
    onComplete();
  }, [onComplete]);

  const start = async () => {
    setLeaving(true);
    await markDone();
    router.push("/dashboard/agents/new");
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) markDone(); }}>
      <DialogContent className="max-w-lg w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-2xl border-slate-200/80 p-0 shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:shadow-black/50">
        <DialogTitle className="sr-only">Welcome to LinkedGrow</DialogTitle>
        <div className="pointer-events-none absolute -inset-px rounded-2xl bg-linear-to-br from-cyan-500/10 via-transparent to-blue-500/10 dark:from-cyan-500/5 dark:to-blue-500/5" />
        <div className="relative px-8 py-10 text-center">
          <div className="relative mx-auto mb-6 h-16 w-16">
            <div className="absolute inset-0 rounded-xl bg-cyan-500/20 blur-lg" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500/15 to-blue-600/15">
              <Bot className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
            </div>
          </div>
          <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Your agent is ready to be built
          </h2>
          <p className="mx-auto mb-8 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Describe who you sell to, connect your LinkedIn account, and your
            agent starts finding leads and opening conversations for you. The
            whole setup takes a few minutes.
          </p>
          <Button
            onClick={start}
            disabled={leaving}
            className="h-12 w-full max-w-sm rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-8 text-base text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/30"
          >
            Create your first agent
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <button
            type="button"
            onClick={markDone}
            className="mt-5 block w-full text-sm text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
          >
            Skip for now
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
