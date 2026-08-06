"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CreditCard,
  Download,
  ExternalLink,
  Loader2,
  Receipt,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  EmptyState,
  PageHeader,
  PageShell,
  Panel,
  PanelTitle,
  Pill,
} from "@/components/dashboard/ui/page";
import { cn } from "@/lib/utils";

/**
 * Billing, which is the one screen that has to be exact.
 *
 * Everywhere else in the product a little vagueness is survivable. Here it is
 * not: the moment somebody is unsure what they are about to be charged, or
 * whether cancelling took their leads with it, the doubt attaches to the whole
 * company. So this page answers four questions in the order they get asked:
 * what am I on, what will I be charged and when, which card pays it, and what
 * have I already paid.
 *
 * The invoice list is deliberately reachable with no plan at all. Somebody who
 * cancelled still paid us and their accountant still needs the PDFs; the old
 * page hid the whole screen behind an upgrade button.
 */

interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  cancelAt: number | null;
  extraAgents: { quantity: number; unitAmount: number; amount: number } | null;
  totalAmount: number;
  /** What Stripe says the next invoice will be, when there is one. */
  nextCharge: { amount: number; at: number } | null;
  priceId: string;
  amount: number;
  currency: string;
  interval: string;
}

interface Invoice {
  id: string;
  number: string | null;
  status: string;
  amount: number;
  currency: string;
  created: number;
  periodStart: number;
  periodEnd: number;
  pdfUrl: string | null;
  hostedUrl: string | null;
}

interface PaymentCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface BillingData {
  hasSubscription: boolean;
  plan: string;
  agentQuota: number;
  extraAgents?: number;
  payment: { failedAt: number; agentsStopOn: number; daysLeft: number } | null;
  subscription: Subscription | null;
  invoices: Invoice[];
  cards: PaymentCard[];
}

const PLAN_NAMES: Record<string, string> = {
  free: "No plan",
  pro: "Pro",
  business: "Business",
};

