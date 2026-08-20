"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Check, Minus } from "lucide-react";

import { V3_ROOT } from "@/components/v3/root";
import { V3Clip } from "@/components/v3/clip";
import { YouTubePlayer } from "@/components/youtube-player";
import {
  CHROME_DK,
  CHROME_DOT_DK,
  CHROME_DOT_LT,
  CHROME_LT,
  CHROME_URL_DK,
  CHROME_URL_LT,
  FILL,
  FILL_MD,
  FILL_PRI,
  SCREEN_DK,
  SCREEN_LT,
  VID,
} from "@/components/v3/kit";
import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { QuickAnswer } from "@/components/seo/quick-answer";
import { LandingFAQ } from "@/components/landing/landing-faq";
import { LandingCTA } from "@/components/landing/landing-cta";
import { LandingRelatedContent } from "@/components/landing/landing-related-content";
import { MarketingExitIntentPopup } from "@/components/marketing/exit-intent-popup";
import { cn } from "@/lib/utils";

/**
 * The frame every `<competitor>-alternative` page shares.
 *
 * The pricing block is the reason this exists rather than a copy per page. The
 * pricing keyword usually outsells the alternative keyword, so every page needs
 * real numbers laid out the same way, and numbers laid out by hand five times
 * drift. Prices are passed in verified, never written from memory.
 */

export interface ComparePageProps {
  competitor: string;
  hero: {
    badge: { icon: LucideIcon; text: string };
    line1: string;
    gradient: string;
    descriptionBold: string;
    description: string;
    valueProps: { icon: LucideIcon; text: string }[];
  };
  quickAnswer: { question: string; answer: string };
  /** Verified the day the page was written, with the source named in the body. */
  pricing: {
    verifiedOn: string;
    note: string;
    rows: { plan: string; monthly: string; annual: string; detail: string }[];
    ours: { plan: string; monthly: string; detail: string }[];
    takeaway: string;
  };
  differences: {
    heading: string;
    gradient: string;
    lead: string;
    rows: { label: string; them: string; us: string; usWins: boolean }[];
  };
  body: { title: string; paragraphs: string[] }[];
  faqs: { question: string; answer: string }[];
  related: { title: string; href: string }[];
  cta: { badge: string; line1: string; gradient: string; description: string };
  /** Leads-tool comparisons only: the presentation video under the hero and
   *  the real product clips. Posting-tool pages never set it. */
  showLeadsDemo?: boolean;
}

const TRUST = ["7-day trial", "Cancel before day 7", "Everything included"];

const R2_IMAGES = "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images";

/** The same product clips the home page sells with, captioned for a visitor
 *  who arrived comparing tools rather than browsing. */
const PROOF_CLIPS = [
  {
    name: "icp",
    url: "app.linkedgrow.ai/agents/new",
    label: "The setup reading a website, then naming the audience and the sources to hunt in",
    title: "It reads your website and names your buyers",
    text: "You type your address and the agent works out who buys from you, lists the competitors who share your audience, and shows you everything before it touches LinkedIn.",
  },
  {
    name: "leads",
    url: "app.linkedgrow.ai/agents/saas-founders/leads",
    label: "The Leads tab, every lead linked to the post it came from",
    title: "Every lead arrives with the receipt attached",
    text: "The Leads tab links every person to the exact post or comment that surfaced them, so you can read their real words before a message is written.",
  },
  {
    name: "queue",
    url: "app.linkedgrow.ai/agents/saas-founders/queue",
    label: "Tomorrow's messages, each written from what that person posted",
    title: "It writes from what they said, never from a template",
    text: "One invitation built from their actual comment, one follow-up, and then silence. You can read and edit tomorrow's queue the evening before it goes out.",
  },
  {
    name: "replies",
    url: "app.linkedgrow.ai/replies",
    label: "The Replies inbox, with the whole conversation attached",
    title: "It hands you the conversation once it turns real",
    text: "The agent answers the first few turns and closes a polite no without waking you. The moment a thread shows real interest, it stops writing and emails you the person with the whole exchange attached.",
  },
];

