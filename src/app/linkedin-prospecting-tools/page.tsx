import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { LinkedinProspectingToolsContent } from "./linkedin-prospecting-tools-content";

const prospectingFaqs = [
  {
    question: "What are LinkedIn prospecting tools?",
    answer:
      "LinkedIn prospecting tools help you find and contact potential buyers on LinkedIn. They fall into three groups by where the leads come from: data tools and Sales Navigator that sell filtered contacts (Apollo, Lusha, Sales Navigator), automation tools that fire connection requests and messages through a bot (Dripify, Waalaxy, PhantomBuster), and signal-based agents that act on live engagement. LinkedGrow is the last kind: an agent that finds buyers by their real activity and messages them from your own account at a human pace.",
  },
  {
    question: "What is the best LinkedIn prospecting tool?",
    answer:
      "There is no single best LinkedIn prospecting tool, because the right one depends on how you sell. If you already trust a list and want to run a campaign against it, a per seat tool like Dripify fits. If you run outreach across many client accounts, HeyReach is built for that. If you sell higher-value deals where each conversation counts, a signal-based agent wins because it reaches warm buyers first and writes the message for you. LinkedGrow is built for that last case, on LinkedIn, where buyers research and talk in public before they fill out a form.",
  },
  {
    question: "Are there free LinkedIn prospecting tools?",
    answer:
      "Yes, several LinkedIn prospecting tools have free tiers, usually a small monthly credit allowance. Apollo, Lusha, and Waalaxy all offer one, and LinkedIn's own search is free if you are willing to message by hand. Free tiers are useful for testing, but the credits run out fast and the data is the same cold data everyone else pulls. LinkedGrow does not have a free plan. It offers a 7-day trial so you can watch a real agent work your account before the card is charged, and you can cancel any time before day 7.",
  },
  {
    question: "Are LinkedIn prospecting tools safe to use?",
    answer:
      "It depends on how the tool acts on your account. Automation bots that fire connection requests and messages at machine speed trigger LinkedIn's detection, and the penalty runs from a temporary restriction to a permanent ban. A safer LinkedIn prospecting tool works from your own account at a human pace, inside limits you set, on an address reserved for you. LinkedGrow is built that way: it never moves faster than a person would, and you can review the messages before they go out.",
  },
  {
    question: "How much do LinkedIn prospecting tools cost?",
    answer:
      "LinkedIn prospecting tools range from free tiers with a handful of credits to enterprise contracts in the thousands a year. Automation tools usually run $39 to $99 per user a month, Sales Navigator is $89.99 to $159.99 a seat, and data platforms quote on request. LinkedGrow is $99 a month for one agent with the agent's AI included, $179 a month for a team on the Business plan, and $49 a month for each extra agent you add.",
  },
];

export const metadata: Metadata = {
  title: "LinkedIn Prospecting Tools: 2026 Buyer's Guide | LinkedGrow",
  description:
    "LinkedIn prospecting tools compared by where the leads come from and what they cost, from bought data and connection bots to a signal-based LinkedIn agent.",
  openGraph: {
    title: "LinkedIn Prospecting Tools: 2026 Buyer's Guide",
    description:
      "LinkedIn prospecting tools compared by where the leads come from and what they cost, from bought data and connection bots to a signal-based LinkedIn agent.",
    url: "https://linkedgrow.ai/linkedin-prospecting-tools",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow LinkedIn prospecting tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkedIn Prospecting Tools: 2026 Buyer's Guide",
    description:
      "LinkedIn prospecting tools compared by where the leads come from and what they cost, from bought data and connection bots to a signal-based LinkedIn agent.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/linkedin-prospecting-tools",
  },
};

export default function LinkedinProspectingToolsPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          {
            name: "LinkedIn Prospecting Tools",
            url: "https://linkedgrow.ai/linkedin-prospecting-tools",
          },
        ]}
      />
      <FAQJsonLd questions={prospectingFaqs} />
      <SoftwareApplicationJsonLd
        name="LinkedGrow - LinkedIn Prospecting Tool"
        url="https://linkedgrow.ai/linkedin-prospecting-tools"
        description="A signal-based LinkedIn prospecting tool: an AI agent that finds buyers by their real LinkedIn engagement, messages them from your own account at a human pace, and manages replies in one inbox."
        offers={{ price: "99", priceCurrency: "USD" }}
      />
      <LinkedinProspectingToolsContent faqs={prospectingFaqs} />
    </>
  );
}
