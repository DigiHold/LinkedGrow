"use client";

import Link from "next/link";

/**
 * The shortlist that turns a topic page into a hub.
 *
 * Section 10e of the plan holds the head term at KD 51 and the "best" variant
 * at KD 0, and says to build the hub only once four or five comparison pages
 * exist to feed it. They do now, so this is the block that feeds them. Prices
 * were verified on 2026-07-29 and live in one place so they cannot drift across
 * the pages that quote them.
 */

interface Tool {
  name: string;
  price: string;
  bestFor: string;
  watchOut: string;
  href?: string;
}

const TOOLS: Tool[] = [
  {
    name: "LinkedGrow",
    price: "$99 a month for the workspace",
    bestFor:
      "One business filling its own pipeline. It reads your website, finds the people daily, writes from what they posted and follows up once.",
    watchOut:
      "Two connected LinkedIn accounts on Pro and three on Business. It is not built to run 50 client profiles.",
  },
  {
    name: "Dripify",
    price: "$39 to $99 per user",
    bestFor:
      "One person working a list they already trust, inside a campaign builder most teams already understand.",
    watchOut:
      "Priced per seat, so the bill multiplies by headcount, and building the list stays your job.",
    href: "/compare/dripify-alternative",
  },
  {
    name: "HeyReach",
    price: "About $79 per connected sender",
    bestFor:
      "Agencies running outreach across many client accounts. The bundles reach roughly $20 an account at volume.",
    watchOut:
      "The price follows the number of LinkedIn accounts, and sourcing is still something you bring.",
    href: "/compare/heyreach-alternative",
  },
  {
    name: "Lemlist",
    price: "$63 to $109 per user",
    bestFor:
      "Teams whose main channel is cold email, with LinkedIn steps inside a multichannel sequence.",
    watchOut:
      "Mailboxes at $9 each, enrichment credits that reset every cycle, and calling credits bought separately.",
    href: "/compare/lemlist-alternative",
  },
  {
    name: "PhantomBuster",
    price: "$69 to $439 a month",
    bestFor:
      "Technical teams with an unusual workflow who want to assemble their own chain of steps.",
    watchOut:
      "You buy execution hours. They expire monthly, and when they run out everything stops until the next cycle.",
    href: "/compare/phantombuster-alternative",
  },
  {
    name: "Sales Navigator",
    price: "$89.99 to $159.99 per seat",
    bestFor:
      "Deliberate research on named accounts. The filters go deeper than anything else on LinkedIn.",
    watchOut:
      "It finds people and contacts nobody. Every message is still written and sent by hand.",
    href: "/compare/linkedin-sales-navigator-alternative",
  },
];

export function ToolShortlist() {
  return (
    <section className="relative py-[clamp(48px,6vw,84px)]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h2 className="m-0 font-v3-display! text-[clamp(26px,3.2vw,38px)] font-semibold! leading-[1.1]! tracking-[-.04em]! text-slate-900 dark:text-white">
          The best LinkedIn automation tools, and who each one is for
        </h2>
        <p className="mt-4 max-w-[62ch] text-[16.5px] leading-[1.65] text-slate-600 dark:text-slate-300">
          There is no single best tool here, only a best fit for the shape of
          your work. Prices were checked on 29 July 2026 and move often, so
          confirm on each vendor&apos;s own page before deciding anything.
        </p>

        <ul className="mt-7 space-y-4">
          {TOOLS.map((tool) => (
            <li
              className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800"
              key={tool.name}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="m-0 text-[17px] font-semibold text-slate-900 dark:text-white">
                  {tool.name}
                </h3>
                <span className="text-[14px] font-medium text-slate-600 dark:text-slate-300">
                  {tool.price}
                </span>
              </div>
              <p className="mt-3 text-[15px] leading-[1.65] text-slate-700 dark:text-slate-200">
                <strong className="font-semibold text-slate-900 dark:text-white">
                  Best for:
                </strong>{" "}
                {tool.bestFor}
              </p>
              <p className="mt-2 text-[15px] leading-[1.65] text-slate-600 dark:text-slate-400">
                <strong className="font-semibold text-slate-800 dark:text-slate-200">
                  Watch out:
                </strong>{" "}
                {tool.watchOut}
              </p>
              {tool.href && (
                <Link
                  className="mt-3 inline-block text-[14px] font-medium text-cyan-700 underline-offset-4 hover:underline dark:text-cyan-300"
                  href={tool.href}
                >
                  Read the full {tool.name} comparison
                </Link>
              )}
            </li>
          ))}
        </ul>

        <p className="mt-6 text-[15px] leading-[1.65] text-slate-600 dark:text-slate-300">
          Smaller tools worth knowing about rather than comparing at length:
          Waalaxy and Expandi sit in the same per-seat outreach category as
          Dripify, Meet Alfred and Dux-Soup are older desktop-era products, and
          Octopus CRM is the cheapest way to send invitations if that is genuinely
          all you need.
        </p>
      </div>
    </section>
  );
}
