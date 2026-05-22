import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { BestPostGeneratorContent } from "./best-generator-content";

export const metadata: Metadata = {
  title: "Best LinkedIn Post Generator 2026: 26+ AI Models with BYOK",
  description:
    "26+ AI models (GPT, Claude, Gemini, Grok, Perplexity, Kimi) via BYOK, voice training, and $13/mo pricing. The best LinkedIn post generator.",
  openGraph: {
    title: "Best LinkedIn Post Generator 2026: 26+ AI Models with BYOK",
    description:
      "26+ AI models (GPT, Claude, Gemini, Grok, Perplexity, Kimi) via BYOK, voice training, and $13/mo pricing. The best LinkedIn post generator.",
    url: "https://linkedgrow.ai/best-ai-linkedin-post-generator",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow - Best AI LinkedIn Post Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best LinkedIn Post Generator 2026: 26+ AI Models",
    description:
      "26+ AI models (GPT, Claude, Gemini, Grok, Perplexity, Kimi) via BYOK, voice training, and $13/mo pricing. The best LinkedIn post generator.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/best-ai-linkedin-post-generator",
  },
};

const bestGenFAQs = [
  {
    question: "What makes LinkedGrow the best AI LinkedIn post generator?",
    answer:
      "Three things set LinkedGrow apart. First, you get access to 26+ AI models (ChatGPT, Claude, Gemini, Grok, and more) instead of being locked into one. Second, voice training analyzes your past posts so every AI-generated post matches your writing style. Third, the BYOK model means unlimited generations at $13 per month plus $2 to $4 in AI costs - 80% less than competitors charging $49 to $199 with caps.",
  },
  {
    question: "How does LinkedGrow compare to Taplio, AuthoredUp, or Supergrow?",
    answer:
      "Most LinkedIn tools offer 1 AI model, cap generations at 30 to 100 per month, and charge $49 to $199. LinkedGrow offers 26+ models, unlimited generations, voice training, integrated image generation, scheduling, and analytics for $13 to $55 per month. The BYOK model adds only $2 to $4 in AI costs. No other tool offers this combination at this price.",
  },
  {
    question: "Why does having 26+ AI models matter?",
    answer:
      "Different AI models produce different writing styles and excel at different content types. ChatGPT is great for storytelling, Claude writes nuanced thought leadership, Gemini is fast and concise, and Grok handles technical topics well. Having 26+ models means you can match the right model to each post type instead of being stuck with one.",
  },
  {
    question: "How accurate is the voice training?",
    answer:
      "Very accurate. You paste 3 to 5 of your best LinkedIn posts and the AI analyzes your sentence structure, vocabulary, tone, and formatting patterns. Users consistently report that their audience cannot distinguish between manually written and AI-generated posts after voice training is configured.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes. The 7-day Pro trial gives you full Pro access with unlimited AI generation, voice training, and all 26 AI models via BYOK - no credit card required. After the trial, paid plans start at $13/mo (billed yearly) for unlimited generation.",
  },
  {
    question: "What AI models are available for post generation?",
    answer:
      "Text models: the latest models from OpenAI, Anthropic, Google, xAI, Perplexity, and Kimi - 26+ models in total. Image models from OpenAI, Google, and Replicate - 14 models available.",
  },
  {
    question: "How much does the best AI LinkedIn post generator cost?",
    answer:
      "LinkedGrow includes a 7-day Pro trial with full Pro access, no credit card required. Starter is $13 per month with unlimited generations. Pro is $27 per month adding image generation and analytics. Business is $55 per month with carousels, A/B testing, team collaboration, and API access. BYOK AI costs are $2 to $4 per month on average with zero markup from LinkedGrow.",
  },
  {
    question: "Can I publish directly to LinkedIn from the generator?",
    answer:
      "Yes. After generating a post, you can publish it directly to your LinkedIn profile or company page, or schedule it for a specific date and time. The content calendar shows your full posting schedule with optimal time suggestions.",
  },
];

export default function BestAiLinkedinPostGeneratorPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          {
            name: "Best AI LinkedIn Post Generator",
            url: "https://linkedgrow.ai/best-ai-linkedin-post-generator",
          },
        ]}
      />
      <FAQJsonLd questions={bestGenFAQs} />
      <SoftwareApplicationJsonLd
        name="LinkedGrow - Best AI LinkedIn Post Generator"
        url="https://linkedgrow.ai/best-ai-linkedin-post-generator"
        description="The best AI LinkedIn post generator with 26+ models, voice training, and unlimited generations. ChatGPT, Claude, Gemini, Grok. BYOK pricing from $13/month."
        offers={{ price: "19", priceCurrency: "USD" }}
      />
      <BestPostGeneratorContent />
    </>
  );
}
