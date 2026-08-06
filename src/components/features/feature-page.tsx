"use client";

import type { LucideIcon } from "lucide-react";

import { V3_ROOT } from "@/components/v3/root";
import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { QuickAnswer } from "@/components/seo/quick-answer";
import { LandingPainPoints } from "@/components/landing/landing-pain-points";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingFAQ } from "@/components/landing/landing-faq";
import { LandingCTA } from "@/components/landing/landing-cta";
import { LandingRelatedContent } from "@/components/landing/landing-related-content";
import { MarketingExitIntentPopup } from "@/components/marketing/exit-intent-popup";

/**
 * The composition every v2 feature page shares.
 *
 * The blocks were already shared; the order and the wiring were not, so each
 * page repeated 200 lines of assembly around its own copy. Here the assembly
 * lives once and a page is its words. Copy stays bespoke per page, which is
 * the part that has to be, and the shape stops drifting.
 */

export interface FeaturePageProps {
  hero: {
    badge: { icon: LucideIcon; text: string };
    line1: string;
    gradient: string;
    descriptionBold: string;
    description: string;
    valueProps: { icon: LucideIcon; text: string }[];
  };
  quickAnswer: { question: string; answer: string };
  pain: {
    badge: { icon: LucideIcon; text: string };
    headline: string;
    gradient: string;
    descriptionBold: string;
    description: string;
    problems: {
      icon: LucideIcon;
      stat: string;
      title: string;
      description: string;
      color: string;
    }[];
    bottomQuote: string;
  };
  how: {
    headline: string;
    gradient: string;
    description: string;
    steps: {
      number: string;
      icon: LucideIcon;
      title: string;
      description: string;
      color: string;
    }[];
  };
  features: {
    badge: { icon: LucideIcon; text: string };
    headline: string;
    gradient: string;
    description: string;
    items: {
      icon: LucideIcon;
      title: string;
      description: string;
      highlights: string[];
      badge?: string;
      color: string;
    }[];
  };
  faqs: { question: string; answer: string }[];
  faqHeadline: { text: string; gradient: string };
  related: { title: string; href: string }[];
  cta: {
    badge: string;
    line1: string;
    gradient: string;
    description: string;
  };
}

const TRUST = ["7-day trial", "Cancel before day 7", "Everything included"];

export function FeaturePage({
  hero,
  quickAnswer,
  pain,
  how,
  features,
  faqs,
  faqHeadline,
  related,
  cta,
}: FeaturePageProps) {
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

      <QuickAnswer answer={quickAnswer.answer} question={quickAnswer.question} />

      <LandingPainPoints
        badge={pain.badge}
        badgeColor="red"
        bottomQuote={pain.bottomQuote}
        description={pain.description}
        descriptionBold={pain.descriptionBold}
        headline={{ text: pain.headline, gradient: pain.gradient }}
        problems={pain.problems}
      />

      <LandingHowItWorks
        badge="How it works"
        description={how.description}
        headline={{ text: how.headline, gradient: how.gradient }}
        steps={how.steps}
      />

      <LandingFeatures
        badge={features.badge}
        description={features.description}
        features={features.items}
        headline={{ text: features.headline, gradient: features.gradient }}
      />

      <LandingFAQ
        description="Short answers to what people ask most often."
        faqs={faqs}
        headline={faqHeadline}
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
