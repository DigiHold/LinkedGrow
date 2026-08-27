import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { AiSalesAgentContent } from "./ai-sales-agent-content";

const OG = "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp";
const TITLE = "AI Sales Agent for LinkedIn Leads | LinkedGrow";
const DESCRIPTION =
  "An AI sales agent that finds your clients on LinkedIn, writes each message from what they posted, and books calls from your account. See it in a live demo.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://linkedgrow.ai/ai-sales-agent",
    siteName: "LinkedGrow",
    type: "website",
    images: [{ url: OG, width: 1200, height: 630, alt: "LinkedGrow AI sales agent for LinkedIn" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG],
  },
  alternates: { canonical: "https://linkedgrow.ai/ai-sales-agent" },
};

/** Defined once, rendered by the page and read by the schema. */
const faqs = [
  {
    question: "What does an AI sales agent do?",
    answer:
      "An AI sales agent does the manual work of a sales development rep: it finds people who match your ideal client, opens the conversation, follows up, updates its own record of who is warm, and hands over anyone who shows real interest. LinkedGrow runs that on LinkedIn, from your own account, at a human pace, every working day.",
  },
  {
    question: "What is the difference between an AI sales agent and a LinkedIn automation tool?",
    answer:
      "A LinkedIn automation tool sends the sequence you wrote to the list you built. An AI sales agent builds the list itself from live signals, writes each message for the person in front of it, reads the reply, and decides what happens next. You describe your buyer once instead of maintaining campaigns and importing spreadsheets.",
  },
  {
    question: "Will an AI sales agent get my LinkedIn account restricted?",
    answer:
      "Not the way LinkedGrow runs one. Every account works in its own browser on a dedicated address reserved for it, starts at 15 actions a day and grows slowly, and acts only inside the hours you set. Nothing runs at night, nothing bursts, and the agent stops the moment LinkedIn asks a question. Blast tools get accounts flagged because they do the opposite.",
  },
  {
    question: "How much does an AI sales agent cost?",
    answer:
      "LinkedGrow is $99 a month for Pro with 2 agents, and $179 a month for Business with 3 agents and a team workspace. Extra agents are $49 a month each. Every plan starts with a 7-day trial that takes a card, and the AI the agents run on is included in the price rather than metered on top.",
  },
  {
    question: "When is an AI sales agent not the right choice?",
    answer:
      "An AI sales agent is the wrong tool if your buyers are not on LinkedIn, if you sell to consumers rather than businesses, or if you have no clear offer and website for it to read yet. It works best when you sell something to other professionals and the deal begins with a real conversation, which is exactly where LinkedGrow is built to help.",
  },
];

export default function AiSalesAgentPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          { name: "AI Sales Agent", url: "https://linkedgrow.ai/ai-sales-agent" },
        ]}
      />
      <SoftwareApplicationJsonLd
        name="LinkedGrow AI Sales Agent"
        url="https://linkedgrow.ai/ai-sales-agent"
        description={DESCRIPTION}
      />
      <FAQJsonLd questions={faqs} />
      <AiSalesAgentContent faqs={faqs} />
    </>
  );
}
