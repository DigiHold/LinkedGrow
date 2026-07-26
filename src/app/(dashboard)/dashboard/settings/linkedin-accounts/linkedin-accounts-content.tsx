"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  PageShell,
  PageHeader,
  Panel,
  PanelTitle,
  Field,
  FieldActions,
  EmptyState,
} from "@/components/dashboard/ui/page";
import { LinkedInAccountIcon } from "@/components/dashboard/nav-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROXY_COUNTRIES, countryName } from "@/lib/proxy-countries";

/**
 * Connected LinkedIn accounts, in settings rather than under Agents.
 *
 * An account is not an agent thing. It is the identity the whole product sends
 * from: the agents reach out through it and posts publish through it, because
 * v2 drops the LinkedIn API. Filing it under Agents made people think posting
 * needed one too, which it does.
 */

interface Account {
  id: string;
  fullName: string | null;
  headline: string | null;
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
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
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

export function LinkedInAccountsContent() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [quota, setQuota] = useState<number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

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
        const agents = await agentsRes.json();
        setQuota(agents.quota?.limit ?? 0);
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Something went wrong");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const connect = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const response = await fetch("/api/linkedin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          country,
          totpSecret: totpSecret || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setFormError(data.error || "The account could not be connected.");
        return;
      }
      setEmail("");
      setPassword("");
      setTotpSecret("");
      setCountry("");
      setOpen(false);
      await load();
    } catch {
      setFormError("The account could not be connected. Try again in a moment.");
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async (id: string) => {
    setDeleting(id);
    try {
      const response = await fetch(`/api/linkedin/accounts/${id}`, { method: "DELETE" });
      if (response.ok) await load();
    } finally {
      setDeleting(null);
    }
  };

  const used = accounts?.length ?? 0;
  const atQuota = quota > 0 && used >= quota;

  return (
    <PageShell>
      <PageHeader
        title="LinkedIn accounts"
        description="The accounts LinkedGrow sends from. Your agents reach out through them and your posts publish through them, so one connection covers both."
      />

      <div className="mt-8 space-y-6">
        <Panel>
          <PanelTitle
            description={
              quota > 0
                ? `${used} of ${quota} connected on your plan. Each one gets its own dedicated address in the country you pick, and keeps it.`
                : "Connecting an account needs a paid plan."
            }
            actions={
              !open && (
                <Button onClick={() => setOpen(true)} disabled={atQuota || quota === 0}>
                  <Plus className="mr-2 h-4 w-4" />
                  Connect an account
                </Button>
              )
            }
          >
            Connected accounts
          </PanelTitle>

          {loadError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              {loadError}
            </p>
          )}

          {accounts === null && !loadError && (
            <div className="flex items-center gap-2 py-6 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading your accounts
            </div>
          )}

          {accounts?.length === 0 && !open && (
            <EmptyState
              icon={<LinkedInAccountIcon className="h-6 w-6" />}
              title="No account connected"
              description="Connect the LinkedIn account you want to send from. It gets a dedicated residential address in your own country and keeps it for as long as the account exists, because an account seen from a new address every week is what gets restricted."
            />
          )}

          {accounts && accounts.length > 0 && (
            <ul className="divide-y divide-border">
              {accounts.map((account) => {
                const state = STATUS[account.status] ?? {
                  label: account.status,
                  className: "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300",
                };
                return (
                  <li
                    key={account.id}
                    className="flex flex-wrap items-center gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {account.fullName || "Not signed in yet"}
                      </p>
                      <p className="mt-1 truncate text-[13px] text-slate-500 dark:text-slate-400">
                        {countryName(account.country)} · {account.dailyInviteCap} invitations a day
                        {account.agentCount > 0
                          ? `, shared by ${account.agentCount} agent${account.agentCount === 1 ? "" : "s"}`
                          : ", no agent on it yet"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${state.className}`}
                    >
                      {state.label}
                    </span>
                    <button
                      onClick={() => disconnect(account.id)}
                      disabled={deleting === account.id}
                      aria-label="Disconnect this account"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    >
                      {deleting === account.id ? (
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

          {atQuota && !open && (
            <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-[13px] text-slate-600 dark:bg-white/5 dark:text-slate-300">
              Your plan covers {quota} account{quota === 1 ? "" : "s"}.{" "}
              <Link href="/dashboard/upgrade" className="font-medium underline">
                Add another
              </Link>{" "}
              to send from a second identity.
            </p>
          )}
        </Panel>

        {open && (
          <Panel>
            <PanelTitle description="Your password is encrypted the moment it arrives and is only ever decrypted inside the browser session that signs in. It is never shown again, not to you and not to us.">
              Connect a LinkedIn account
            </PanelTitle>

            <form onSubmit={connect} className="space-y-5">
              <Field
                label="LinkedIn email"
                htmlFor="li-email"
                hint="The address you sign in to LinkedIn with."
              >
                <Input
                  id="li-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="off"
                />
              </Field>

              <Field
                label="LinkedIn password"
                htmlFor="li-password"
                hint="Stored encrypted so the session can sign back in on its own. You are never asked again."
              >
                <Input
                  id="li-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </Field>

              <Field
                label="Country"
                hint="Pick where you actually are, not where your audience is. The address has to match the account's own history, and it cannot be changed casually afterwards."
              >
                <Select value={country} onValueChange={setCountry}>
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
              </Field>

              <Field
                label="Two-factor secret"
                htmlFor="li-totp"
                hint="Optional. If your account uses an authenticator app, paste the setup key here so the session can sign in without asking you for a code every time."
              >
                <Input
                  id="li-totp"
                  type="password"
                  value={totpSecret}
                  onChange={(e) => setTotpSecret(e.target.value)}
                  placeholder="Leave empty if you do not use one"
                  autoComplete="off"
                />
              </Field>

              {formError && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                  {formError}
                </p>
              )}

              <FieldActions>
                <Button type="submit" disabled={saving || !country}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connect"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setOpen(false);
                    setFormError("");
                  }}
                >
                  Cancel
                </Button>
              </FieldActions>
            </form>
          </Panel>
        )}
      </div>
    </PageShell>
  );
}
