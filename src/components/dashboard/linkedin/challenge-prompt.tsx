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
  state: "none" | "awaiting_code" | "awaiting_approval" | "submitted" | "failed";
  kind: string | null;
  reason: string | null;
  /** The account's own state, which is what says the sign-in finished. */
  status: string;
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

      // Resolved means the account is signed in, never merely that no code is being asked for.
      //
      // This used to fire on state === "none", which is the value the column carries from the
      // moment the row is created. So the wizard closed itself on the first poll, about two
      // seconds after it opened, before the worker had even picked the account up, and the person
      // was never shown the code prompt they had been told to wait for.
      if (data.status === "active" && !resolved.current) {
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

  // Only while something is genuinely waiting on the person, or right after
  // they acted: hiding during "submitted" made the box vanish and then come
  // back when LinkedIn refused a code, which read as the same question asked
  // twice for no reason (Maria's connect, launch day). A sign-in that gave up
  // is rendered by whoever hosts this component, next to the Try again button
  // that acts on it, so showing it here too said the same thing twice.
  if (
    !info ||
    (info.state !== "awaiting_code" &&
      info.state !== "awaiting_approval" &&
      info.state !== "submitted")
  ) {
    return null;
  }

  // The seconds between sending a code and LinkedIn's verdict. Without this
  // the form disappeared as if finished, so a refusal looked like a brand new,
  // inexplicable request.
  if (info.state === "submitted") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-4">
        <Loader2 className="mt-0.5 h-4 w-4 flex-none animate-spin text-primary" />
        <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">
          <span className="font-semibold text-slate-900 dark:text-white">
            Your code is being entered on the LinkedIn screen right now.
          </span>{" "}
          This takes a few seconds. If LinkedIn refuses it, this box will ask
          again and a fresh code will be on its way to you.
        </p>
      </div>
    );
  }

  /**
   * The tap, not a code.
   *
   * LinkedIn's usual checkpoint for an account signing in somewhere new sends a
   * notification to the phones already carrying the LinkedIn app. There is
   * nothing to type, so showing a code box here would ask for something that
   * does not exist and leave the person hunting for it. The browser is holding
   * the page open and finishes on its own the moment they tap Yes.
   */
  if (info.state === "awaiting_approval") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-4">
        <Loader2 className="mt-0.5 h-4 w-4 flex-none animate-spin text-primary" />
        <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">
          <span className="font-semibold text-slate-900 dark:text-white">
            Open the LinkedIn app on your phone and tap Yes.
          </span>{" "}
          LinkedIn sent it a notification to confirm this sign-in for {label}.
          Nothing to type here, and it finishes on its own once you tap. We tick
          the box that tells LinkedIn to remember the device, so it only asks
          the once.
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
      {/* The worker writes this exact prefix when LinkedIn refuses a code
          (src/linkedin/signin.ts in the worker repo). The first, instructional
          reason is not worth repeating here, the refusal absolutely is. */}
      {info.reason?.startsWith("LinkedIn did not accept") && (
        <p className="text-[13px] font-medium leading-relaxed text-amber-700 dark:text-amber-300">
          LinkedIn did not accept the previous code and just sent a new one.
          This is LinkedIn being careful, not a bug: only the newest code
          works.
        </p>
      )}
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
        {info.kind === "authenticator app"
          ? "Codes from an app change every 30 seconds, so if one is refused just read the next one."
          : "LinkedIn sometimes sends several codes in a row, and each new one cancels the ones before it. Always use the most recent message, and avoid signing in to LinkedIn yourself while this runs."}
      </p>
    </form>
  );
}
