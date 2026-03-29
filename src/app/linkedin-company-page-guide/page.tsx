import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { CompanyPageGuideContent } from "./company-page-guide-content";

export const metadata: Metadata = {
  title: "How to Create a LinkedIn Company Page Step by Step | LinkedGrow",
  description:
    "How to create a LinkedIn company page step by step in 2026. Complete guide covering setup, verification, optimization, common mistakes, and the tools to manage your page.",
  openGraph: {
    title: "How to Create a LinkedIn Company Page Step by Step | LinkedGrow",
    description:
      "How to create a LinkedIn company page step by step. Complete setup guide, optimization tips, and management tools for 2026.",
    url: "https://linkedgrow.ai/linkedin-company-page-guide",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og-default.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow - How to Create a LinkedIn Company Page Step by Step",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Create a LinkedIn Company Page Step by Step | LinkedGrow",
    description:
      "How to create a LinkedIn company page step by step. Complete setup guide and management tools for 2026.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og-default.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/linkedin-company-page-guide",
  },
};

const companyPageGuideFAQs = [
  {
    question: "Can I create a LinkedIn company page for free?",
    answer:
      "Yes, creating a LinkedIn company page is completely free. You need a personal LinkedIn account with a verified email address and authorization to represent the company. LinkedIn also offers a Premium Company Page option at around $77 per month for advanced features like competitor analytics, dynamic cover images, and a verification badge, but the standard page creation costs nothing.",
  },
  {
    question: "What do I need before creating a LinkedIn company page?",
    answer:
      "You need an active personal LinkedIn profile with a verified email address. Your profile should be in good standing and you must be authorized to act on behalf of the organization. LinkedIn requires you to check a verification box confirming this during the setup process. The creation itself takes about 10 minutes, but allow 1 to 2 hours for full optimization afterward.",
  },
  {
    question: "Can I create a LinkedIn company page on my phone?",
    answer:
      "You can create a company page on iOS through the LinkedIn app, but Android does not support native company page creation. Android users need to visit linkedin.com/company/setup/new/ through their mobile browser in desktop mode. For the best experience, LinkedIn recommends using a desktop computer where you have access to all page types and setup options.",
  },
  {
    question: "How do I make my LinkedIn company page show up in Google search?",
    answer:
      "LinkedIn company pages are crawled by Google and often rank highly for brand searches. To improve visibility, include relevant keywords in your tagline and About section, add up to 20 specialties that match what people search for, claim a clean custom URL, and keep your page active with regular content. Completing all profile sections is essential because fully complete pages get significantly more visibility.",
  },
  {
    question: "What is the difference between a company page and a showcase page on LinkedIn?",
    answer:
      "A company page represents your main business and serves as the primary brand presence on LinkedIn. A showcase page is a sub-page that highlights a specific brand, product line, or initiative within your organization. Large companies use showcase pages to target different audiences with tailored content. Most businesses with a single product or service only need one company page. LinkedGrow helps you manage content for both.",
  },
];

export default function LinkedinCompanyPageGuidePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          {
            name: "LinkedIn Company Page Guide",
            url: "https://linkedgrow.ai/linkedin-company-page-guide",
          },
        ]}
      />
      <FAQJsonLd questions={companyPageGuideFAQs} />
      <SoftwareApplicationJsonLd
        name="LinkedGrow - LinkedIn Company Page Management"
        url="https://linkedgrow.ai/linkedin-company-page-guide"
        description="Create and manage your LinkedIn company page with AI-powered content generation, team collaboration, and scheduling tools. From $19/month."
        offers={{ price: "19", priceCurrency: "USD" }}
      />
      <CompanyPageGuideContent />
    </>
  );
}