function money(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function day(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function shortDay(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** A card two months from expiring is a failed payment somebody can still avoid. */
function expiringSoon(card: PaymentCard): boolean {
  const expiry = new Date(card.expYear, card.expMonth, 1).getTime();
  return expiry - Date.now() < 60 * 86400000;
}

function statusPill(subscription: Subscription | null) {
  if (!subscription) return <Pill tone="neutral">No plan</Pill>;
  if (subscription.cancelAtPeriodEnd) return <Pill tone="warn">Ending</Pill>;
  if (subscription.status === "trialing") return <Pill tone="brand">Free trial</Pill>;
  if (subscription.status === "past_due") return <Pill tone="warn">Payment due</Pill>;
  if (subscription.status === "active") return <Pill tone="good">Active</Pill>;
  return <Pill tone="neutral">{subscription.status}</Pill>;
}

function invoicePill(status: string) {
  if (status === "paid") return <Pill tone="good">Paid</Pill>;
  if (status === "open") return <Pill tone="warn">Due</Pill>;
  if (status === "uncollectible") return <Pill tone="warn">Failed</Pill>;
  return <Pill tone="neutral">{status}</Pill>;
}

/**
 * What the customer is about to be charged, and when, in one sentence.
 *
 * Written as a sentence rather than a labelled date because "Next billing" over
 * a date says nothing about the amount, and the amount is the thing people are
 * actually checking for.
 */
function nextChargeLine(subscription: Subscription): string {
  // Stripe's own preview when we have it. The plan total paired with the plan's
  // period end is only right when every item shares one cycle.
  const total = money(
    subscription.nextCharge?.amount ?? subscription.totalAmount ?? subscription.amount,
    subscription.currency
  );
  const when = day(subscription.nextCharge?.at ?? subscription.currentPeriodEnd);
  if (subscription.cancelAtPeriodEnd) {
    return `Nothing more will be charged. Your access runs until ${day(
      subscription.cancelAt ?? subscription.currentPeriodEnd
    )}.`;
  }
  if (subscription.status === "trialing") {
    return `Your first charge is ${total} on ${when}. Cancel before then and you pay nothing.`;
  }
  return `Next charge is ${total} on ${when}.`;
}

function BillingScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPortal = searchParams.get("from") === "portal";

  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stripe/billing")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Could not load your billing"))))
      .then((data: BillingData) => setBilling(data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Could not load your billing")
      )
      .finally(() => setLoading(false));
  }, []);

  async function openPortal() {
    setOpeningPortal(true);
    try {
      const res = await fetch("/api/stripe/billing-portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not open the billing portal");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the billing portal");
      setOpeningPortal(false);
    }
  }

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-96 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
        </div>
      </PageShell>
    );
  }

  const subscription = billing?.subscription ?? null;
  const invoices = billing?.invoices ?? [];
  const card = billing?.cards?.[0] ?? null;
  const paid = invoices.filter((i) => i.status === "paid");
  const paidTotal = paid.reduce((sum, i) => sum + i.amount, 0);
  const currency = paid[0]?.currency ?? subscription?.currency ?? "usd";

  return (
    <PageShell className="space-y-6">
      {fromPortal && (
        <Link
          href="/dashboard/settings/billing"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to billing
        </Link>
      )}

      <PageHeader
        title="Billing"
        description="Your plan, the card that pays for it, and every invoice you can download."
        actions={
          billing?.hasSubscription || billing?.cards?.length ? (
            <Button disabled={openingPortal} onClick={openPortal} variant="outline">
              {openingPortal ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              Manage in Stripe
            </Button>
          ) : undefined
        }
      />

      {error && (
        <Panel className="border-red-200 dark:border-red-900/50">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </Panel>
      )}

      {/* The one thing that must never be buried: a card that did not go through. */}
      {billing?.payment && (
        <Panel className="border-amber-200 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-[15px] font-semibold text-slate-900 dark:text-white">
                  Your last payment did not go through
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {billing.payment.daysLeft > 0
                    ? `Update your card and it retries straight away. Your agents keep running until ${day(
                        billing.payment.agentsStopOn
                      )}, then they pause until it is settled.`
                    : "Your agents are paused. Update your card and they start again on the next pass."}
                </p>
              </div>
            </div>
            <Button className="shrink-0" disabled={openingPortal} onClick={openPortal}>
              {openingPortal && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update card
            </Button>
          </div>
        </Panel>
      )}

      {/* Plan, price and next charge, readable without digging. */}
      <Panel>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[26px] font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">
                {PLAN_NAMES[billing?.plan ?? "free"] ?? billing?.plan}
              </span>
              {statusPill(subscription)}
            </div>

            {subscription ? (
              <>
                <dl className="mt-4 space-y-1.5 text-sm">
                  <div className="flex items-baseline justify-between gap-6 sm:justify-start">
                    <dt className="text-slate-500 dark:text-slate-400">
                      {PLAN_NAMES[billing?.plan ?? "free"]} plan
                    </dt>
                    <dd className="font-medium tabular-nums text-slate-900 sm:ml-6 dark:text-white">
                      {money(subscription.amount, subscription.currency)} / {subscription.interval}
                    </dd>
                  </div>
                  {subscription.extraAgents && (
                    <div className="flex items-baseline justify-between gap-6 sm:justify-start">
                      <dt className="text-slate-500 dark:text-slate-400">
                        {subscription.extraAgents.quantity} extra agent
                        {subscription.extraAgents.quantity === 1 ? "" : "s"}
                      </dt>
                      <dd className="font-medium tabular-nums text-slate-900 sm:ml-6 dark:text-white">
                        {money(subscription.extraAgents.amount, subscription.currency)} / month
                      </dd>
                    </div>
                  )}
                  {subscription.extraAgents && (
                    <div className="flex items-baseline justify-between gap-6 border-t border-border pt-1.5 sm:justify-start">
                      <dt className="font-medium text-slate-900 dark:text-white">Total</dt>
                      <dd className="font-semibold tabular-nums text-slate-900 sm:ml-6 dark:text-white">
                        {money(subscription.totalAmount, subscription.currency)}
                      </dd>
                    </div>
                  )}
                </dl>

                <p
                  className={cn(
                    "mt-4 text-sm leading-relaxed",
                    subscription.cancelAtPeriodEnd
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  {nextChargeLine(subscription)}
                </p>
              </>
            ) : (
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                There is no plan on this account, so the agents are stopped and the
                dashboard is closed. Everything you have already paid for is still
                listed below.
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
            <Button onClick={() => router.push("/dashboard/upgrade")}>
              {!subscription ? "Pick a plan" : "Change plan"}
            </Button>
            {billing?.agentQuota ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {billing.agentQuota} agent{billing.agentQuota === 1 ? "" : "s"} on this plan
              </p>
            ) : null}
          </div>
        </div>
      </Panel>

      {/* The card, and a warning while there is still time to act on it. */}
      <Panel>
        <PanelTitle
          description="Cards are held by Stripe. We never see the number."
          actions={
            <Button disabled={openingPortal} onClick={openPortal} size="sm" variant="outline">
              {openingPortal && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {card ? "Update" : "Add a card"}
            </Button>
          }
        >
          Payment method
        </PanelTitle>

        {card ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-14 items-center justify-center rounded-lg border border-border bg-slate-50 dark:bg-white/5">
              <CreditCard className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-medium capitalize text-slate-900 dark:text-white">
                {card.brand} ending {card.last4}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Expires {String(card.expMonth).padStart(2, "0")}/{card.expYear}
              </p>
            </div>
            {expiringSoon(card) && (
              <Pill tone="warn">Expires soon, update it before the next charge</Pill>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No card on file.
          </p>
        )}
      </Panel>

      {/* What has already been paid, with the PDF next to every line. */}
      <Panel padded={false}>
        <div className="p-5 sm:p-6">
          <PanelTitle
            description={
              paid.length > 0
                ? `${paid.length} payment${paid.length === 1 ? "" : "s"}, ${money(
                    paidTotal,
                    currency
                  )} in total. Every invoice downloads as a PDF.`
                : "Every invoice will appear here as a PDF you can download."
            }
          >
            Payment history
          </PanelTitle>

          {invoices.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-5 w-5" />}
              title="Nothing has been charged yet"
              description="Your first invoice appears here the day your trial ends."
            />
          ) : (
            <ul className="divide-y divide-border">
              {invoices.map((invoice) => (
                <li
                  key={invoice.id}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-medium text-slate-900 dark:text-white">
                        {shortDay(invoice.created)}
                      </p>
                      {invoicePill(invoice.status)}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      {invoice.number ? `${invoice.number} · ` : ""}
                      {shortDay(invoice.periodStart)} to {shortDay(invoice.periodEnd)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span className="text-[15px] font-semibold tabular-nums text-slate-900 dark:text-white">
                      {money(invoice.amount, invoice.currency)}
                    </span>
                    <div className="flex items-center gap-2">
                      {invoice.pdfUrl && (
                        <Button asChild size="sm" variant="outline">
                          <a
                            href={invoice.pdfUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <Download className="mr-1.5 h-4 w-4" />
                            PDF
                          </a>
                        </Button>
                      )}
                      {invoice.hostedUrl && (
                        <Button asChild size="sm" variant="ghost">
                          <a
                            aria-label="Open this invoice at Stripe"
                            href={invoice.hostedUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Something not right on an invoice?{" "}
        <a
          className="font-medium text-slate-900 underline underline-offset-4 dark:text-white"
          href="mailto:contact@linkedgrow.ai"
        >
          Write to us
        </a>{" "}
        and we will sort it out.
      </p>
    </PageShell>
  );
}

export function BillingContent() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <div className="flex min-h-96 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
          </div>
        </PageShell>
      }
    >
      <BillingScreen />
    </Suspense>
  );
}
