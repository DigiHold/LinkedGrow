"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Check, Minus } from "lucide-react";

import { V3_ROOT } from "@/components/v3/root";
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
}

const TRUST = ["7-day Pro trial", "No credit card required", "Everything included"];

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
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={TRUST}
        valuePropBadges={hero.valueProps}
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

          <div className="mt-7 space-y-3">
            {pricing.rows.map((row) => (
              <div
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-slate-200 pb-3 dark:border-slate-800"
                key={row.plan}
              >
                <span className="min-w-[10ch] text-[15px] font-semibold text-slate-900 dark:text-white">
                  {row.plan}
                </span>
                <span className="text-[15px] text-slate-700 dark:text-slate-200">
                  {row.monthly} monthly
                </span>
                <span className="text-[15px] text-slate-500 dark:text-slate-400">
                  {row.annual} annual
                </span>
                <span className="basis-full text-[13.5px] text-slate-500 dark:text-slate-400">
                  {row.detail}
                </span>
              </div>
            ))}
          </div>

          <h3 className="m-0 mt-9 text-[15px] font-semibold text-slate-900 dark:text-white">
            LinkedGrow
          </h3>
          <div className="mt-3 space-y-3">
            {pricing.ours.map((row) => (
              <div
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-slate-200 pb-3 dark:border-slate-800"
                key={row.plan}
              >
                <span className="min-w-[10ch] text-[15px] font-semibold text-slate-900 dark:text-white">
                  {row.plan}
                </span>
                <span className="text-[15px] text-slate-700 dark:text-slate-200">
                  {row.monthly}
                </span>
                <span className="basis-full text-[13.5px] text-slate-500 dark:text-slate-400">
                  {row.detail}
                </span>
              </div>
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
