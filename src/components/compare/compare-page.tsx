"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Check, Minus } from "lucide-react";

import { V3_ROOT } from "@/components/v3/root";
import { V3AgentJobsSection } from "@/components/v3/agent-jobs-section";
import { V3McpSection } from "@/components/v3/mcp-section";
import { V3Plans } from "@/components/v3/pricing-section";
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

/** Column headings, so the unit is stated once instead of on every figure. */
function PriceHead() {
  return (
    <div className="hidden grid-cols-[1fr_auto_auto] gap-x-8 border-b border-v3-line px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[.06em] text-slate-400 sm:grid dark:border-v3-line-d">
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
    <div className="border-b border-v3-line px-5 py-4 last:border-b-0 dark:border-v3-line-d">
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
        primaryCta={{ text: "Launch my agent for $0", href: "/sign-up" }}
        trustIndicators={TRUST}
        valuePropBadges={hero.valueProps}
        {...(showLeadsDemo
          ? {
              monoLine:
                "Use any agent: OpenClaw / Hermes / Claude / ChatGPT / Codex / Cursor / Grok Bot",
              video: {
                videoId: "1MVCdQZiN9I",
                thumbnailUrl: `${R2_IMAGES}/video-thumb-agents.avif`,
                ctaText: "Start your 7-day trial",
                ctaHref: "/sign-up",
                chromeUrl: "app.linkedgrow.ai/agents/saas-founders",
                annotations: {
                  left: 'no template,\nno "I saw your post"',
                  right: "every lead shows you\nthe post it came from",
                },
              },
            }
          : {})}
      />

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

          <div className="mt-8 overflow-hidden rounded-[18px] border border-v3-line bg-white shadow-[0_24px_50px_-38px_rgba(6,9,17,.35)] dark:border-v3-line-d dark:bg-slate-900/60">
            <p className="border-b border-v3-line bg-v3-bg2 px-5 py-3 text-[13px] font-semibold uppercase tracking-[.06em] text-slate-500 dark:border-v3-line-d dark:bg-white/5 dark:text-slate-400">
              {competitor}
            </p>
            <PriceHead />
            {pricing.rows.map((row) => (
              <PriceRow key={row.plan} row={row} />
            ))}
          </div>

          {/* Ours sits in its own card with the accent, because the contrast is
              the argument. Side by side in one grid it reads as another vendor. */}
          <div className="relative mt-5 overflow-hidden rounded-[18px] border border-transparent shadow-[0_30px_60px_-34px_rgba(21,93,252,.5)] [background:linear-gradient(#fff,#fff)_padding-box,linear-gradient(96deg,var(--color-v3-cyan),var(--color-v3-blue))_border-box] dark:[background:linear-gradient(#0e1526,#0e1526)_padding-box,linear-gradient(96deg,var(--color-v3-cyan),var(--color-v3-blue))_border-box]">
            <p className="border-b border-v3-line bg-[linear-gradient(96deg,rgba(0,197,232,.08),rgba(21,93,252,.08))] px-5 py-3 text-[13px] font-semibold uppercase tracking-[.06em] text-cyan-700 dark:border-v3-line-d dark:text-cyan-300">
              LinkedGrow
            </p>
            {pricing.ours.map((row) => (
              <PriceRow
                key={row.plan}
                row={{ plan: row.plan, monthly: row.monthly, annual: "", detail: row.detail }}
              />
            ))}
          </div>

          <p className="mt-6 rounded-[18px] border border-v3-line bg-v3-bg2 p-5 text-[15px] leading-[1.65] text-slate-700 dark:border-v3-line-d dark:bg-v3-bg2-d dark:text-slate-200">
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
                className="rounded-[18px] border border-v3-line bg-white p-5 shadow-[0_20px_44px_-36px_rgba(6,9,17,.3)] dark:border-v3-line-d dark:bg-slate-900/60"
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

      {showLeadsDemo && (
        <>
          <V3AgentJobsSection />
          <V3McpSection />
          <V3Plans />
        </>
      )}

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
        primaryCta={{ text: "Launch my agent for $0", href: "/sign-up" }}
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
