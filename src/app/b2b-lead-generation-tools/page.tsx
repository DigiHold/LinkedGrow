import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { B2bLeadGenerationToolsContent } from "./b2b-lead-generation-tools-content";

const b2bFaqs = [
  {
    question: "What are B2B lead generation tools?",
    answer:
      "B2B lead generation tools are software that helps a business find and reach potential buyers. They fall into a few types: contact databases that sell you data (ZoomInfo, Apollo, Cognism), email sequencers that send outreach at scale (Instantly, Lemlist), website-visitor identification tools (Leadinfo, RB2B), CRMs that organize the pipeline (HubSpot, Pipedrive), and signal-based tools that act on live activity. LinkedGrow is the last kind for LinkedIn: an agent that finds buyers by their real engagement and messages them from your own account.",
  },
  {
    question: "What is the best B2B lead generation tool?",
    answer:
      "There is no single best B2B lead generation tool, because the right one depends on how you sell. If you sell into a huge, well-mapped market and can absorb low reply rates, a data platform plus an email sequencer covers volume. If you sell higher-value deals where each conversation counts, a signal-based tool wins because it reaches warm buyers first. It is built for that second case on LinkedIn, where B2B buyers already research vendors and talk in public before they ever fill out a form.",
  },
  {
    question: "Are there free B2B lead generation tools?",
    answer:
      "Yes, several B2B lead generation tools have free tiers, usually with a small monthly credit allowance. Apollo, HubSpot's CRM, Lusha, and Hunter all offer one. Free tiers are useful for testing and light prospecting, but the credits run out quickly and the data is the same cold data everyone else pulls. LinkedGrow does not have a free plan. It offers a 7-day trial so you can watch a real agent work your account before the card is charged, and you can cancel any time before day 7.",
  },
  {
    question: "How much do B2B lead generation tools cost?",
    answer:
      "B2B lead generation tools span a wide price range, from free tiers with a handful of credits to enterprise contracts. Email sequencers usually start around a few tens of dollars a month per seat, while enterprise data platforms quote on request and often pass into the thousands of dollars a year once seats and credits are added. LinkedGrow is $99 a month for one agent with the agent's AI included, $179 a month for a team on the Business plan, and $49 a month for each extra agent you add.",
  },
  {
    question: "How does an AI B2B lead generation tool find leads?",
    answer:
      "An AI B2B lead generation tool reads signals a person could not track at scale. LinkedGrow's agent reads your website to learn your buyer, watches LinkedIn for the people engaging around your topic, and links each lead back to the post that surfaced it. It then writes a message from what that person posted and sends it from your account at a human pace. Because every source is scored on the replies it produces, the tool gets more accurate the longer it runs.",
  },
];

export const metadata: Metadata = {
  title: "B2B Lead Generation Tools: 2026 Buyer's Guide | LinkedGrow",
  description:
    "B2B lead generation tools, compared by type and price. See where an AI LinkedIn agent beats a bought data list, and start a 7-day LinkedGrow trial.",
  openGraph: {
    title: "B2B Lead Generation Tools: 2026 Buyer's Guide",
    description:
      "B2B lead generation tools, compared by type and price. See where an AI LinkedIn agent beats a bought data list, and start a 7-day LinkedGrow trial.",
    url: "https://linkedgrow.ai/b2b-lead-generation-tools",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow B2B lead generation tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "B2B Lead Generation Tools: 2026 Buyer's Guide",
    description:
      "B2B lead generation tools, compared by type and price. See where an AI LinkedIn agent beats a bought data list, and start a 7-day LinkedGrow trial.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/b2b-lead-generation-tools",
  },
};

export default function B2bLeadGenerationToolsPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          {
            name: "B2B Lead Generation Tools",
            url: "https://linkedgrow.ai/b2b-lead-generation-tools",
          },
        ]}
      />
      <FAQJsonLd questions={b2bFaqs} />
      <SoftwareApplicationJsonLd
        name="LinkedGrow - B2B Lead Generation Tool"
        url="https://linkedgrow.ai/b2b-lead-generation-tools"
        description="A signal-based B2B lead generation tool: an AI agent that finds buyers by their real LinkedIn engagement, messages them from your own account, and manages replies in one inbox."
        offers={{ price: "99", priceCurrency: "USD" }}
      />
      <B2bLeadGenerationToolsContent faqs={b2bFaqs} />
    </>
  );
}
