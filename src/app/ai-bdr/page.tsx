import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { AiBdrContent } from "./ai-bdr-content";

const OG = "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp";
const TITLE = "AI BDR Software That Works Your LinkedIn | LinkedGrow";
const DESCRIPTION =
  "AI BDR software that finds buyers, opens the conversation and builds pipeline from your own LinkedIn account, every working day. Book a 15-minute live demo.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://linkedgrow.ai/ai-bdr",
    siteName: "LinkedGrow",
    type: "website",
    images: [{ url: OG, width: 1200, height: 630, alt: "LinkedGrow AI BDR software for LinkedIn" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG],
  },
  alternates: { canonical: "https://linkedgrow.ai/ai-bdr" },
};

/** Defined once, rendered by the page and read by the schema. */
const faqs = [
  {
    question: "What is an AI BDR?",
    answer:
      "An AI BDR is software that handles the outbound work of a business development rep: it finds people who match your market, opens the conversation, follows up, and passes on anyone who shows interest. LinkedGrow does this on LinkedIn, from your own account, every working day, so pipeline still gets built on the weeks you are heads down on the product.",
  },
  {
    question: "What is the difference between an AI BDR and an AI SDR?",
    answer:
      "A BDR builds pipeline at the top: it finds cold prospects and starts the first conversation. An SDR qualifies that interest and books the meeting, often from inbound as well. LinkedGrow works as both from one LinkedIn account, so the mechanics are shared and the goal is what changes. If your target is booked calls specifically, our AI SDR software page covers that angle.",
  },
  {
    question: "How is an AI BDR different from a LinkedIn automation tool?",
    answer:
      "An automation tool sends the sequence you wrote to the list you built. An AI BDR builds the list itself from live signals, writes each message for the person in front of it, reads the reply, and decides what comes next. With LinkedGrow you describe your buyer once instead of maintaining campaigns by hand.",
  },
  {
    question: "Will an AI BDR get my LinkedIn account restricted?",
    answer:
      "LinkedGrow runs each account in its own browser on a dedicated address reserved for it, starts at 15 actions a day and grows slowly, and works only inside the hours you choose. Nothing runs overnight, nothing bursts, and no two agents ever touch the same account at once.",
  },
  {
    question: "How much does an AI BDR cost?",
    answer:
      "LinkedGrow is $99 a month for Pro with 2 agents and $179 a month for Business with 3 agents and a team workspace. Extra agents are $49 a month each. Every plan opens with a 7-day trial, and the AI the agents run on is included in the price, so no usage bill lands on top.",
  },
];

export default function AiBdrPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          { name: "AI BDR", url: "https://linkedgrow.ai/ai-bdr" },
        ]}
      />
      <SoftwareApplicationJsonLd
        name="LinkedGrow AI BDR"
        url="https://linkedgrow.ai/ai-bdr"
        description={DESCRIPTION}
      />
      <FAQJsonLd questions={faqs} />
      <AiBdrContent faqs={faqs} />
    </>
  );
}
