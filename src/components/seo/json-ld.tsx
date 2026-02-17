// JSON-LD Structured Data Components for SEO
// Helps search engines understand your content better

import Script from "next/script";

const APP_NAME = "LinkedGrow";
const APP_URL = "https://linkedgrow.ai";
const COMPANY_NAME = "Vayalis SARL";

interface OrganizationJsonLdProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
}

export function OrganizationJsonLd({
  name = APP_NAME,
  url = APP_URL,
  logo = `${APP_URL}/logo.png`,
  description = "AI-powered LinkedIn content creation and scheduling platform",
}: OrganizationJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo,
    description,
    foundingDate: "2024",
    founder: {
      "@type": "Organization",
      name: COMPANY_NAME,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "78 Avenue Des Champs-Élysées",
      addressLocality: "Paris",
      postalCode: "75008",
      addressCountry: "FR",
    },
    sameAs: [
      "https://twitter.com/linkedgrow",
      "https://linkedin.com/company/linkedgrow",
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

interface WebsiteJsonLdProps {
  name?: string;
  url?: string;
  description?: string;
}

export function WebsiteJsonLd({
  name = APP_NAME,
  url = APP_URL,
  description = "Create viral LinkedIn posts, schedule content, and grow your audience with AI-powered tools",
}: WebsiteJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
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
  operatingSystem?: string;
  offers?: {
    price: string;
    priceCurrency: string;
  };
  aggregateRating?: {
    ratingValue: number;
    ratingCount: number;
  };
}

export function SoftwareApplicationJsonLd({
  name = APP_NAME,
  url = APP_URL,
  description = "AI-powered LinkedIn content creation platform. Generate engaging posts, analyze viral content, and schedule your LinkedIn presence.",
  applicationCategory = "BusinessApplication",
  operatingSystem = "Web",
  offers = { price: "0", priceCurrency: "USD" },
  aggregateRating = { ratingValue: 4.8, ratingCount: 127 },
}: SoftwareApplicationJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    url,
    description,
    applicationCategory,
    operatingSystem,
    offers: {
      "@type": "Offer",
      price: offers.price,
      priceCurrency: offers.priceCurrency,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: aggregateRating.ratingValue,
      ratingCount: aggregateRating.ratingCount,
      bestRating: "5",
      worstRating: "1",
    },
    featureList: [
      "AI Content Generation",
      "Viral Post Analysis",
      "Smart Scheduling",
      "Carousel Generator",
      "LinkedIn Analytics",
      "Bring Your Own API Key",
    ],
  };

  return (
    <Script
      id="software-jsonld"
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
    },
    publisher: {
      "@type": "Organization",
      name: APP_NAME,
      url: APP_URL,
      logo: {
        "@type": "ImageObject",
        url: `${APP_URL}/logo.png`,
      },
    },
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
    provider: {
      "@type": "Organization",
      name: APP_NAME,
      url: APP_URL,
    },
  };

  return (
    <Script
      id={`webapplication-jsonld-${name.slice(0, 20).replace(/\s/g, "-").toLowerCase()}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// LinkedGrow FAQs for JSON-LD (must match the FAQ component content)
export const linkedGrowFAQs = [
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
