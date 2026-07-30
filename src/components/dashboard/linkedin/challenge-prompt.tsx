"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * The code LinkedIn is asking for, while a browser waits.
 *
 * This is the visible half of the handoff in `api/linkedin/accounts/[id]/challenge`.
 * A worker is sitting on LinkedIn's verification page right now with the
 * session half open, polling for a code every couple of seconds. A TOTP code
 * lasts 30 seconds, so this polls fast, submits immediately, and says plainly
 * that something is waiting.
 *
 * It renders nothing at all unless a code is actually being waited on, so it
 * can be mounted permanently on the accounts page without adding furniture.
 */

interface ChallengeState {
  state: "none" | "awaiting_code" | "submitted" | "failed";
  kind: string | null;
  reason: string | null;
}

export function ChallengePrompt({
  accountId,
  label,
  onResolved,
}: {
  accountId: string;
  label: string;
  onResolved?: () => void;
}) {
  const [info, setInfo] = useState<ChallengeState | null>(null);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resolved = useRef(false);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/linkedin/accounts/${accountId}/challenge`);
      if (!res.ok) return;
      const data = (await res.json()) as ChallengeState;
      setInfo(data);
      if (data.state === "none" && !resolved.current) {
        resolved.current = true;
        onResolved?.();
      }
      if (data.state === "awaiting_code") resolved.current = false;
    } catch {
      // A missed poll is not worth showing. The next one is two seconds away.
    }
  }, [accountId, onResolved]);

  useEffect(() => {
    poll();
    const timer = setInterval(poll, 2500);
    return () => clearInterval(timer);
  }, [poll]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/linkedin/accounts/${accountId}/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "That code could not be sent.");
        return;
      }
      setCode("");
      await poll();
    } finally {
      setSending(false);
    }
  };

  if (!info || (info.state !== "awaiting_code" && info.state !== "failed")) {
    return null;
  }

  if (info.state === "failed") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/25 dark:bg-amber-500/10">
        <p className="text-[13px] leading-relaxed text-amber-800 dark:text-amber-200">
          {info.reason ??
            `The sign-in for ${label} stopped while it was waiting for a code. Start it again whenever you are ready.`}
        </p>
      </div>
    );
  }

  const source =
    info.kind === "authenticator app"
      ? "your authenticator app"
      : info.kind === "text message"
        ? "the text message LinkedIn just sent"
        : info.kind === "email"
          ? "the email LinkedIn just sent"
          : "LinkedIn";

  return (
    <form
      className="space-y-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-4"
      onSubmit={submit}
    >
      <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">
        <span className="font-semibold text-slate-900 dark:text-white">
          LinkedIn is asking to verify {label}.
        </span>{" "}
        Open {source} and enter the code below. The sign-in is paused on that
        screen waiting for it, and it finishes on its own once you do.
      </p>
      <div className="flex gap-2">
        <Input
          autoComplete="one-time-code"
          autoFocus
          inputMode="numeric"
          maxLength={8}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="6-digit code"
          value={code}
        />
        <Button disabled={sending || code.length < 4} type="submit">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
        </Button>
      </div>
      {error && (
        <p className="text-[13px] text-red-700 dark:text-red-300">{error}</p>
      )}
      <p className="text-[13px] text-slate-500 dark:text-slate-400">
        Codes from an app change every 30 seconds, so if one is refused just
        read the next one.
      </p>
    </form>
  );
}
