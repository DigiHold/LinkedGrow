import type { Metadata } from "next";

import {
  BreadcrumbJsonLd,
  FAQJsonLd,
  SoftwareApplicationJsonLd,
} from "@/components/seo/json-ld";

import { LinkedinAiAgentContent } from "./agent-content";

const URL = "https://linkedgrow.ai/linkedin-ai-agent";
const OG = "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og/linkedin-ai-agent.webp";
const DESCRIPTION =
  "A LinkedIn AI agent that works your own account all day: it finds who buys from you, writes from what they posted, follows up once, and stops when they reply.";

export const metadata: Metadata = {
  title: "LinkedIn AI Agent: It Works Your Account All Day",
  description: DESCRIPTION,
  openGraph: {
    title: "LinkedIn AI Agent: It Works Your Account All Day",
    description: DESCRIPTION,
    url: URL,
    siteName: "LinkedGrow",
    type: "website",
    images: [{ url: OG, width: 1200, height: 630, alt: "LinkedGrow - LinkedIn AI agent" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkedIn AI Agent: It Works Your Account All Day",
    description: DESCRIPTION,
    images: [OG],
  },
  alternates: { canonical: URL },
};

const faqs = [
  {
    question: "What is a LinkedIn AI agent?",
    answer:
      "Software that works a LinkedIn account the way a person would, rather than firing a campaign at a list. It decides who is worth approaching, reads what they wrote, writes something specific, and knows when to stop. The judgement is the part that makes it an agent.",
  },
  {
    question: "How is an AI agent different from LinkedIn automation?",
    answer:
      "Automation repeats an action you configured. An agent chooses the action. Here that means picking today's people out of everyone it found, writing each note from a different post, and cancelling the sequence the moment somebody answers, without a rule telling it to.",
  },
  {
    question: "Does the LinkedIn AI agent use my account?",
    answer:
      "Yes, your own profile, through its own cloud session on a dedicated residential address in the country you choose. Everything it sends comes from you, which is why the pacing matters and why warm-up belongs to the account rather than to the campaign.",
  },
  {
    question: "Do I need my own AI key for the agent?",
    answer:
      "No. The agent AI is ours and it is in the price. Writing posts still runs on your own key, so somebody who never publishes never has to add one, and the agent works perfectly for them either way.",
  },
  {
    question: "What does the LinkedIn AI agent not do?",
    answer:
      "It never scrapes or exports profiles, never sends email, and never answers a reply on your behalf. When somebody responds, the sequence stops and the conversation is handed to you with the post that started it attached.",
  },
];

export default function LinkedinAiAgentPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          { name: "LinkedIn AI Agent", url: URL },
        ]}
      />
      <FAQJsonLd questions={faqs} />
      <SoftwareApplicationJsonLd
        description="A LinkedIn AI agent that sources leads from public signals, writes from what each person posted, and works your own account at a safe pace."
        name="LinkedGrow LinkedIn AI Agent"
        offers={{ price: "99", priceCurrency: "USD" }}
        url={URL}
      />
      <LinkedinAiAgentContent faqs={faqs} />
    </>
  );
}
