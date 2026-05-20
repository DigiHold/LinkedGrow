// JSON-LD Structured Data Components for SEO
// Helps search engines and AI systems understand your content better

import Script from "next/script";
import { PLANS } from "@/lib/plans";

const APP_NAME = "LinkedGrow";
const APP_URL = "https://linkedgrow.ai";
const COMPANY_NAME = "Vayalis SARL";

// Stable @id anchors for cross-referencing between schemas
const ORG_ID = `${APP_URL}/#organization`;
const WEBSITE_ID = `${APP_URL}/#website`;
const SOFTWARE_ID = `${APP_URL}/#software`;

export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: APP_NAME,
    legalName: COMPANY_NAME,
    url: APP_URL,
    logo: {
      "@type": "ImageObject",
      "@id": `${APP_URL}/#logo`,
      url: `${APP_URL}/logo.png`,
      width: 512,
      height: 512,
    },
    description: "AI-powered LinkedIn content creation and scheduling platform",
    foundingDate: "2024",
    founder: [
      {
        "@type": "Person",
        name: "Nicolas Lecocq",
        jobTitle: "Founder & Developer",
      },
      {
        "@type": "Person",
        name: "Maria Lecocq",
        jobTitle: "Operations & Community",
      },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "78 Avenue Des Champs-Elysees",
      addressLocality: "Paris",
      postalCode: "75008",
      addressCountry: "FR",
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: "contact@linkedgrow.ai",
      contactType: "customer support",
    },
    sameAs: [
      "https://twitter.com/linkedgrow",
      "https://linkedin.com/company/linkedgrow",
      "https://www.youtube.com/@LinkedGrow",
    ],
  };

  return (
    <Script
      id="organization-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function WebsiteJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: APP_NAME,
    url: APP_URL,
    description:
      "Create viral LinkedIn posts, schedule content, and grow your audience with AI-powered tools",
    publisher: { "@id": ORG_ID },
  };

  return (
    <Script
      id="website-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface SoftwareApplicationJsonLdProps {
  name?: string;
  url?: string;
  description?: string;
  applicationCategory?: string;
  offers?: {
    price: string;
    priceCurrency: string;
  };
}

