"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Quote, ShieldAlert, Table2 } from "lucide-react";

import { V3_ROOT } from "@/components/v3/root";
import {
  CARVE_BASE,
  EB_DOT_LT,
  EB_LT,
  HERO_FIELD,
  HERO_ORB_A,
  HERO_ORB_B,
  HERO_RINGS,
  VPROP,
} from "@/components/v3/kit";
import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";
import { LandingFAQ } from "@/components/landing/landing-faq";
import { LandingCTA } from "@/components/landing/landing-cta";
import { LandingRelatedContent } from "@/components/landing/landing-related-content";
import { QuickAnswer } from "@/components/seo/quick-answer";
import { MarketingExitIntentPopup } from "@/components/marketing/exit-intent-popup";
import { V3UrlForm } from "@/components/v3/url-form";

/**
 * The scraper page.
 *
 * Nicolas's call, 2026-07-29: rank for the term. The plan flagged the risk that
 * the word frames the product as scraping, which cuts against every safety
 * argument, so the page does not pretend to be a scraper. It answers the
 * question honestly, shows what a scraped row is missing, and offers the thing
 * the searcher actually wanted. Bespoke rather than the shared feature shell,
 * because the centrepiece is the argument.
 */

const CSV_ROW = [
  { field: "name", value: "Sarah Whitfield" },
  { field: "headline", value: "Head of Talent at Northwind" },
  { field: "company", value: "Northwind Recruitment" },
  { field: "location", value: "Manchester, UK" },
  { field: "url", value: "linkedin.com/in/…" },
];

