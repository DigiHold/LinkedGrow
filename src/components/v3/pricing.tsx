"use client";

import { useState } from "react";
import { Section, Eyebrow, H2, Lead, Btn } from "./primitives";

/**
 * Two plans, and the reason each exists.
 *
 * The comparison line under each price is the whole argument: the customer is
 * already paying for a rep, a tool, an AI subscription and proxies, and this
 * replaces the lot. Prices come from src/lib/plans.ts and must not drift from
 * it; if one changes, change it there first.
 */

const PRO = [
  ["2 AI agents", " prospecting every working day"],
  ["2 LinkedIn accounts, 2 audiences, 2 dedicated IPs", ""],
  ["Up to 1,000 buyers contacted a month, warm-up included", ""],
  ["Leads mined from competitor audiences and live signals", ""],
  ["Every lead linked to the post it came from", ""],
  ["Anti-slop gate on every message before it sends", ""],
  ["Unified reply inbox with instant email alerts", ""],
  ["CRM, API and MCP integrations (HubSpot, Pipedrive, Claude...)", ""],
  ["Posts, carousels and scheduling on your own AI key", ""],
];

const BUSINESS = [
  ["3 AI agents", ", 3 LinkedIn accounts, 3 dedicated IPs"],
  ["Up to 1,500 buyers contacted a month", ""],
  ["Unlimited seats inside one shared workspace", ""],
  ["Shared inbox with an owner on every reply", ""],
  ["Lead scoring you can weight yourself", ""],
  ["Salesforce, webhooks and a private MCP endpoint", ""],
  ["Client workspaces and white-label reporting", ""],
  ["Priority support with a named contact", ""],
];

function Tick() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className="mt-[3px] h-4 w-4 shrink-0 text-[#00b8db]">
      <path
        d="m5 10.5 3.2 3.2L15 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function List({ items }: { items: string[][] }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map(([bold, rest]) => (
        <li key={bold} className="flex gap-3">
          <Tick />
          <span className="font-instrument text-[14.5px] leading-[1.55] text-[#1e2a41] dark:text-slate-300">
            <strong className="font-semibold text-[#060911] dark:text-white">{bold}</strong>
            {rest}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function V3Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <Section id="pricing" tone="tint">
      <Eyebrow>Pricing</Eyebrow>
      <H2 className="mt-5 max-w-[18ch]">One price, and nothing else to buy.</H2>
      <Lead className="mt-5 max-w-[64ch]">
        No credits to run out of, no API key to hunt down, no proxy invoice
        arriving separately at the end of the month.
      </Lead>

      <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-[#e7edf5] bg-white p-1 dark:border-white/10 dark:bg-slate-900">
        {[
          { id: false, label: "Monthly" },
          { id: true, label: "Yearly" },
        ].map((option) => (
          <button
            key={String(option.id)}
            onClick={() => setYearly(option.id)}
            className={`rounded-full px-4 py-2 font-instrument text-[13.5px] font-semibold transition-colors ${
              yearly === option.id
                ? "bg-[#060911] text-white dark:bg-white dark:text-slate-900"
                : "text-[#586780] hover:text-[#060911] dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            {option.label}
          </button>
        ))}
        <span className="ml-1 mr-2 font-instrument text-[12.5px] font-medium text-[#00b8db]">
          2 months free
        </span>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <div className="relative rounded-2xl border-2 border-[#155dfc] bg-white p-6 dark:bg-slate-900 sm:p-8">
          <span className="absolute -top-3 left-8 rounded-full bg-[#155dfc] px-3 py-1 font-instrument text-[12px] font-semibold text-white">
            Where most founders start
          </span>
          <h3 className="font-grotesk text-[24px] font-semibold tracking-[-0.03em] text-[#060911] dark:text-white">
            Pro
          </h3>
          <p className="mt-1 font-instrument text-[14px] text-[#586780] dark:text-slate-400">
            Two agents working every day for you
          </p>
          <p className="mt-6 flex items-baseline gap-2">
            <span className="font-grotesk text-[46px] font-semibold leading-none tracking-[-0.04em] text-[#060911] dark:text-white">
              ${yearly ? "82" : "99"}
            </span>
            <span className="font-instrument text-[15px] text-[#586780] dark:text-slate-400">
              / month
            </span>
          </p>
          <p className="mt-2 font-instrument text-[13px] text-[#8996ac]">
            {yearly ? "billed $990 a year" : "or $990 a year, two months free"}
          </p>
          <p className="mt-5 rounded-xl bg-[#f6f9fd] p-4 font-instrument text-[13.5px] leading-[1.6] text-[#586780] dark:bg-white/5 dark:text-slate-400">
            A rep costs around $4,000 a month, an outreach tool $99, an AI
            subscription $20, two proxies $30. You are paying for one of those
            four.
          </p>
          <p className="mt-6 font-instrument text-[12.5px] font-semibold uppercase tracking-[0.14em] text-[#8996ac]">
            What&apos;s included
          </p>
          <List items={PRO} />
          <Btn href="/sign-up" variant="grad" className="mt-8 w-full">
            Start free for 7 days
          </Btn>
        </div>

        <div className="rounded-2xl border border-[#e7edf5] bg-white p-6 dark:border-white/10 dark:bg-slate-900 sm:p-8">
          <h3 className="font-grotesk text-[24px] font-semibold tracking-[-0.03em] text-[#060911] dark:text-white">
            Business
          </h3>
          <p className="mt-1 font-instrument text-[14px] text-[#586780] dark:text-slate-400">
            Three agents and the team around them
          </p>
          <p className="mt-6 flex items-baseline gap-2">
            <span className="font-grotesk text-[46px] font-semibold leading-none tracking-[-0.04em] text-[#060911] dark:text-white">
              ${yearly ? "149" : "179"}
            </span>
            <span className="font-instrument text-[15px] text-[#586780] dark:text-slate-400">
              / month
            </span>
          </p>
          <p className="mt-2 font-instrument text-[13px] text-[#8996ac]">
            {yearly ? "billed $1,790 a year" : "or $1,790 a year, two months free"}
          </p>
          <p className="mt-5 rounded-xl bg-[#f6f9fd] p-4 font-instrument text-[13.5px] leading-[1.6] text-[#586780] dark:bg-white/5 dark:text-slate-400">
            A lead that never reaches the CRM does not exist. This tier puts every
            one of them there automatically and gives each reply an owner.
          </p>
          <p className="mt-6 font-instrument text-[12.5px] font-semibold uppercase tracking-[0.14em] text-[#8996ac]">
            Everything in Pro, plus
          </p>
          <List items={BUSINESS} />
          <Btn href="/sign-up" variant="plain" className="mt-8 w-full">
            Start free for 7 days
          </Btn>
        </div>
      </div>
    </Section>
  );
}
