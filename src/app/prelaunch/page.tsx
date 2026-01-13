import { getTranslations } from "next-intl/server";
import PrelaunchClient from "./prelaunch-client";

export default async function PrelaunchPage() {
  // Get all translation namespaces
  const tHero = await getTranslations("hero");
  const tPainPoints = await getTranslations("painPoints");
  const tFeatures = await getTranslations("features");
  const tHowItWorks = await getTranslations("howItWorks");
  const tPricing = await getTranslations("pricing");
  const tFaq = await getTranslations("faq");
  const tCta = await getTranslations("cta");
  const tSuccess = await getTranslations("success");
  const tFooter = await getTranslations("footer");

  // Build translations object to pass to client
  const translations = {
    hero: {
      badge: tHero("badge"),
      spotsLeft: tHero("spotsLeft", { count: 153 }),
      headline1: tHero("headline1"),
      headline2: tHero("headline2"),
      description: tHero("description"),
      descriptionSub: tHero("descriptionSub", { savings: tHero("savings") }),
      valueProp1: tHero("valueProp1"),
      valueProp2: tHero("valueProp2"),
      valueProp3: tHero("valueProp3"),
      emailPlaceholder: tHero("emailPlaceholder"),
      cta: tHero("cta"),
      noCreditCard: tHero("noCreditCard"),
      lockedIn: tHero("lockedIn"),
      cancelAnytime: tHero("cancelAnytime"),
      trustedBy: tHero("trustedBy", { count: 179 }),
    },
    painPoints: {
      title: tPainPoints("title"),
      description: tPainPoints("description"),
      pain1: {
        stat: tPainPoints("pain1.stat"),
        title: tPainPoints("pain1.title"),
        description: tPainPoints("pain1.description"),
      },
      pain2: {
        stat: tPainPoints("pain2.stat"),
        title: tPainPoints("pain2.title"),
        description: tPainPoints("pain2.description"),
      },
      pain3: {
        stat: tPainPoints("pain3.stat"),
        title: tPainPoints("pain3.title"),
        description: tPainPoints("pain3.description"),
      },
      betterWay: tPainPoints("betterWay"),
    },
    features: {
      title: tFeatures("title"),
      description: tFeatures("description"),
      byok: {
        title: tFeatures("byok.title"),
        description: tFeatures("byok.description"),
        highlight: tFeatures("byok.highlight"),
      },
      voice: {
        title: tFeatures("voice.title"),
        description: tFeatures("voice.description"),
        stat: tFeatures("voice.stat"),
        statLabel: tFeatures("voice.statLabel"),
      },
      viral: {
        title: tFeatures("viral.title"),
        description: tFeatures("viral.description"),
        stat: tFeatures("viral.stat"),
        statLabel: tFeatures("viral.statLabel"),
      },
      schedule: {
        title: tFeatures("schedule.title"),
        description: tFeatures("schedule.description"),
        stat: tFeatures("schedule.stat"),
        statLabel: tFeatures("schedule.statLabel"),
      },
      reddit: {
        title: tFeatures("reddit.title"),
        description: tFeatures("reddit.description"),
        stat: tFeatures("reddit.stat"),
        statLabel: tFeatures("reddit.statLabel"),
      },
      carousel: {
        title: tFeatures("carousel.title"),
        description: tFeatures("carousel.description"),
      },
    },
    howItWorks: {
      title: tHowItWorks("title"),
      description: tHowItWorks("description"),
      step1: {
        title: tHowItWorks("step1.title"),
        description: tHowItWorks("step1.description"),
      },
      step2: {
        title: tHowItWorks("step2.title"),
        description: tHowItWorks("step2.description"),
      },
      step3: {
        title: tHowItWorks("step3.title"),
        description: tHowItWorks("step3.description"),
      },
    },
    pricing: {
      title: tPricing("title"),
      description: tPricing("description"),
      discount: tPricing("discount"),
      founder: tPricing("founder"),
      perMonth: tPricing("perMonth"),
      free: {
        name: tPricing("free.name"),
        description: tPricing("free.description"),
        features: [
          tPricing("free.features.0"),
          tPricing("free.features.1"),
          tPricing("free.features.2"),
        ],
      },
      starter: {
        name: tPricing("starter.name"),
        description: tPricing("starter.description"),
        features: [
          tPricing("starter.features.0"),
          tPricing("starter.features.1"),
          tPricing("starter.features.2"),
          tPricing("starter.features.3"),
        ],
      },
      pro: {
        name: tPricing("pro.name"),
        description: tPricing("pro.description"),
        features: [
          tPricing("pro.features.0"),
          tPricing("pro.features.1"),
          tPricing("pro.features.2"),
          tPricing("pro.features.3"),
          tPricing("pro.features.4"),
        ],
      },
      business: {
        name: tPricing("business.name"),
        description: tPricing("business.description"),
        features: [
          tPricing("business.features.0"),
          tPricing("business.features.1"),
          tPricing("business.features.2"),
          tPricing("business.features.3"),
          tPricing("business.features.4"),
        ],
      },
      cta: tPricing("cta", { discount: "30" }),
    },
    faq: {
      title: tFaq("title"),
      q1: {
        question: tFaq("q1.question"),
        answer: tFaq("q1.answer"),
      },
      q2: {
        question: tFaq("q2.question"),
        answer: tFaq("q2.answer"),
      },
      q3: {
        question: tFaq("q3.question"),
        answer: tFaq("q3.answer"),
      },
      q4: {
        question: tFaq("q4.question"),
        answer: tFaq("q4.answer"),
      },
      q5: {
        question: tFaq("q5.question"),
        answer: tFaq("q5.answer"),
      },
      q6: {
        question: tFaq("q6.question"),
        answer: tFaq("q6.answer"),
      },
      q7: {
        question: tFaq("q7.question"),
        answer: tFaq("q7.answer"),
      },
      q8: {
        question: tFaq("q8.question"),
        answer: tFaq("q8.answer"),
      },
      q9: {
        question: tFaq("q9.question"),
        answer: tFaq("q9.answer"),
      },
      q10: {
        question: tFaq("q10.question"),
        answer: tFaq("q10.answer"),
      },
      q11: {
        question: tFaq("q11.question"),
        answer: tFaq("q11.answer"),
      },
      q12: {
        question: tFaq("q12.question"),
        answer: tFaq("q12.answer"),
      },
    },
    cta: {
      title: tCta("title"),
      description: tCta("description"),
      subDescription: tCta("subDescription"),
      button: tCta("button"),
      security: tCta("security"),
      yourData: tCta("yourData"),
      madeIn: tCta("madeIn"),
    },
    success: {
      title: tSuccess("title"),
      description: tSuccess("description"),
    },
    footer: {
      copyright: tFooter("copyright"),
      privacy: tFooter("privacy"),
      cookies: tFooter("cookies"),
    },
  };

  return <PrelaunchClient translations={translations} />;
}
