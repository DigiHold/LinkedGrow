"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { accounts, quota, error, reload: load };
}

/** The name a person recognises, which is the address until LinkedIn answers. */
export function accountLabel(account: LinkedInAccount): string {
  return account.fullName || account.email;
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
  const { accounts, quota, error, reload } = useLinkedInAccounts();
  const [connecting, setConnecting] = useState(false);
  const [upselling, setUpselling] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const used = accounts?.length ?? 0;
  const atQuota = quota > 0 && used >= quota;

  const afterChange = async (newId?: string) => {
    await reload();
    onChanged?.();
    if (newId) onSelect?.(newId);
  };

  const remove = async (account: LinkedInAccount) => {
    const label = accountLabel(account);
    if (!confirm(`Disconnect ${label}? Its password and session are deleted here, and nothing changes on LinkedIn itself.`)) {
      return;
    }
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
                  "flex items-center gap-4 rounded-xl border p-4 transition-colors",
                  picked
                    ? "border-primary bg-primary/5"
                    : "border-border bg-transparent"
                )}
              >
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
                  onClick={() => remove(account)}
                  type="button"
                >
                  {removing === account.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
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
        onOpenChange={setUpselling}
        open={upselling}
        quota={quota}
      />
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
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setStep(1);
    setEmail("");
    setPassword("");
    setCountry("");
    setTotpSecret("");
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
          totpSecret: totpSecret || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "The account could not be connected.");
        return;
      }
      const id = data.id as string;
      reset();
      onOpenChange(false);
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
            {step === 1 ? "Connect a LinkedIn account" : "Two-factor, and where it signs in from"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "LinkedGrow works from your own profile, so there is no LinkedIn app to authorise. Your password is encrypted the moment it arrives and is never shown again, to you or to us."
              : "Two more things and the account is connected. Both of them are what keep it from being asked to prove itself again later."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={submit}>
          {step === 1 ? (
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
                  Stored encrypted so the session can sign back in on its own,
                  which is why you are asked once rather than every week.
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
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
                  <span className="font-semibold">
                    Pick where you actually are, not where your audience is.
                  </span>{" "}
                  LinkedIn compares where the account signs in from against
                  where it has always signed in from. A neighbouring country
                  looks like a trip, and another continent looks like somebody
                  else using the account.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  className="block text-[13px] font-medium text-slate-900 dark:text-white"
                  htmlFor="connect-li-totp"
                >
                  Two-factor setup key
                </label>
                <Input
                  autoComplete="off"
                  id="connect-li-totp"
                  onChange={(e) => setTotpSecret(e.target.value)}
                  placeholder="Leave empty if you do not use two-factor"
                  type="password"
                  value={totpSecret}
                />
                <p className="text-[13px] text-slate-500 dark:text-slate-400">
                  If your account uses an authenticator app, paste the setup key
                  it gave you, the long one behind the QR code rather than the 6
                  digits that keep changing. With it the session signs itself
                  back in and never comes back to you for a code.
                </p>
              </div>

              <p className="text-[13px] text-slate-500 dark:text-slate-400">
                LinkedIn asks you to approve the first sign-in from somewhere
                new. Approve it once from your phone or your inbox, and it stops
                asking.
              </p>
            </>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              onClick={() => (step === 1 ? close(false) : setStep(1))}
              type="button"
              variant="ghost"
            >
              {step === 1 ? "Cancel" : "Back"}
            </Button>
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quota: number;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            Your plan covers {quota} LinkedIn account{quota === 1 ? "" : "s"}
          </DialogTitle>
          <DialogDescription>
            Every agent sends from one account of its own, so another account
            means another agent. An extra one is ${EXTRA_AGENT_PRICE} a month
            and brings its own targeting and its own address.
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

        <DialogFooter className="gap-2 sm:justify-between">
          <Button onClick={() => onOpenChange(false)} type="button" variant="ghost">
            Not now
          </Button>
          <Link href="/dashboard/settings/billing">
            <Button type="button">See billing</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
