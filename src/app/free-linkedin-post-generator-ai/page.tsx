import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { FreePostGeneratorContent } from "./free-generator-content";

export const metadata: Metadata = {
  title: "Free AI LinkedIn Post Writer: 26 Models, BYOK Pricing",
  description:
    "43 AI models (GPT, Claude, Gemini, Grok, Perplexity, Kimi) via BYOK. Voice training matches your style. 7-day Pro trial, with the card charged on day 8 unless you cancel.",
  openGraph: {
    title: "Free AI LinkedIn Post Writer: 26 Models, BYOK Pricing",
    description:
      "43 AI models (GPT, Claude, Gemini, Grok, Perplexity, Kimi) via BYOK. Voice training matches your style. 7-day Pro trial, with the card charged on day 8 unless you cancel.",
    url: "https://linkedgrow.ai/free-linkedin-post-generator-ai",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow - Free LinkedIn Post Generator AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI LinkedIn Post Writer: BYOK + 26 Models",
    description:
      "43 AI models (GPT, Claude, Gemini, Grok, Perplexity, Kimi) via BYOK. Voice training matches your style. 7-day Pro trial, with the card charged on day 8 unless you cancel.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/free-linkedin-post-generator-ai",
  },
};

const freeGenFAQs = [
  {
    question: "Is this LinkedIn post generator AI really free?",
    answer:
      "Yes. LinkedGrow's 7-day Pro trial gives you full Pro access - unlimited AI generation, all 43 AI models via BYOK, voice training, scheduling, and analytics. The card is taken at signup and the plan starts on day 8. After the trial, paid plans start at $13/mo (billed yearly) for unlimited generation.",
  },
  {
    question: "Do I need to sign up to use the free AI post generator?",
    answer:
      "You need to create a free account to access the post generator, which takes about 30 seconds. This is because the generator uses your voice training data and connected API key to produce personalized results. Everything included is required for the 7-day Pro trial.",
  },
  {
    question: "What AI models can I use on the 7-day Pro trial?",
    answer:
      "The 7-day Pro trial gives you access to all 26 supported models from OpenAI, Anthropic, Google, Grok, Perplexity, and Kimi. You connect your own API key from any provider (BYOK), and you can switch between models on every generation.",
  },
  {
    question: "How does voice training work on the 7-day Pro trial?",
    answer:
      "Voice training is available on all plans including free. Paste 3 to 5 of your best LinkedIn posts and the AI analyzes your writing style, vocabulary, and tone. Every post it generates after that will match your voice. This is the most important feature for making AI content sound authentic.",
  },
  {
    question: "What happens after the 7-day trial ends?",
    answer:
      "After the 7-day Pro trial, you'll need a paid plan to continue. Starter is $13/mo (billed yearly) for unlimited generation. Your voice training data and all settings carry over automatically when you upgrade.",
  },
  {
    question: "How much does the paid plan cost after free?",
    answer:
      "Starter is $13 per month with unlimited post generations, scheduling for up to 10 posts, and a content calendar. Pro is $27 per month adding image generation, analytics, and network notifications. Business is $55 per month with carousels, A/B testing, team collaboration, and advanced analytics. BYOK AI costs are typically $2 to $4 per month with zero markup.",
  },
  {
    question: "What is BYOK and why does it matter for a free generator?",
    answer:
      "BYOK means Bring Your Own Key. You get an API key from providers like OpenAI or Anthropic and connect it to LinkedGrow. You pay the provider directly at their rates with zero markup. This is why LinkedGrow can offer a 7-day Pro trial and still provide access to premium AI models.",
  },
  {
    question: "Can I schedule posts on the 7-day Pro trial?",
    answer:
      "Scheduling is available on paid plans starting at Starter ($13 per month). On the 7-day Pro trial, you can generate posts and copy them to LinkedIn manually, or publish directly to your connected LinkedIn account. Upgrade to Starter for scheduling up to 10 posts.",
  },
];

export default function FreeLinkedinPostGeneratorAiPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          {
            name: "Free LinkedIn Post Generator AI",
            url: "https://linkedgrow.ai/free-linkedin-post-generator-ai",
          },
        ]}
      />
      <FAQJsonLd questions={freeGenFAQs} />
      <SoftwareApplicationJsonLd
        name="LinkedGrow Free AI LinkedIn Post Writer"
        url="https://linkedgrow.ai/free-linkedin-post-generator-ai"
        description="Free AI LinkedIn post writer with 26+ models and voice training that matches your writing style. 7-day Pro trial with full Pro access, everything included."
        offers={{ price: "0", priceCurrency: "USD" }}
      />
      <FreePostGeneratorContent />
    </>
  );
}