export function SoftwareApplicationJsonLd({
  name,
  url,
  description,
  applicationCategory = "BusinessApplication",
  offers,
}: SoftwareApplicationJsonLdProps = {}) {
  // When called with custom props (feature pages), use single Offer
  // When called with defaults (global layout), use AggregateOffer with all plans
  const isGlobal = !name;

  // Build offers dynamically from plans.ts so schema stays in sync with pricing
  const planList = Object.values(PLANS);
  const prices = planList.map((p) => p.price);

  const offersData = offers
    ? {
        "@type": "Offer" as const,
        price: offers.price,
        priceCurrency: offers.priceCurrency,
      }
    : {
        "@type": "AggregateOffer" as const,
        lowPrice: String(Math.min(...prices)),
        highPrice: String(Math.max(...prices)),
        priceCurrency: "USD",
        offerCount: planList.length,
        offers: planList.map((plan) => ({
          "@type": "Offer",
          name: plan.name,
          price: String(plan.price),
          priceCurrency: "USD",
          ...(plan.price > 0 && {
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: String(plan.price),
              priceCurrency: "USD",
              billingDuration: "P1M",
            },
          }),
        })),
      };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    ...(isGlobal && { "@id": SOFTWARE_ID }),
    name: name || APP_NAME,
    url: url || APP_URL,
    description:
      description ||
      "AI-powered LinkedIn content creation platform. Generate engaging posts, analyze viral content, and schedule your LinkedIn presence.",
    applicationCategory,
    operatingSystem: "All",
    browserRequirements: "Requires a modern web browser with JavaScript enabled",
    offers: offersData,
    featureList: [
      "AI Post Generation (BYOK)",
      "LinkedIn Post Scheduling",
      "Content Calendar",
      "AI Image Generation",
      "Carousel Generator",
      "Hooks Generator",
      "Reddit to LinkedIn",
      "Voice Training",
      "A/B Testing",
      "Team Collaboration",
      "Analytics Dashboard",
    ],
    provider: { "@id": ORG_ID },
  };

  return (
    <Script
      id={isGlobal ? "software-jsonld" : `software-jsonld-${(name || "").slice(0, 30).replace(/\s/g, "-").toLowerCase()}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface FAQJsonLdProps {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}

export function FAQJsonLd({ questions }: FAQJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };

  return (
    <Script
      id="faq-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface BreadcrumbJsonLdProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Script
      id="breadcrumb-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface BlogPostingJsonLdProps {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  authorUrl: string;
  wordCount?: number;
  articleSection?: string;
  keywords?: string[];
  url: string;
}

export function BlogPostingJsonLd({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  authorName,
  authorUrl,
  wordCount,
  articleSection,
  keywords,
  url,
}: BlogPostingJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline,
    description,
    image,
    datePublished,
    dateModified: dateModified || datePublished,
    url,
    author: {
      "@type": "Person",
      name: authorName,
      url: authorUrl,
      sameAs: [authorUrl],
    },
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": WEBSITE_ID },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    ...(wordCount && { wordCount }),
    ...(articleSection && { articleSection }),
    ...(keywords && keywords.length > 0 && { keywords: keywords.join(", ") }),
  };

  return (
    <Script
      id={`blogposting-jsonld-${headline.slice(0, 20).replace(/\s/g, "-").toLowerCase()}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface PersonJsonLdProps {
  name: string;
  jobTitle: string;
  url: string;
  sameAs?: string[];
}

export function PersonJsonLd({ name, jobTitle, url, sameAs = [] }: PersonJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    jobTitle,
    url,
    worksFor: { "@id": ORG_ID },
    ...(sameAs.length > 0 && { sameAs }),
  };

  return (
    <Script
      id={`person-jsonld-${name.replace(/\s/g, "-").toLowerCase()}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface WebApplicationJsonLdProps {
  name: string;
  url: string;
  description: string;
  applicationCategory?: string;
  operatingSystem?: string;
  browserRequirements?: string;
}

export function WebApplicationJsonLd({
  name,
  url,
  description,
  applicationCategory = "UtilityApplication",
  operatingSystem = "All",
  browserRequirements = "Requires JavaScript. Requires HTML5.",
}: WebApplicationJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    url,
    description,
    applicationCategory,
    operatingSystem,
    browserRequirements,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    provider: { "@id": ORG_ID },
  };

  return (
    <Script
      id={`webapplication-jsonld-${name.slice(0, 20).replace(/\s/g, "-").toLowerCase()}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// AboutPage schema for the about page
export function AboutPageJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `About ${APP_NAME}`,
    url: `${APP_URL}/about`,
    description:
      "Learn about LinkedGrow, the AI-powered LinkedIn content creation platform. Founded by Nicolas Lecocq, creator of OceanWP. Based in Paris, France.",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
  };

  return (
    <Script
      id="aboutpage-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// CollectionPage schema for the blog listing page
export function CollectionPageJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Blog - LinkedIn Growth Tips & AI Content Strategies",
    url: `${APP_URL}/blog`,
    description:
      "Actionable LinkedIn growth strategies, AI content creation tips, and social selling guides. Learn how to build your personal brand and grow your audience.",
    isPartOf: { "@id": WEBSITE_ID },
    provider: { "@id": ORG_ID },
  };

  return (
    <Script
      id="collectionpage-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// LinkedGrow FAQs for JSON-LD (must match the FAQ component content)
export const linkedGrowFAQs = [
  {
    question: "What is an AI LinkedIn post generator?",
    answer: "An AI LinkedIn post generator is a tool that writes LinkedIn content for you based on a topic, idea, or source material. The best ones - like LinkedGrow - also act as a LinkedIn post writer that learns your personal voice, so the output reads like you wrote it, not a bot. LinkedGrow goes further as a full LinkedIn content generator: carousels, scheduling, and voice training all in one place.",
  },
  {
    question: "How is LinkedGrow different from other LinkedIn post generators?",
    answer: "Most tools using AI for LinkedIn posts charge $50/month or more. LinkedGrow uses a Bring Your Own API Key model: you pay under $4/month for unlimited content. That's not a typo. On top of the price, LinkedGrow is the only LinkedIn AI generator that trains on your existing posts, so every draft matches your real voice - not a generic style. It's cheaper, smarter, and built for volume creators.",
  },
  {
    question: "Can I create LinkedIn posts for free?",
    answer: "Yes - you can create LinkedIn posts with LinkedGrow on a free trial, no credit card required. It's the fastest way to test the voice training and see a draft that actually sounds like you before spending a cent.",
  },
  {
    question: "What is BYOK (Bring Your Own Key)?",
    answer: "BYOK means you connect your own AI API key (OpenAI, Claude, Gemini, etc.) to LinkedGrow. This gives you complete control over costs, model selection, and usage limits. You pay the AI provider directly at their rates with no markup from us.",
  },
  {
    question: "How much does the AI cost separately?",
    answer: "It depends on your usage and chosen model. For example, GPT-4o costs about $0.01-0.03 per post generation. Most users spend $5-15/month on AI costs for hundreds of posts. Claude and Gemini have similar pricing. You can track your usage in your AI provider's dashboard.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Absolutely! There are no contracts or commitments. You can cancel your subscription at any time from your account settings. You'll retain access until the end of your billing period.",
  },
  {
    question: "Do I need a LinkedIn Premium account?",
    answer: "No, LinkedGrow works with any LinkedIn account - free or premium. However, connecting your LinkedIn account (free) is required for direct publishing and scheduling features.",
  },
  {
    question: "Will my posts sound like AI wrote them?",
    answer: "Not if you set up your profile correctly! LinkedGrow uses your business profile, tone preferences, and writing style to generate content that sounds authentically you. Plus, you can edit every post with AI assistance before publishing.",
  },
  {
    question: "What's the Algorithm Score?",
    answer: "Our proprietary Algorithm Score (0-100) analyzes your post against LinkedIn's ranking factors: hook strength, readability, formatting, engagement triggers, and more. It helps you optimize every post before hitting publish.",
  },
  {
    question: "How is this different from Taplio or Supergrow?",
    answer: "Three main differences: 1) BYOK model means no hidden AI costs or limitations, 2) You choose which AI model to use (GPT-4, Claude, Gemini), 3) Our Algorithm Score gives real-time optimization feedback. Plus, we're built by creators who actually use LinkedIn.",
  },
  {
    question: "Do you offer refunds?",
    answer: "Yes! We offer a 14-day money-back guarantee. If LinkedGrow isn't right for you, contact us within 14 days of purchase for a full refund, no questions asked.",
  },
];