/** Real recordings of the dashboard, social proof, and the two ways in. */
function LeadsProofSection() {
  return (
    <section className="relative border-y border-slate-200 bg-white py-[clamp(48px,6vw,84px)] dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="m-0 font-v3-display! text-[clamp(26px,3.2vw,38px)] font-semibold! leading-[1.1]! tracking-[-.04em]! text-slate-900 dark:text-white">
          Watch the agent do the job{" "}
          <em className="not-italic text-cyan-600 dark:text-cyan-400">in the real product</em>
        </h2>
        <p className="mt-4 max-w-[62ch] text-[16.5px] leading-[1.65] text-slate-600 dark:text-slate-300">
          These are recordings of the real product, not mockups. Everything below runs for you every working day once the four-minute setup is done.
        </p>
        <div className="mt-12 space-y-14">
          {PROOF_CLIPS.map((clip, i) => (
            <div className="grid items-center gap-7 md:grid-cols-2 md:gap-12" key={clip.name}>
              <div className={i % 2 === 1 ? "md:order-2" : ""}>
                <h3 className="m-0 font-v3-display! text-[clamp(20px,2.2vw,26px)] font-semibold! leading-[1.15]! tracking-[-.03em]! text-slate-900 dark:text-white">
                  {clip.title}
                </h3>
                <p className="mt-3 text-[15.5px] leading-[1.65] text-slate-600 dark:text-slate-300">
                  {clip.text}
                </p>
              </div>
              <figure className={SCREEN_LT}>
                <div className={CHROME_LT}>
                  <i className={CHROME_DOT_LT}></i>
                  <i className={CHROME_DOT_LT}></i>
                  <i className={CHROME_DOT_LT}></i>
                  <span className={CHROME_URL_LT}>{clip.url}</span>
                </div>
                <div className={VID}>
                  <V3Clip label={clip.label} name={clip.name} />
                </div>
              </figure>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-center gap-5 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="flex -space-x-2.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <img
                  alt=""
                  className="h-9 w-9 rounded-full border-2 border-white bg-slate-200 object-cover dark:border-slate-900"
                  key={n}
                  loading="lazy"
                  src={`${R2_IMAGES}/person${n}.avif`}
                />
              ))}
            </span>
            <span className="text-[14.5px] text-slate-600 dark:text-slate-300">
              <b className="font-bold text-slate-900 dark:text-white">179+</b> founders already run their LinkedIn with LinkedGrow
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link className={cn(FILL, FILL_MD, FILL_PRI)} href="/sign-up">
              Start your 7-day trial
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-[13px] border border-slate-300 px-[22px] py-3 text-[15px] font-semibold text-slate-800 transition-colors hover:border-slate-400 dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-500"
              href="/book-demo"
            >
              Book a live demo
            </Link>
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">
            7-day trial, cancel any time before day 7.
          </p>
        </div>
      </div>
    </section>
  );
}

/** Column headings, so the unit is stated once instead of on every figure. */
function PriceHead() {
  return (
    <div className="hidden grid-cols-[1fr_auto_auto] gap-x-8 border-b border-slate-200 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[.06em] text-slate-400 sm:grid dark:border-slate-800">
      <span>Plan</span>
      <span className="text-right">Monthly</span>
      <span className="w-[7ch] text-right">Annual</span>
    </div>
  );
}

/**
 * One price line.
 *
 * On a phone this collapses to a stacked card with the figures labelled, per
 * the house rule that a table never scrolls sideways. An empty `annual` means
 * the plan has a single price, so the column is left blank rather than filled
 * with a word that reads as a number.
 */
function PriceRow({
  row,
}: {
  row: { plan: string; monthly: string; annual: string; detail: string };
}) {
  const single = !row.annual || row.annual === row.monthly;
  return (
    <div className="border-b border-slate-200 px-5 py-4 last:border-b-0 dark:border-slate-800">
      <div className="grid gap-x-8 gap-y-1 sm:grid-cols-[1fr_auto_auto] sm:items-baseline">
        <span className="text-[15px] font-semibold text-slate-900 dark:text-white">
          {row.plan}
        </span>
        <span className="text-[15px] tabular-nums text-slate-800 sm:text-right dark:text-slate-100">
          <span className="text-slate-400 sm:hidden">Monthly </span>
          {row.monthly}
        </span>
        <span className="w-[7ch] text-[15px] tabular-nums text-slate-500 sm:text-right dark:text-slate-400">
          {single ? (
            <span className="hidden sm:inline">&nbsp;</span>
          ) : (
            <>
              <span className="text-slate-400 sm:hidden">Annual </span>
              {row.annual}
            </>
          )}
        </span>
      </div>
      <p className="mt-2 text-[13.5px] leading-[1.6] text-slate-500 dark:text-slate-400">
        {row.detail}
      </p>
    </div>
  );
}

