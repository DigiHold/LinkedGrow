import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { AiSalesToolsContent } from "./ai-sales-tools-content";

const aiSalesToolsFaqs = [
  {
    question: "What are AI sales tools?",
    answer:
      "AI sales tools are software that uses AI to help a team sell: contact databases that supply data, sequencers that send outreach at scale, conversation intelligence that reads calls, CRMs that organize the pipeline, and signal-based agents that act on live buyer activity. LinkedGrow is the last kind for LinkedIn, an agent that finds buyers by their real engagement and messages them from your own account.",
  },
  {
    question: "What is the best AI sales tool?",
    answer:
      "There is no single best AI sales tool, because the right one depends on the job. If you need call coaching, a conversation intelligence tool wins. If you need pipeline hygiene, a smart CRM does. If you sell higher-value deals and want to reach warm buyers before a cold email would, LinkedGrow is built for that on LinkedIn, where buyers research vendors in public before they ever fill out a form.",
  },
  {
    question: "How much do AI sales tools cost?",
    answer:
      "AI sales tools span a wide range. Free tiers exist with a few credits, outreach sequencers usually start in the tens of dollars a month per seat, and enterprise data or forecasting platforms quote on request and run into thousands of dollars a year. LinkedGrow is $99 a month for the Pro plan with two agents and the agents' AI included, $179 a month for a team on Business, and $49 a month for each extra agent.",
  },
  {
    question: "Are there free AI sales tools?",
    answer:
      "Yes, several AI sales tools have free tiers, usually a small monthly credit allowance on a data or CRM product. They are useful for testing, but the credits run out fast and the data is the same cold data everyone else pulls. LinkedGrow does not have a free plan. It gives you a 7-day trial so you can watch a real agent work your account before the card is charged, and you can cancel any time before day 7.",
  },
  {
    question: "What is an AI SDR, and is it an AI sales tool?",
    answer:
      "An AI SDR is an AI sales tool that does the sales development job: it finds prospects, starts conversations, and books the ones worth a human's time. LinkedGrow runs an AI SDR on your own LinkedIn account. It reads your website to learn your buyer, mines LinkedIn engagement for warm prospects, and writes each message from what that person actually posted.",
  },
];

export const metadata: Metadata = {
  title: "AI Sales Tools: 2026 Buyer's Guide | LinkedGrow",
  description:
    "AI sales tools, compared by the job they do and their price. See where an AI LinkedIn agent beats a cold data-and-email stack, and start a 7-day LinkedGrow trial.",
  openGraph: {
    title: "AI Sales Tools: 2026 Buyer's Guide",
    description:
      "AI sales tools, compared by the job they do and their price. See where an AI LinkedIn agent beats a cold data-and-email stack, and start a 7-day LinkedGrow trial.",
    url: "https://linkedgrow.ai/ai-sales-tools",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow AI sales tool for LinkedIn",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Sales Tools: 2026 Buyer's Guide",
    description:
      "AI sales tools, compared by the job they do and their price. See where an AI LinkedIn agent beats a cold data-and-email stack, and start a 7-day LinkedGrow trial.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/ai-sales-tools",
  },
};

export default function AiSalesToolsPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          {
            name: "AI Sales Tools",
            url: "https://linkedgrow.ai/ai-sales-tools",
          },
        ]}
      />
      <FAQJsonLd questions={aiSalesToolsFaqs} />
      <SoftwareApplicationJsonLd
        name="LinkedGrow - AI Sales Tool"
        url="https://linkedgrow.ai/ai-sales-tools"
        description="A signal-based AI sales tool: an AI agent that finds buyers by their real LinkedIn engagement, messages them from your own account, and manages replies in one inbox."
        offers={{ price: "99", priceCurrency: "USD" }}
      />
      <AiSalesToolsContent faqs={aiSalesToolsFaqs} />
    </>
  );
}
