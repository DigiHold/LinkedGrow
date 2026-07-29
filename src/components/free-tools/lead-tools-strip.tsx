"use client";

import Link from "next/link";
import { ClipboardCheck, Coins, Gauge, Library, MessageSquare, Target } from "lucide-react";

/**
 * The five lead tools, on every other free tool page.
 *
 * The older tools each carry their own hand-written Related Tools list, so
 * adding five entries meant editing sixteen arrays and sixteen icon imports.
 * One strip, imported once per page, keeps the set in a single place the day a
 * sixth tool ships.
 */

const LEAD_TOOLS = [
  {
    icon: Target,
    title: "Ideal Customer Profile Template",
    blurb: "7 questions, a written profile, and the LinkedIn search that finds those people.",
    href: "/free-tools/ideal-customer-profile-template",
  },
  {
    icon: Gauge,
    title: "Connection Request Limit Calculator",
    blurb: "How many invitations your account can send today, plus the warm-up ramp.",
    href: "/free-tools/linkedin-connection-request-limit",
  },
  {
    icon: MessageSquare,
    title: "Connection Request Message Generator",
    blurb: "5 notes under the 300 character cap, from your own details.",
    href: "/free-tools/linkedin-connection-request-message",
  },
  {
    icon: Library,
    title: "Cold Message Templates",
    blurb: "Scripts for 4 goals, covering the first message through to the reply.",
    href: "/free-tools/linkedin-cold-message-template",
  },
  {
    icon: Coins,
    title: "Cost Per Lead Calculator",
    blurb: "What a qualified lead costs once your own hours are in the total.",
    href: "/free-tools/cost-per-lead-calculator",
  },
  {
    icon: ClipboardCheck,
    title: "LinkedIn Profile Checker",
    blurb: "12 checks on what a stranger reads before accepting your invitation.",
    href: "/free-tools/linkedin-profile-checker",
  },
];

export function LeadToolsStrip() {
  return (
    <section className="relative py-[clamp(44px,5.5vw,76px)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="m-0 font-v3-display! text-[clamp(24px,2.9vw,34px)] font-semibold! leading-[1.12]! tracking-[-.04em]! text-slate-900 dark:text-white">
          Free tools for finding leads
        </h2>
        <p className="mt-3 max-w-[58ch] text-[16px] leading-[1.65] text-slate-600 dark:text-slate-300">
          The other half of LinkedIn. Work out who to approach, how much you can
          safely send, and what to say when you get there.
        </p>

        <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEAD_TOOLS.map((tool) => (
            <li key={tool.href}>
              <Link
                className="flex h-full flex-col rounded-2xl border border-slate-200 p-5 transition-colors hover:border-cyan-500/60 hover:bg-cyan-50/40 dark:border-slate-800 dark:hover:border-cyan-400/50 dark:hover:bg-cyan-400/5"
                href={tool.href}
              >
                <tool.icon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                <span className="mt-3 text-[15px] font-semibold text-slate-900 dark:text-white">
                  {tool.title}
                </span>
                <span className="mt-1.5 text-[13.5px] leading-[1.6] text-slate-600 dark:text-slate-400">
                  {tool.blurb}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
