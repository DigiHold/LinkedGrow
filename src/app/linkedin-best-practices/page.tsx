import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { BestPracticesContent } from "./best-practices-content";

export const metadata: Metadata = {
  title: "LinkedIn Best Practices for Business Profiles and Posting | LinkedGrow",
  description:
    "LinkedIn best practices for business profiles and posting in 2026. Profile optimization, content strategy, posting frequency, engagement tactics, and the tools to execute it all.",
  openGraph: {
    title: "LinkedIn Best Practices for Business Profiles and Posting | LinkedGrow",
    description:
      "LinkedIn best practices for business profiles and posting in 2026. Profile optimization, content strategy, engagement tactics.",
    url: "https://linkedgrow.ai/linkedin-best-practices",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og-default.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow - LinkedIn Best Practices 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkedIn Best Practices for Business Profiles and Posting | LinkedGrow",
    description:
      "LinkedIn best practices for 2026. Profile optimization, content strategy, posting frequency, engagement tactics.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og-default.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/linkedin-best-practices",
  },
};

const bestPracticesFAQs = [
  {
    question: "What are the most important LinkedIn best practices in 2026?",
    answer:
      "The most important LinkedIn best practices in 2026 center around three things: optimizing your profile for both human readers and AI search, posting consistently with original expert content, and engaging meaningfully with your network. LinkedIn's algorithm now uses expert knowledge scoring to prioritize content from people who demonstrate genuine expertise in specific topics. LinkedGrow helps you execute all of these consistently.",
  },
  {
    question: "How often should I post on LinkedIn for business growth?",
    answer:
      "Posting 3 to 5 times per week is the sweet spot for most professionals and businesses on LinkedIn. Research on over 2 million posts shows that increasing from once a week to 3 to 5 times per week significantly boosts both impressions and engagement rate. Quality matters more than quantity though. LinkedGrow's AI post generator and scheduler make it easy to maintain this frequency without spending hours writing every day.",
  },
  {
    question: "What is the best time to post on LinkedIn in 2026?",
    answer:
      "The best times to post on LinkedIn are Tuesday through Thursday between 8 and 10 AM in your audience's timezone. Mid-morning on weekdays consistently gets the highest engagement. The first 60 minutes after posting are critical because LinkedIn tests your content with a small portion of your network before deciding to distribute it further. LinkedGrow's optimal time suggestions help you schedule posts for peak engagement windows.",
  },
  {
    question: "How do I optimize my LinkedIn profile for 2026?",
    answer:
      "Start with your headline. Do not just list your job title. Explain what you do and who you help using keywords your target audience searches for. Complete your About section with a first-person narrative that includes industry keywords naturally. Add a professional profile photo and a branded banner image. Profiles that are 100 percent complete get significantly more content reach than incomplete ones.",
  },
  {
    question: "Does LinkedIn penalize AI-generated content?",
    answer:
      "LinkedIn's algorithm deprioritizes content that reads like generic AI output. The platform can detect posts with perfect grammar but zero personality, template-like structure, and lack of specific personal details. The solution is to use AI as a writing assistant rather than a replacement. LinkedGrow's voice training feature analyzes your writing style so AI-generated posts sound like you, not a chatbot.",
  },
  {
    question: "What content format gets the most engagement on LinkedIn?",
    answer:
      "Document posts like PDF carousels consistently get the highest engagement rate on LinkedIn in 2026. They generate 2 to 3 times more dwell time than other formats because people swipe through multiple slides. Native video has also seen strong growth. Text-only posts still perform well when they open with a strong hook that makes people click to expand the full post.",
  },
  {
    question: "Should I use a company page or personal profile for LinkedIn marketing?",
    answer:
      "Personal profiles get dramatically more organic reach than company pages on LinkedIn. Company page reach has dropped significantly over the past two years while personal profiles continue to get strong distribution. The best approach is to use both. Post thought leadership content from personal profiles and use the company page for brand updates, hiring, and product announcements. LinkedGrow lets you schedule to both from the same dashboard.",
  },
  {
    question: "How many hashtags should I use on LinkedIn posts?",
    answer:
      "Use 3 to 5 relevant hashtags per LinkedIn post. Mix broad industry hashtags with niche-specific ones to balance reach and targeting. In 2026, LinkedIn treats hashtags more as SEO signals than discovery tools, so choose hashtags that accurately describe your content rather than chasing trending tags. Over-stuffing posts with hashtags does not help and can look spammy.",
  },
];

export default function LinkedinBestPracticesPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          {
            name: "LinkedIn Best Practices",
            url: "https://linkedgrow.ai/linkedin-best-practices",
          },
        ]}
      />
      <FAQJsonLd questions={bestPracticesFAQs} />
      <SoftwareApplicationJsonLd
        name="LinkedGrow - LinkedIn Best Practices Tools"
        url="https://linkedgrow.ai/linkedin-best-practices"
        description="Apply LinkedIn best practices for business profiles and posting with AI-powered content generation, scheduling, and voice training. From $19/month."
        offers={{ price: "19", priceCurrency: "USD" }}
      />
      <BestPracticesContent />
    </>
  );
}
