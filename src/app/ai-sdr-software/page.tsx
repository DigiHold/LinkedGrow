import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { AiSdrContent } from "./ai-sdr-content";

const OG = "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp";
const TITLE = "AI SDR Software That Books Meetings on LinkedIn | LinkedGrow";
const DESCRIPTION =
  "AI SDR software that finds leads, opens conversations and books meetings from your own LinkedIn account, every working day. Book a 15-minute live demo.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://linkedgrow.ai/ai-sdr-software",
    siteName: "LinkedGrow",
    type: "website",
    images: [{ url: OG, width: 1200, height: 630, alt: "LinkedGrow AI SDR software for LinkedIn" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG],
  },
  alternates: { canonical: "https://linkedgrow.ai/ai-sdr-software" },
};

/** Defined once, rendered by the page and read by the schema. */
const faqs = [
  {
    question: "What is AI SDR software?",
    answer:
      "AI SDR software does the work a sales development rep does: it finds people who match your ideal client, starts conversations with them, follows up, and hands over the ones who show interest. LinkedGrow runs that on LinkedIn, from your own account, at a human pace, every working day.",
  },
  {
    question: "How is this different from a LinkedIn automation tool?",
    answer:
      "An automation tool sends the sequence you wrote to the list you built. An AI SDR builds the list itself from live signals, writes each message for the person in front of it, reads the reply, and decides what happens next. You describe your buyer once instead of maintaining campaigns.",
  },
  {
    question: "Will my LinkedIn account get restricted?",
    answer:
      "Every account runs in its own browser on a dedicated address reserved for it, starts at 15 actions a day and grows weekly, and works only inside the hours you set. Nothing runs at night, nothing bursts, and no two agents ever touch one account at the same time.",
  },
  {
    question: "How long does setup take?",
    answer:
      "A few minutes. You give your website, the agent reads it and proposes who to target, you adjust, you connect your LinkedIn account, and it starts the same day. The 15-minute demo exists so we do that first setup together and you keep the agent afterwards.",
  },
  {
    question: "What does AI SDR software cost?",
    answer:
      "LinkedGrow is $99 a month for Pro with 2 agents, and $179 a month for Business with 3 agents and a team workspace. Extra agents are $49 a month each. Every plan starts with a 7-day trial, and the AI the agents run on is included in the price.",
  },
];

export default function AiSdrSoftwarePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          { name: "AI SDR Software", url: "https://linkedgrow.ai/ai-sdr-software" },
        ]}
      />
      <SoftwareApplicationJsonLd
        name="LinkedGrow AI SDR"
        url="https://linkedgrow.ai/ai-sdr-software"
        description={DESCRIPTION}
      />
      <FAQJsonLd questions={faqs} />
      <AiSdrContent faqs={faqs} />
    </>
  );
}
