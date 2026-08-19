"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Loader2,
  Plus,
  RotateCw,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROXY_COUNTRIES, countryName } from "@/lib/proxy-countries";
import { EXTRA_AGENT_PRICE } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { ChallengePrompt } from "./challenge-prompt";

/**
 * A section that stays out of the way until somebody wants it.
 *
 * Written rather than reached for, because the native <details> element brings
 * its own disclosure triangle and no two browsers draw it the same way. This is
 * a row and a chevron that turns, which is what the rest of the dashboard looks
 * like.
 */
function Disclosure({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      <button
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[13px] font-medium text-slate-900 transition-colors hover:bg-slate-50 dark:text-white dark:hover:bg-white/5"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {title}
        <ChevronDown
          className={cn(
            "h-4 w-4 flex-none text-slate-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="space-y-3 border-t border-slate-200 px-4 py-4 dark:border-slate-700">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * The LinkedIn accounts surface, written once and mounted in three places:
 * the accounts page, the LinkedIn tab of settings, and step 4 of the agent
 * wizard.
 *
 * It used to exist only on its own page, so both other places were a button
 * that sent the person away mid-task. Connecting an account is the one step
 * between signing up and having a working agent, and it should never cost a
 * navigation. The three surfaces read the same route, so an account added in
 * any of them appears in the other two.
 */

export interface LinkedInAccount {
  id: string;
  email: string;
  fullName: string | null;
  headline: string | null;
  avatarUrl: string | null;
  country: string;
  status: string;
  statusReason: string | null;
  challengeState: string;
  warmupStartedAt: string | null;
  dailyInviteCap: number;
  agentCount: number;
}

const STATUS: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Waiting for its first sign-in",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  },
  active: {
    label: "Signed in and working",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  challenged: {
    label: "LinkedIn asked for a verification",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  },
  restricted: {
    label: "Restricted by LinkedIn",
    className: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  },
};

/** Loads the accounts and the plan's account allowance in one place. */
export function useLinkedInAccounts() {
  const [accounts, setAccounts] = useState<LinkedInAccount[] | null>(null);
  const [quota, setQuota] = useState(0);
  const [extraAgents, setExtraAgents] = useState(0);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [accountsRes, agentsRes] = await Promise.all([
        fetch("/api/linkedin/accounts"),
        fetch("/api/agents"),
      ]);
      if (!accountsRes.ok) throw new Error("Could not load your accounts");
      const data = await accountsRes.json();
      setAccounts(data.accounts ?? []);
      if (agentsRes.ok) {
        const agentData = await agentsRes.json();
        setQuota(agentData.quota?.limit ?? 0);
        setExtraAgents(agentData.quota?.extra ?? 0);
        setBillingInterval(agentData.quota?.interval === "year" ? "year" : "month");
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { accounts, quota, extraAgents, billingInterval, error, reload: load };
}

/** The name a person recognises, which is the address until LinkedIn answers. */
/**
 * Something to call this account, whatever the row is missing.
 *
 * The last fallback is not decoration. An account has no name until the session
 * layer has signed in once, so between connecting and the first sign-in the
 * only thing this can use is the address, and if that is missing too the page
 * must still render. Returning an empty string here took the whole dashboard
 * down with a TypeError on the first account anybody ever connected.
 */
export function accountLabel(account: LinkedInAccount): string {
  return account.fullName || account.email || "LinkedIn account";
}

function Avatar({ account }: { account: LinkedInAccount }) {
  const label = accountLabel(account);
  if (account.avatarUrl) {
    return (
      // A plain img rather than next/image: the source is an R2 key written by
      // the session layer, so there is no build-time host to configure.
      <img
        alt=""
        src={account.avatarUrl}
        className="h-10 w-10 flex-none rounded-full object-cover"
      />
    );
  }
  return (
    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-100 text-[13px] font-semibold uppercase text-slate-500 dark:bg-white/5 dark:text-slate-400">
      {label.slice(0, 2)}
    </span>
  );
}

export function LinkedInAccountsPanel({
  mode = "manage",
  selectedId = null,
  onSelect,
  onChanged,
  emptyHint,
}: {
  /** `pick` turns each row into a choice, for the wizard and agent settings. */
  mode?: "manage" | "pick";
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onChanged?: () => void;
  emptyHint?: string;
}) {
  const { accounts, quota, extraAgents, billingInterval, error, reload } = useLinkedInAccounts();
  const [connecting, setConnecting] = useState(false);
  const [upselling, setUpselling] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  /** The account the disconnect modal is asking about, if any. */
  const [confirmingRemoval, setConfirmingRemoval] =
    useState<LinkedInAccount | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  const used = accounts?.length ?? 0;
  const atQuota = quota > 0 && used >= quota;

  const afterChange = async (newId?: string) => {
    await reload();
    onChanged?.();
    if (newId) onSelect?.(newId);
  };

  const remove = async (account: LinkedInAccount) => {
    setRemoving(account.id);
    setRowError(null);
    try {
      const res = await fetch(`/api/linkedin/accounts/${account.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setRowError(data?.error ?? "That account could not be disconnected.");
        return;
      }
      await afterChange();
    } finally {
      setRemoving(null);
      setConfirmingRemoval(null);
    }
  };

  /**
   * Ask the worker to try the sign-in again.
   *
   * It stops on its own after three failures, so an account that hit that
   * ceiling needs a person to say go. Nothing here retries anything: it clears
   * the counter, and the worker picks the account up within seconds.
   */
  const retry = async (account: LinkedInAccount) => {
    setRetrying(account.id);
    setRowError(null);
    try {
      const res = await fetch(`/api/linkedin/accounts/${account.id}`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setRowError(data?.error ?? "That sign-in could not be started again.");
        return;
      }
      await afterChange();
    } finally {
      setRetrying(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}

      {accounts === null ? (
        <div className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5" />
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {emptyHint ??
              "No LinkedIn account connected yet. This is the profile your agent works from."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {accounts.map((account) => {
            const status = STATUS[account.status] ?? {
              label: account.status,
              className:
                "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300",
            };
            const picked = mode === "pick" && selectedId === account.id;
            return (
              <li
                key={account.id}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border p-4 transition-colors",
                  picked
                    ? "border-primary bg-primary/5"
                    : "border-border bg-transparent"
                )}
              >
                <div className="flex w-full items-center gap-4">
                <Avatar account={account} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {accountLabel(account)}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-slate-500 dark:text-slate-400">
                    {countryName(account.country)}
                    {account.agentCount > 0
                      ? ` · sending for ${account.agentCount} agent${account.agentCount === 1 ? "" : "s"}, sharing ${account.dailyInviteCap} invitations a day`
                      : " · no agent uses it yet"}
                  </p>
                  <span
                    className={cn(
                      "mt-2 inline-block rounded-full px-2.5 py-1 text-[11px] font-medium",
                      status.className
                    )}
                  >
                    {status.label}
                  </span>
                  {account.status === "pending" && (
                    // Two support tickets on launch day came from this state
                    // saying nothing: people read "waiting" as something THEY
                    // had to do, deleted the account and wrote in.
                    <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
                      Nothing to do here: we prepare a dedicated connection and
                      sign in for you, which takes a few minutes. If LinkedIn
                      wants a verification, a prompt appears right here on this
                      page.
                    </p>
                  )}
                </div>

                {mode === "pick" ? (
                  <Button
                    size="sm"
                    variant={picked ? "default" : "outline"}
                    onClick={() => onSelect?.(account.id)}
                  >
                    {picked ? "Selected" : "Use this one"}
                  </Button>
                ) : null}

                <button
                  aria-label={`Disconnect ${accountLabel(account)}`}
                  className="flex-none rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  disabled={removing === account.id}
                  onClick={() => setConfirmingRemoval(account)}
                  type="button"
                >
                  {removing === account.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
                </div>

                {/* Why it is in that state, and the way out of it.
                    A badge reading "LinkedIn asked for a verification" with no
                    sentence and no button leaves the person guessing. The
                    worker stops trying after three failures on purpose, so
                    somebody has to be able to say go. */}
                {(account.status === "challenged" ||
                  account.status === "restricted") &&
                  account.challengeState !== "awaiting_code" &&
                  account.challengeState !== "awaiting_approval" && (
                  <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/25 dark:bg-amber-500/10 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[13px] leading-relaxed text-amber-800 dark:text-amber-200">
                      {account.statusReason ??
                        "LinkedIn stopped this sign-in. Try it again, and if it stops a second time the password is the usual cause."}
                    </p>
                    <Button
                      className="flex-none"
                      disabled={retrying === account.id}
                      onClick={() => retry(account)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {retrying === account.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCw className="mr-2 h-4 w-4" />
                      )}
                      Try again
                    </Button>
                  </div>
                )}

                {/* Full width under the row rather than beside the buttons: it
                    only appears while a browser is actually waiting, and when
                    it does it is the most important thing on the page. */}
                <ChallengePrompt
                  accountId={account.id}
                  label={accountLabel(account)}
                  onResolved={reload}
                />
              </li>
            );
          })}
        </ul>
      )}

      {rowError && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          {rowError}{" "}
          <span className="block pt-1">
            Point that agent at another account first, in its own settings, and
            this one frees up.
          </span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => (atQuota ? setUpselling(true) : setConnecting(true))}
          size="sm"
          type="button"
          variant={accounts && accounts.length > 0 ? "outline" : "default"}
        >
          <Plus className="mr-2 h-4 w-4" />
          Connect an account
        </Button>
        {quota > 0 && (
          <span className="text-[13px] text-slate-500 dark:text-slate-400">
            {used} of {quota} on your plan
          </span>
        )}
      </div>

      <ConnectLinkedInDialog
        onConnected={(id) => afterChange(id)}
        onOpenChange={setConnecting}
        open={connecting}
      />
      <ExtraAgentDialog
        billingInterval={billingInterval}
        extraAgents={extraAgents}
        onOpenChange={setUpselling}
        onPurchased={() => reload()}
        open={upselling}
        quota={quota}
      />
      {/* Never the browser's own confirm box. It carries the domain name and
          the browser's buttons, it cannot be styled, and it stops the page
          dead. Nicolas, 2026-07-31. */}
      <ConfirmModal
        confirmText="Disconnect"
        description={
          confirmingRemoval
            ? `The password and the signed-in session for ${accountLabel(confirmingRemoval)} are deleted here. Nothing changes on LinkedIn itself, and its dedicated address goes back to your pool for the next account.`
            : undefined
        }
        loading={removing === confirmingRemoval?.id}
        onClose={() => setConfirmingRemoval(null)}
        onConfirm={() => {
          if (confirmingRemoval) remove(confirmingRemoval);
        }}
        open={confirmingRemoval !== null}
        title={
          confirmingRemoval
            ? `Disconnect ${accountLabel(confirmingRemoval)}?`
            : ""
        }
        variant="destructive"
      />
    </div>
  );
}

/**
 * What is happening right now, while the worker signs the account in.
 *
 * The old version of this was a spinner and one fixed sentence, and it never
 * looked at the account again. So a sign-in that succeeded kept spinning, and a
 * sign-in that failed kept spinning too: on 2026-07-31 the browser could not
 * start at all and the dialog showed the same thing it shows when everything is
 * fine, for as long as anybody was willing to watch it. A progress display that
 * cannot express failure is a progress display that is lying most of the time.
 *
 * The worker writes a line into `status_reason` as it goes, so this shows the
 * real step rather than a guess: setting up the address, opening a browser,
 * signing in. Same poll as the code prompt, which is already fast because a
 * verification code lives 30 seconds.
 */
function SignInProgress({
  accountId,
  email,
}: {
  accountId: string;
  email: string;
}) {
  const [state, setState] = useState<{
    status: string;
    reason: string | null;
    challengeState: string;
  } | null>(null);

  useEffect(() => {
    let live = true;
    const poll = async () => {
      try {
        const res = await fetch(`/api/linkedin/accounts/${accountId}/challenge`);
        if (!res.ok || !live) return;
        const data = (await res.json()) as {
          status: string;
          reason: string | null;
          state: string;
        };
        if (live) {
          setState({
            status: data.status,
            reason: data.reason,
            challengeState: data.state,
          });
        }
      } catch {
        // One missed poll changes nothing. The next is two seconds away.
      }
    };
    poll();
    const timer = setInterval(poll, 2000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [accountId]);

  const status = state?.status ?? "pending";
  const done = status === "active";
  // A browser waiting for a code or a tap is `challenged` too, and it is the
  // opposite of stopped: the prompt below is live and the session is held open.
  const waitingOnYou =
    state?.challengeState === "awaiting_code" ||
    state?.challengeState === "awaiting_approval";
  const stopped =
    !waitingOnYou && (status === "challenged" || status === "restricted");

  return (
    <div className="space-y-4">
      {done ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/25 dark:bg-emerald-500/10">
          <Check className="mt-0.5 h-4 w-4 flex-none text-emerald-600 dark:text-emerald-400" />
          <p className="text-[13px] leading-relaxed text-emerald-800 dark:text-emerald-200">
            <span className="font-semibold">{email} is signed in.</span> Its
            name and picture arrive in a few seconds, and an agent can send from
            it straight away.
          </p>
        </div>
      ) : stopped ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/25 dark:bg-amber-500/10">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-amber-600 dark:text-amber-400" />
          <p className="text-[13px] leading-relaxed text-amber-800 dark:text-amber-200">
            {state?.reason ??
              `LinkedIn stopped the sign-in for ${email}. Try it again from the accounts page.`}
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-white/5">
          <Loader2 className="mt-0.5 h-4 w-4 flex-none animate-spin text-primary" />
          <div className="space-y-1">
            <p className="text-[13px] font-medium text-slate-900 dark:text-white">
              {state?.reason ?? "Getting this account ready."}
            </p>
            <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              Signing in as {email}. It takes about a minute, because the
              sign-in types at a human pace rather than all at once.
            </p>
          </div>
        </div>
      )}

      {/* The same prompt as the accounts page, here where the person already
          is. It renders nothing until a browser is genuinely waiting, so the
          step stays quiet when no code is wanted. */}
      <ChallengePrompt accountId={accountId} label={email} />

      {!done && (
        <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
          You can close this window at any time. The sign-in carries on without
          you, and if a code is needed later it will be waiting on the accounts
          page.
        </p>
      )}
    </div>
  );
}

/**
 * Connecting an account, in the two steps LinkedIn itself asks for.
 *
 * Step 2 asks for the authenticator setup key rather than the 6 digits on
 * screen, because a code is dead 30 seconds later. The key is what lets the
 * session sign back in on its own, which is the whole promise of asking once.
 */
export function ConnectLinkedInDialog({
  open,
  onOpenChange,
  onConnected,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: (id: string) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  // The advanced panel. Empty means we allocate, which is what almost everyone
  // should leave it as.
  const [proxyHost, setProxyHost] = useState("");
  const [proxyPort, setProxyPort] = useState("");
  const [proxyUser, setProxyUser] = useState("");
  const [proxyPass, setProxyPass] = useState("");
  /** Set once the account row exists, which is what step 3 watches. */
  const [connectedId, setConnectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setStep(1);
    setEmail("");
    setPassword("");
    setCountry("");
    setProxyHost("");
    setProxyPort("");
    setProxyUser("");
    setProxyPass("");
    setConnectedId(null);
    setError("");
  };

  const close = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          country,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "The account could not be connected.");
        return;
      }
      const id = data.id as string;

      // The address comes second, on purpose. The account exists either way,
      // and an allocation that fails leaves something to retry rather than
      // losing the credentials the person just typed.
      const custom = proxyHost.trim()
        ? {
            host: proxyHost.trim(),
            port: Number(proxyPort),
            username: proxyUser.trim(),
            password: proxyPass,
          }
        : undefined;
      const alloc = await fetch(`/api/linkedin/accounts/${id}/proxy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(custom ? { custom } : {}),
      });
      if (!alloc.ok) {
        const detail = await alloc.json().catch(() => null);
        setError(
          `${email} is connected, but its dedicated address could not be set up: ${detail?.error ?? "try again from the accounts page"}. Its agents stay paused until it is.`
        );
        await Promise.resolve(onConnected(id));
        return;
      }

      // Step 3 rather than closing. LinkedIn usually asks to verify a sign-in
      // from somewhere it has not seen, and sending the customer away to find
      // that prompt on another page is how people get stuck. The wizard stays
      // open, watches the account, and asks for the code the moment it is
      // wanted.
      setConnectedId(id);
      setStep(3);
      onConnected(id);
    } catch {
      setError("The account could not be connected. Try again in a moment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog onOpenChange={close} open={open}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 1
              ? "Connect a LinkedIn account"
              : step === 2
                ? "Where it signs in from"
                : "Confirm the connection"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Encrypted the moment it arrives, and never shown again."
              : step === 2
                ? "Last step."
                : "Signing in. Stay a moment in case LinkedIn asks for a code."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={submit}>
          {step === 3 ? null : step === 1 ? (
            <>
              <div className="space-y-2">
                <label
                  className="block text-[13px] font-medium text-slate-900 dark:text-white"
                  htmlFor="connect-li-email"
                >
                  LinkedIn email
                </label>
                <Input
                  autoComplete="off"
                  id="connect-li-email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  type="email"
                  value={email}
                />
              </div>

              <div className="space-y-2">
                <label
                  className="block text-[13px] font-medium text-slate-900 dark:text-white"
                  htmlFor="connect-li-password"
                >
                  LinkedIn password
                </label>
                <Input
                  autoComplete="new-password"
                  id="connect-li-password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  type="password"
                  value={password}
                />
                <p className="text-[13px] text-slate-500 dark:text-slate-400">
                  Asked once, not every week.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-slate-900 dark:text-white">
                  Country
                </label>
                <Select onValueChange={setCountry} value={country}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROXY_COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Pick where you actually are. LinkedIn compares it against
                  where this account has always signed in from, and it can only
                  be changed once a month.
                </p>
              </div>

              {/* Collapsed by default, because almost nobody needs it and an
                  open form invites people to fill it in. It exists for agencies
                  who already own good infrastructure, and for the countries our
                  suppliers do not carry, where it turns a refusal into a
                  workaround. */}
              <Disclosure title="Use my own proxy">
                  <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Leave this alone and we allocate an address for you. Fill it
                    in and we allocate nothing, the country above is ignored,
                    and the reputation of the address is yours.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                    <Input
                      autoComplete="off"
                      onChange={(e) => setProxyHost(e.target.value)}
                      placeholder="Host, for example 45.12.30.7"
                      value={proxyHost}
                    />
                    <Input
                      autoComplete="off"
                      inputMode="numeric"
                      onChange={(e) => setProxyPort(e.target.value)}
                      placeholder="Port"
                      value={proxyPort}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      autoComplete="off"
                      onChange={(e) => setProxyUser(e.target.value)}
                      placeholder="Username"
                      value={proxyUser}
                    />
                    <Input
                      autoComplete="off"
                      onChange={(e) => setProxyPass(e.target.value)}
                      placeholder="Password"
                      type="password"
                      value={proxyPass}
                    />
                  </div>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400">
                    We test it before saving, so one that cannot answer is
                    refused here rather than on your first session.
                  </p>
              </Disclosure>
            </>
          )}

          {step === 3 && connectedId && (
            <SignInProgress accountId={connectedId} email={email} />
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            {step < 3 && (
              <Button
                onClick={() => (step === 1 ? close(false) : setStep(1))}
                type="button"
                variant="ghost"
              >
                {step === 1 ? "Cancel" : "Back"}
              </Button>
            )}
            {step === 3 ? (
              <Button
                className="ml-auto"
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
                type="button"
              >
                Done
              </Button>
            ) : (
              <Button
                disabled={
                  saving ||
                  (step === 1 ? !email.trim() || !password : !country)
                }
                type="submit"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : step === 1 ? (
                  "Continue"
                ) : (
                  "Connect"
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The wall a person meets when they ask for one account more than they bought.
 *
 * One agent sends from one account, so an extra account is an extra agent. It
 * offers the free way out first, because swapping an account you no longer use
 * costs nothing and is what most people actually want.
 */
export function ExtraAgentDialog({
  open,
  onOpenChange,
  quota,
  extraAgents = 0,
  billingInterval = "month",
  onPurchased,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quota: number;
  extraAgents?: number;
  /** The customer's own billing period. The add-on follows it. */
  billingInterval?: "month" | "year";
  onPurchased?: () => void;
}) {
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");

  // Monthly for everybody, including a yearly plan: Stripe bills each item on
  // its own cycle, so the annual invoice stays annual and this arrives monthly.
  const addonPrice = EXTRA_AGENT_PRICE;
  const per = "a month";
  const alsoYearly = billingInterval === "year";

  const buyOne = async () => {
    setBuying(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/extra-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: extraAgents + 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not add the agent");
        return;
      }
      onPurchased?.();
      onOpenChange(false);
    } catch {
      setError("Could not reach the billing service. Try again.");
    } finally {
      setBuying(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            Your plan covers {quota} LinkedIn account{quota === 1 ? "" : "s"}
          </DialogTitle>
          <DialogDescription>
            Every agent sends from one account of its own, so another account
            means another agent. An extra one is ${addonPrice} {per} and brings
            its own targeting and its own address.
            {alsoYearly
              ? " Your plan is billed yearly and this is billed monthly, so it arrives on its own invoice."
              : ""}
          </DialogDescription>
        </DialogHeader>

        <p className="rounded-xl border border-border p-4 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-white">
            Replacing an account costs nothing.
          </span>{" "}
          Disconnect the one you no longer use and connect another in its place.
          If an agent still sends from it, point that agent at another account
          in its settings first, and it keeps every lead it has found.
        </p>

        {error && (
          <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button onClick={() => onOpenChange(false)} type="button" variant="ghost">
            Not now
          </Button>
          <div className="flex gap-2">
            <Link href="/dashboard/settings/billing">
              <Button type="button" variant="outline">
                See billing
              </Button>
            </Link>
            <Button disabled={buying} onClick={buyOne} type="button">
              {buying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding
                </>
              ) : (
                `Add one for $${addonPrice} ${per}`
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
