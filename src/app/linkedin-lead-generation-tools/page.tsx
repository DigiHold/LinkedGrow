import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { LeadGenerationToolsContent } from "./lead-generation-tools-content";

export const metadata: Metadata = {
  title: "LinkedIn Lead Generation Tools for Content-Driven Growth",
  description:
    "LinkedIn lead generation tools that turn content into inbound leads. LinkedGrow combines AI writing, scheduling, carousels, and analytics from $19/mo.",
  openGraph: {
    title: "LinkedIn Lead Generation Tools for Content-Driven Growth",
    description:
      "LinkedIn lead generation tools that turn content into inbound leads. LinkedGrow combines AI writing, scheduling, carousels, and analytics from $19/mo.",
    url: "https://linkedgrow.ai/linkedin-lead-generation-tools",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow - LinkedIn Lead Generation Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkedIn Lead Generation Tools for Content-Driven Growth",
    description:
      "LinkedIn lead generation tools that turn content into inbound leads. LinkedGrow combines AI writing, scheduling, carousels, and analytics from $19/mo.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/linkedin-lead-generation-tools",
  },
};

const leadGenFAQs = [
  {
    question: "What are the best LinkedIn lead generation tools in 2026?",
    answer:
      "The best LinkedIn lead generation tools depend on your approach. For content-driven lead generation, LinkedGrow combines AI post writing, carousel creation, scheduling, and analytics in one platform with BYOK pricing starting at $19 per month. For outreach automation, tools like Expandi and Dripify handle connection sequences. For prospecting data, LinkedIn Sales Navigator provides advanced search filters. Content tools generate inbound leads over time, while outreach tools target specific prospects directly.",
  },
  {
    question: "How do LinkedIn lead generation tools actually generate leads?",
    answer:
      "LinkedIn lead generation tools work through two main approaches. Content tools like LinkedGrow help you publish consistently so prospects come to you through your posts, carousels, and articles. Outreach tools automate connection requests and follow-up messages to specific prospects. Content-driven lead generation is safer because it works your own account at a human pace and stays inside the limits you set, while automation tools that send mass connection requests or messages can trigger LinkedIn's abuse detection.",
  },
  {
    question: "Is content marketing or outreach automation better for LinkedIn leads?",
    answer:
      "Content marketing generates higher-quality leads because prospects reach out to you after seeing your expertise. Outreach automation reaches more people faster but has lower conversion rates and carries the risk of LinkedIn account restrictions. Most successful LinkedIn strategies combine both: consistent content to build authority, and targeted outreach to the prospects who engage with that content. LinkedGrow handles the content side with AI writing trained on your voice.",
  },
  {
    question: "How much do LinkedIn lead generation tools cost?",
    answer:
      "LinkedIn lead generation tools range from $19 per month (LinkedGrow Starter) to $99 per month (Expandi, Dripify) for individual plans. LinkedIn Sales Navigator starts at $99 per month. Enterprise tools like ZoomInfo and 6sense use custom pricing that often exceeds $1,000 per month. LinkedGrow's BYOK model keeps total costs low because AI API usage averages $2 to $4 per month on top of the subscription, with no credit caps or generation limits.",
  },
  {
    question: "Can LinkedGrow replace my current LinkedIn lead generation stack?",
    answer:
      "LinkedGrow replaces the content creation side of your lead generation stack: AI post writing with voice training, image generation, carousel building, scheduling with a visual calendar, and performance analytics. It doesn't replace outreach automation tools or CRM systems. If your lead generation strategy relies on publishing content that positions you as an expert and attracts inbound interest, LinkedGrow covers that entire workflow in one platform.",
  },
];

export default function LinkedinLeadGenerationToolsPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          {
            name: "LinkedIn Lead Generation Tools",
            url: "https://linkedgrow.ai/linkedin-lead-generation-tools",
          },
        ]}
      />
      <FAQJsonLd questions={leadGenFAQs} />
      <SoftwareApplicationJsonLd
        name="LinkedGrow - LinkedIn Lead Generation Tools"
        url="https://linkedgrow.ai/linkedin-lead-generation-tools"
        description="LinkedIn lead generation tools for content-driven growth. AI content creation, carousel generator, post scheduling, and analytics with BYOK pricing."
        offers={{ price: "19", priceCurrency: "USD" }}
      />
      <LeadGenerationToolsContent />
    </>
  );
}