function Centrepiece() {
  return (
    <section className="relative py-[clamp(56px,7vw,96px)]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="m-0 max-w-[20ch] font-v3-display! text-[clamp(28px,3.6vw,44px)] font-semibold! leading-[1.08]! tracking-[-.042em]! text-slate-900 dark:text-white">
          Same person. One of these tells you what to say.
        </h2>

        <div className="mt-9 grid gap-5 lg:grid-cols-2">
          {/* What a scrape hands you */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/50">
            <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[.06em] text-slate-500 dark:text-slate-400">
              <Table2 className="h-4 w-4" />
              What the export gives you
            </p>

            <dl className="mt-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              {CSV_ROW.map((cell) => (
                <div
                  className="grid grid-cols-[9ch_1fr] gap-3 border-b border-slate-200 px-4 py-2.5 last:border-b-0 dark:border-slate-800"
                  key={cell.field}
                >
                  <dt className="font-mono text-[12px] uppercase tracking-[.04em] text-slate-400">
                    {cell.field}
                  </dt>
                  <dd className="m-0 truncate font-mono text-[13px] text-slate-700 dark:text-slate-200">
                    {cell.value}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-5 text-[15px] leading-[1.65] text-slate-600 dark:text-slate-300">
              Five facts, all of them true, none of them a reason to write this
              week rather than next year. Multiply by 800 rows and you have a
              spreadsheet, an enrichment bill and a blank message box.
            </p>
          </div>

          {/* What a signal hands you */}
          <div className="rounded-3xl border border-cyan-500/40 bg-cyan-50/40 p-6 dark:border-cyan-400/30 dark:bg-cyan-400/5">
            <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[.06em] text-cyan-700 dark:text-cyan-300">
              <Quote className="h-4 w-4" />
              What the agent gives you
            </p>

            <figure className="mt-5 rounded-2xl border border-cyan-500/25 bg-white p-5 dark:border-cyan-400/20 dark:bg-slate-900/60">
              <blockquote className="m-0 text-[15.5px] leading-[1.65] text-slate-800 dark:text-slate-100">
                &ldquo;Third time this quarter we have lost a candidate between
                the second interview and the offer. It is always the scheduling
                gap. Anyone actually solved this?&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-[13px] text-slate-500 dark:text-slate-400">
                Sarah Whitfield, Head of Talent at Northwind. Posted 2 days ago.
              </figcaption>
            </figure>

            <p className="mt-5 text-[15px] leading-[1.65] text-slate-700 dark:text-slate-200">
              The same person, with the sentence that makes her worth writing to
              attached. You know what to open on, you know it is this month&apos;s
              problem, and the note writes itself from her own words.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const SECTIONS = [
  {
    title: "What a LinkedIn scraper actually does",
    paragraphs: [
      "A scraper visits profiles and copies the visible fields into a spreadsheet. Name, headline, company, location, profile URL. Most of them run as a Chrome extension using your own logged-in session, which is why they are cheap: your machine and your account are the infrastructure doing the visiting.",
      "Some add enrichment on top, guessing at an email address from the name and the company domain and charging per credit for the guess. The guess is right often enough to be useful and wrong often enough to hurt a sending domain, which is a separate problem you inherit the day you start using it.",
      "None of that is difficult technology. The reason scrapers exist is that LinkedIn does not let you export, and the reason that matters is the next section.",
    ],
  },
  {
    title: "What it costs you, honestly",
    paragraphs: [
      "LinkedIn's user agreement prohibits automated data collection, and the platform detects it by pattern rather than by tool. What stands out is volume without variation: an account that normally views 10 profiles a day suddenly viewing 400 in an hour, often from an address it has never used before. Slow extraction from an established account is rarely noticed. Bulk extraction usually is.",
      "The legal question and the account question are separate, and people conflate them constantly. Scraping public data has survived court challenges in the United States, which tells you something about what a court will do and nothing at all about what LinkedIn will do to your profile, which it can restrict at its own discretion under its own terms.",
      "So the real cost is not a lawsuit. It is a restriction on the account carrying a decade of your professional relationships, applied at a moment you did not choose, over a spreadsheet you could have filled a slower way.",
    ],
  },
  {
    title: "The thing you were actually trying to buy",
    paragraphs: [
      "Almost nobody wants a spreadsheet. They want conversations with people who might buy, and a scrape is the route they know. The trouble is that the export strips out the only thing that makes a cold message work, which is the reason you are writing this week.",
      "LinkedGrow takes the other route. You give it your website address, it reads the site and works out who buys from you, and then it watches LinkedIn every working day for those people: anyone engaging with a competitor, asking about the problem you solve in public, or newly in the seat that owns it. Nothing is exported and nothing is enriched.",
      "Each lead keeps the post or comment that surfaced it, linked. The invitation quotes that, one message follows once they accept, one follow-up after that, and then it stops. A reply cancels everything queued for that person and lands in your inbox.",
      "It runs from your own LinkedIn account through its own cloud session, on a dedicated residential address in the country you pick, inside your office hours, at a pace the account has earned through warm-up. That is the opposite pattern to a scrape: low volume, consistent address, boring rhythm, nothing that looks like a burst.",
    ],
  },
];

export function LinkedinScraperContent({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  return (
    <main className={V3_ROOT}>
      <Header />

      <section className={`${HERO_FIELD} pb-[clamp(124px,13.5vw,190px)]`}>
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]">
          <span className={HERO_ORB_A}></span>
          <span className={HERO_ORB_B}></span>
          <div className={HERO_RINGS}><i></i><i></i><i></i></div>
        </div>
        <canvas
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
          id="net"
        ></canvas>

        <div className="relative z-[3] mx-auto max-w-[1220px] px-6 text-center">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 ${EB_LT}`}
            initial={{ opacity: 0, y: 20 }}
          >
            <i className={EB_DOT_LT} />
            An honest answer
          </motion.div>

          <motion.h1
            animate={{ opacity: 1, y: 0 }}
            className="m-0 mb-4 flex flex-col items-center font-v3-display! text-[clamp(43px,6.8vw,88px)] font-semibold! leading-[.98]! tracking-[-.048em]! text-white"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.05 }}
          >
            <span className="leading-[1.18]">LinkedIn Scraper:</span>{" "}
            <span className="leading-[1.18] text-v3-sky">
              What It Gets You, and What It Costs
            </span>
          </motion.h1>

          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-8 max-w-[62ch] text-[clamp(16.5px,1.35vw,19px)] leading-[1.58]! text-[rgba(255,255,255,.76)]"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
          >
            LinkedGrow is not a scraper and this page is not going to pretend
            otherwise. Here is what an export actually hands you, what it risks
            on the account you cannot replace, and the route that gets the same
            people with the reason to write already attached.
          </motion.p>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.15 }}
          >
            {[
              { icon: Table2, text: "No export, no enrichment" },
              { icon: ShieldAlert, text: "No bulk profile visiting" },
              { icon: Quote, text: "The source post on every lead" },
            ].map((item) => (
              <div className={VPROP} key={item.text}>
                <item.icon className="h-[15px] w-[15px]" />
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <div className={`${CARVE_BASE} bg-v3-bg dark:bg-v3-bg-d`}></div>
      </section>

      <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
        <QuickAnswer
          answer="A LinkedIn scraper copies profile fields into a spreadsheet, usually through a browser extension on your own account. It gives you names and titles, and it gives you no reason to write to any of them this week. LinkedGrow finds the same people from public signals, keeps the post that surfaced each one, and never exports anything."
          question="What is a LinkedIn scraper, and is it worth it?"
        />
      </div>

      <Centrepiece />

      {SECTIONS.map((block, index) => (
        <section
          className={`relative py-[clamp(48px,6vw,84px)] ${index === 1 ? "bg-white dark:bg-slate-900/40" : ""}`}
          key={block.title}
        >
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="m-0 font-v3-display! text-[clamp(26px,3.2vw,38px)] font-semibold! leading-[1.1]! tracking-[-.04em]! text-slate-900 dark:text-white">
              {block.title}
            </h2>
            <div className="mt-5 space-y-5 text-[16px] leading-[1.7] text-slate-600 dark:text-slate-300">
              {block.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="relative pb-[clamp(48px,6vw,84px)]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-3xl border border-slate-200 p-6 sm:p-8 dark:border-slate-800">
            <h2 className="m-0 font-v3-display! text-[clamp(22px,2.6vw,30px)] font-semibold! leading-[1.12]! tracking-[-.04em]! text-slate-900 dark:text-white">
              Try it on your own site
            </h2>
            <p className="mt-3 max-w-[58ch] text-[16px] leading-[1.65] text-slate-600 dark:text-slate-300">
              Paste your address and the agent reads the page, works out who
              buys from you, and shows you the profile it built before it
              touches LinkedIn. If you would rather do that part by hand, the{" "}
              <Link
                className="font-medium text-cyan-700 underline-offset-4 hover:underline dark:text-cyan-300"
                href="/free-tools/ideal-customer-profile-template"
              >
                ideal customer profile template
              </Link>{" "}
              is free and takes about 5 minutes.
            </p>
            <V3UrlForm className="mt-6 w-full" label="Show me my buyers" />
          </div>
        </div>
      </section>

      <LandingFAQ
        description="The questions people ask before deciding how to get leads off LinkedIn."
        faqs={faqs}
        headline={{ text: "Questions about", gradient: "scraping LinkedIn" }}
      />

      <LandingRelatedContent
        headline="Related"
        links={[
          { title: "LinkedIn prospecting", href: "/features/linkedin-prospecting" },
          { title: "Buying signals", href: "/features/buying-signals" },
          { title: "LinkedIn connection limit", href: "/features/linkedin-connection-limit" },
          { title: "Best LinkedIn automation tools", href: "/linkedin-automation-tools" },
          { title: "Ideal customer profile template", href: "/free-tools/ideal-customer-profile-template" },
        ]}
      />

      <LandingCTA
        badge="No export, no enrichment bill"
        description="Give the agent your website address. It works out who buys from you, watches for the week they start looking, and opens the conversation from your own account at a pace that account can carry."
        headline={{ line1: "Skip the spreadsheet.", gradient: "Start the conversation." }}
        primaryCta={{ text: "Launch my agent", href: "/sign-up" }}
        trustIndicators={["7-day Pro trial", "No credit card required", "Everything included"]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
