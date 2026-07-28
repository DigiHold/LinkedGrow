"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

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
import { QuickAnswer } from "@/components/seo/quick-answer";
import { MarketingExitIntentPopup } from "@/components/marketing/exit-intent-popup";

/**
 * The frame every free tool sits in.
 *
 * The 16 tools written before this each carried their own copy of the hero,
 * the FAQ and the closing panel, which is how four of them drifted onto a
 * smaller H1 and a container with no width. One shell means a change to the
 * gabarit reaches every tool at once, and a new tool is its own logic plus its
 * own words, nothing else.
 */

export interface ToolProp {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}

export function ToolPage({
  badge = "100% Free - No Account Required",
  title,
  highlight,
  lead,
  props,
  quickAnswer,
  children,
  faqs,
  faqHeadline,
  faqDescription,
  cta,
}: {
  badge?: string;
  title: string;
  /** The second line, in sky. Kept separate so the H1 never carries a <br>. */
  highlight: string;
  lead: string;
  props: ToolProp[];
  quickAnswer: { question: string; answer: string };
  children: ReactNode;
  faqs: { question: string; answer: string }[];
  faqHeadline?: { text: string; gradient: string };
  faqDescription?: string;
  cta: {
    badge: string;
    line1: string;
    gradient: string;
    description: string;
    buttonText: string;
    trust: string[];
  };
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
            {badge}
          </motion.div>

          <motion.h1
            animate={{ opacity: 1, y: 0 }}
            className="m-0 mb-4 flex flex-col items-center font-v3-display! text-[clamp(43px,6.8vw,88px)] font-semibold! leading-[.98]! tracking-[-.048em]! text-white"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.05 }}
          >
            <span className="leading-[1.18]">{title}</span>{" "}
            <span className="leading-[1.18] text-v3-sky">{highlight}</span>
          </motion.h1>

          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-8 max-w-[62ch] text-[clamp(16.5px,1.35vw,19px)] leading-[1.58]! text-[rgba(255,255,255,.76)]"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
          >
            {lead}
          </motion.p>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.15 }}
          >
            {props.map((item) => (
              <div className={VPROP} key={item.text}>
                <item.icon className="h-[15px] w-[15px]" />
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <div className={`${CARVE_BASE} bg-v3-bg dark:bg-v3-bg-d`}></div>
      </section>

      {children}

      <div className="mx-auto max-w-3xl px-4 pb-10 sm:px-6">
        <QuickAnswer answer={quickAnswer.answer} question={quickAnswer.question} />
      </div>

      <LandingFAQ
        description={faqDescription ?? "Everything the tool does not say on its own."}
        faqs={faqs}
        headline={faqHeadline ?? { text: "Questions people ask about", gradient: "this tool" }}
      />

      <LandingCTA
        badge={cta.badge}
        description={cta.description}
        headline={{ line1: cta.line1, gradient: cta.gradient }}
        primaryCta={{ text: cta.buttonText, href: "/sign-up" }}
        trustIndicators={cta.trust}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}

/** A titled block of explanation between the tool and the FAQ. */
export function ToolSection({
  title,
  lead,
  children,
  tinted = false,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
  tinted?: boolean;
}) {
  return (
    <section
      className={`relative py-[clamp(48px,6vw,84px)] ${tinted ? "bg-white dark:bg-slate-900/40" : ""}`}
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h2 className="m-0 font-v3-display! text-[clamp(26px,3.2vw,38px)] font-semibold! leading-[1.1]! tracking-[-.04em]! text-slate-900 dark:text-white">
          {title}
        </h2>
        {lead && (
          <p className="mt-4 max-w-[62ch] text-[16.5px] leading-[1.65] text-slate-600 dark:text-slate-300">
            {lead}
          </p>
        )}
        <div className="mt-7">{children}</div>
      </div>
    </section>
  );
}
