import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { CompanyPageOptimizationContent } from "./company-page-optimization-content";

export const metadata: Metadata = {
  title: "How to Optimize a LinkedIn Company Page for Followers",
  description:
    "SEO strategies, content tactics, posting frequency, employee advocacy, and analytics to grow your LinkedIn company page followers: step by step.",
  openGraph: {
    title: "How to Optimize a LinkedIn Company Page for Followers",
    description:
      "SEO strategies, content tactics, posting frequency, employee advocacy, and analytics to grow your LinkedIn company page followers: step by step.",
    url: "https://linkedgrow.ai/linkedin-company-page-optimization",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow - How to Optimize Your LinkedIn Company Page for More Followers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Optimize a LinkedIn Company Page for Followers",
    description:
      "SEO strategies, content tactics, posting frequency, employee advocacy, and analytics to grow your LinkedIn company page followers: step by step.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/linkedin-company-page-optimization",
  },
};

const companyPageOptimizationFAQs = [
  {
    question: "How do I get more followers on my LinkedIn company page?",
    answer:
      "Growing your LinkedIn company page followers requires a combination of profile optimization, consistent posting, employee advocacy, and engagement. Complete every section of your page with relevant keywords, post 2 to 5 times per week using high-engagement formats like carousels and documents, encourage employees to share company content from their personal profiles, and respond to every comment. LinkedGrow automates the content creation and scheduling so you can focus on engagement.",
  },
  {
    question: "How often should I post on my LinkedIn company page for growth?",
    answer:
      "Research on over 2 million LinkedIn posts shows that posting 2 to 5 times per week significantly boosts both impressions and engagement rate compared to posting once a week or less. Going beyond 5 posts per week adds minimal benefit unless you have a large content team. The key is consistency. LinkedGrow's content calendar and batch scheduling make it easy to maintain this frequency every week.",
  },
  {
    question: "What content format works best on LinkedIn company pages?",
    answer:
      "Document posts and PDF carousels consistently generate the highest engagement rate on LinkedIn company pages in 2026, outperforming text, images, and video by a wide margin. Multi-image posts come in second. The algorithm rewards content that keeps users on the platform longer, and carousels achieve this through swipeable slides that increase dwell time. LinkedGrow's carousel generator makes creating these effortless.",
  },
  {
    question: "Does LinkedIn company page SEO affect Google rankings?",
    answer:
      "Yes. LinkedIn company pages are crawled and indexed by Google, and they often rank on the first page for brand name searches. Keywords in your tagline, About section, and specialties directly impact how your page appears in both LinkedIn search and Google results. Keeping your page active with regular content also signals to search engines that the page is relevant and up to date.",
  },
  {
    question: "What is the difference between company page reach and personal profile reach on LinkedIn?",
    answer:
      "Personal profiles get dramatically more organic reach than company pages on LinkedIn. Personal posts generate 5 to 8 times more impressions than identical content posted from a company page. Company page content appears in just 1 to 2 percent of a typical user's feed. The best strategy is to use both together. Post brand content from the company page and amplify it through employee personal profiles for maximum combined reach.",
  },
];

export default function LinkedinCompanyPageOptimizationPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          {
            name: "LinkedIn Company Page Optimization",
            url: "https://linkedgrow.ai/linkedin-company-page-optimization",
          },
        ]}
      />
      <FAQJsonLd questions={companyPageOptimizationFAQs} />
      <SoftwareApplicationJsonLd
        name="LinkedGrow - LinkedIn Company Page Optimization"
        url="https://linkedgrow.ai/linkedin-company-page-optimization"
        description="Optimize your LinkedIn company page for more followers with AI content generation, scheduling, employee advocacy tools, and analytics. From $13/month."
        offers={{ price: "19", priceCurrency: "USD" }}
      />
      <CompanyPageOptimizationContent />
    </>
  );
}