export function ComparePage({
  competitor,
  hero,
  quickAnswer,
  pricing,
  differences,
  body,
  faqs,
  related,
  cta,
  showLeadsDemo,
}: ComparePageProps) {
  return (
    <main className={V3_ROOT}>
      <Header />

      <LandingHero
        badge={hero.badge}
        description={hero.description}
        descriptionBold={hero.descriptionBold}
        headline={{ line1: hero.line1, gradient: hero.gradient }}
        primaryCta={{ text: "Launch my agent", href: "/sign-up" }}
        trustIndicators={TRUST}
        valuePropBadges={hero.valueProps}
      />

      {showLeadsDemo && (
        <section className="relative pb-[clamp(28px,4vw,48px)]">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <figure className={SCREEN_DK}>
              <div className={CHROME_DK}>
                <i className={CHROME_DOT_DK}></i>
                <i className={CHROME_DOT_DK}></i>
                <i className={CHROME_DOT_DK}></i>
                <span className={CHROME_URL_DK}>app.linkedgrow.ai/agents/saas-founders</span>
              </div>
              <div className={VID}>
                <YouTubePlayer
                  ctaHref="/sign-up"
                  ctaText="Start your 7-day trial"
                  thumbnailUrl={`${R2_IMAGES}/video-thumb-agents.avif`}
                  videoId="1MVCdQZiN9I"
                />
              </div>
            </figure>
          </div>
        </section>
      )}

      <QuickAnswer answer={quickAnswer.answer} question={quickAnswer.question} />

      {/* Pricing first. It is what the search was actually about. */}
      <section className="relative py-[clamp(48px,6vw,84px)]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="m-0 font-v3-display! text-[clamp(26px,3.2vw,38px)] font-semibold! leading-[1.1]! tracking-[-.04em]! text-slate-900 dark:text-white">
            {competitor} pricing, and what it costs next to LinkedGrow
          </h2>
          <p className="mt-4 max-w-[62ch] text-[16.5px] leading-[1.65] text-slate-600 dark:text-slate-300">
            {pricing.note} Checked on {pricing.verifiedOn}. Pricing moves, so confirm
            on their own page before you decide anything.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <p className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-[13px] font-semibold uppercase tracking-[.06em] text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
              {competitor}
            </p>
            <PriceHead />
            {pricing.rows.map((row) => (
              <PriceRow key={row.plan} row={row} />
            ))}
          </div>

          {/* Ours sits in its own card with the accent, because the contrast is
              the argument. Side by side in one grid it reads as another vendor. */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-cyan-500/40 bg-cyan-50/40 dark:border-cyan-400/30 dark:bg-cyan-400/5">
            <p className="border-b border-cyan-500/20 px-5 py-3 text-[13px] font-semibold uppercase tracking-[.06em] text-cyan-700 dark:border-cyan-400/20 dark:text-cyan-300">
              LinkedGrow
            </p>
            {pricing.ours.map((row) => (
              <PriceRow
                key={row.plan}
                row={{ plan: row.plan, monthly: row.monthly, annual: "", detail: row.detail }}
              />
            ))}
          </div>

          <p className="mt-6 rounded-2xl border border-slate-200 p-5 text-[15px] leading-[1.65] text-slate-700 dark:border-slate-800 dark:text-slate-200">
            {pricing.takeaway}
          </p>
        </div>
      </section>

      <section className="relative bg-white py-[clamp(48px,6vw,84px)] dark:bg-slate-900/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="m-0 font-v3-display! text-[clamp(26px,3.2vw,38px)] font-semibold! leading-[1.1]! tracking-[-.04em]! text-slate-900 dark:text-white">
            {differences.heading}{" "}
            <em className="not-italic text-cyan-600 dark:text-cyan-400">
              {differences.gradient}
            </em>
          </h2>
          <p className="mt-4 max-w-[62ch] text-[16.5px] leading-[1.65] text-slate-600 dark:text-slate-300">
            {differences.lead}
          </p>

          {/* Stacked cards rather than a scrolling table: it has to read on a phone. */}
          <ul className="mt-7 space-y-4">
            {differences.rows.map((row) => (
              <li
                className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800"
                key={row.label}
              >
                <p className="text-[13px] font-semibold uppercase tracking-[.06em] text-slate-500 dark:text-slate-400">
                  {row.label}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                      {competitor}
                    </p>
                    <p className="mt-1 text-[15px] leading-[1.6] text-slate-700 dark:text-slate-200">
                      {row.them}
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-[13px] font-medium text-cyan-700 dark:text-cyan-300">
                      {row.usWins ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Minus className="h-3.5 w-3.5" />
                      )}
                      LinkedGrow
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-[15px] leading-[1.6]",
                        row.usWins
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-700 dark:text-slate-200"
                      )}
                    >
                      {row.us}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {showLeadsDemo && <LeadsProofSection />}

      {body.map((block) => (
        <section className="relative py-[clamp(48px,6vw,84px)]" key={block.title}>
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="m-0 font-v3-display! text-[clamp(26px,3.2vw,38px)] font-semibold! leading-[1.1]! tracking-[-.04em]! text-slate-900 dark:text-white">
              {block.title}
            </h2>
            <div className="mt-5 space-y-5 text-[16px] leading-[1.7] text-slate-600 dark:text-slate-300">
              {block.paragraphs.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
          </div>
        </section>
      ))}

      <LandingFAQ
        description="Short answers to what people ask before they switch."
        faqs={faqs}
        headline={{ text: `Questions about the`, gradient: `${competitor} alternative` }}
      />

      <LandingRelatedContent headline="Related" links={related} />

      <LandingCTA
        badge={cta.badge}
        description={cta.description}
        headline={{ line1: cta.line1, gradient: cta.gradient }}
        primaryCta={{ text: "Launch my agent", href: "/sign-up" }}
        trustIndicators={TRUST}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}

/** A plain text link, used inside the body paragraphs of a comparison page. */
export function CompareLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      className="font-medium text-cyan-700 underline-offset-4 hover:underline dark:text-cyan-300"
      href={href}
    >
      {children}
    </Link>
  );
}
