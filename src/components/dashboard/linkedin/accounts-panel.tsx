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
import { ChallengePrompt } from "./challenge-prompt";

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
                </div>

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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
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
    setTotpSecret("");
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
          totpSecret: totpSecret || undefined,
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
              ? "LinkedGrow works from your own profile, so there is no LinkedIn app to authorise. Your password is encrypted the moment it arrives and is never shown again, to you or to us."
              : step === 2
                ? "One more thing and the account is connected. This is what keeps it from being asked to prove itself again later."
                : "We are signing in now. Stay on this screen for a moment: LinkedIn often asks to verify a new sign-in, and if it does we will ask you for the code right here."}
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
                  This country becomes a dedicated address reserved for this
                  account alone, and it stays with the account for as long as the
                  account exists. Choose it carefully, because it can only be
                  moved once a month and every agent on the account pauses while
                  it moves. LinkedIn compares where the account signs in from
                  against where it has always signed in from, so a neighbouring
                  country looks like a trip while another continent looks like
                  somebody else using the account.{" "}
                  <span className="font-semibold">
                    If your own country is not in the list, choose the closest
                    one.
                  </span>{" "}
                  LinkedIn may ask you to confirm it is you the first time, which
                  takes a minute and then stops happening.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-white/5">
                <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    LinkedIn will almost certainly ask you to verify this
                    sign-in, and we will ask you for the code here.
                  </span>{" "}
                  It happens whether or not you use two-factor: this is a
                  browser and a location LinkedIn has not seen before, so it
                  checks. The code arrives by email, by text or in your
                  authenticator app, whichever you already use. Keep it within
                  reach for the next minute. The sign-in waits on that screen
                  for you, and once it is done LinkedIn remembers this browser,
                  so normally it never asks again. It can ask a second time if
                  you change your LinkedIn password, and we will simply ask you
                  here again when that happens.
                </p>
              </div>

              {/* The setup key used to be a required field on this screen. It
                  is unusable as one: LinkedIn shows it once when 2FA is turned
                  on and never again, so anybody who already has it would have
                  to disable and re-enable two-factor to find it. It survives
                  here as an option for people who want a re-login months from
                  now to happen with nobody watching. */}
              <details className="rounded-xl border border-slate-200 dark:border-slate-700">
                <summary className="cursor-pointer select-none px-4 py-3 text-[13px] font-medium text-slate-900 dark:text-white">
                  Advanced: never ask me for a code again
                </summary>
                <div className="space-y-3 border-t border-slate-200 px-4 py-4 dark:border-slate-700">
                  <Input
                    autoComplete="off"
                    id="connect-li-totp"
                    onChange={(e) => setTotpSecret(e.target.value)}
                    placeholder="Authenticator setup key, if you still have it"
                    type="password"
                    value={totpSecret}
                  />
                  <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Only worth filling in if you kept the setup key your
                    authenticator app was given, the long string behind the QR
                    code rather than the 6 digits that keep changing. Almost
                    nobody still has it, and it changes nothing about this
                    sign-in: it only means a re-login months from now finishes
                    with nobody watching.
                  </p>
                </div>
              </details>

              {/* Collapsed by default, because almost nobody needs it and an
                  open form invites people to fill it in. It exists for agencies
                  who already own good infrastructure, and for the countries our
                  suppliers do not carry, where it turns a refusal into a
                  workaround. */}
              <details className="rounded-xl border border-slate-200 dark:border-slate-700">
                <summary className="cursor-pointer select-none px-4 py-3 text-[13px] font-medium text-slate-900 dark:text-white">
                  Advanced: use my own proxy
                </summary>
                <div className="space-y-3 border-t border-slate-200 px-4 py-4 dark:border-slate-700">
                  <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Leave this closed and we allocate a dedicated address for
                    you, which is what almost everyone should do. Fill it in and
                    the agent uses yours instead, we allocate nothing, and the
                    country above is ignored.{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      The reputation of an address you supply is yours.
                    </span>{" "}
                    The warm-up, the pacing and the device fingerprint still
                    apply, but if it turns out to be a shared datacentre IP your
                    account can be restricted and our safety guarantee does not
                    cover it.
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
                    We route one request through it and read the address that
                    comes out before saving, so a proxy that cannot answer is
                    refused here rather than failing on your first session.
                  </p>
                </div>
              </details>
            </>
          )}

          {step === 3 && connectedId && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-white/5">
                <Loader2 className="mt-0.5 h-4 w-4 flex-none animate-spin text-primary" />
                <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                  Signing in as{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {email}
                  </span>
                  . This takes a minute, because the sign-in runs at a human
                  pace on purpose rather than all at once.
                </p>
              </div>

              {/* The same prompt as the accounts page, here where the person
                  already is. It renders nothing until a browser is genuinely
                  waiting, so the step stays quiet when no code is wanted. */}
              <ChallengePrompt
                accountId={connectedId}
                label={email}
                onResolved={() => {
                  reset();
                  onOpenChange(false);
                }}
              />

              <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                You can close this window at any time. The sign-in carries on
                without you, and if a code is needed later it will be waiting
                on the accounts page.
              </p>
            </div>
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
