import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { BestPostGeneratorContent } from "./best-generator-content";

export const metadata: Metadata = {
  title: "Best AI LinkedIn Post Generator 2026 - 20+ Models Compared | LinkedGrow",
  description:
    "The best AI LinkedIn post generator with 20+ models: GPT-5, Claude, Gemini, Llama 4. Voice training, unlimited generations, BYOK pricing from $19/month. Used by 179+ founders.",
  keywords: [
    "best ai linkedin post generator",
    "best linkedin post generator ai",
    "top ai linkedin post generator",
    "linkedin post generator comparison",
    "best ai tool for linkedin posts",
    "ai linkedin post generator 2026",
    "top linkedin content generator",
    "best linkedin writing tool ai",
  ],
  openGraph: {
    title: "Best AI LinkedIn Post Generator 2026 - 20+ Models Compared | LinkedGrow",
    description:
      "20+ AI models, voice training, unlimited generations. The best AI post generator for LinkedIn in 2026.",
    url: "https://linkedgrow.ai/best-ai-linkedin-post-generator",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og-default.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow - Best AI LinkedIn Post Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best AI LinkedIn Post Generator 2026 | LinkedGrow",
    description:
      "20+ AI models, voice training, BYOK pricing. The best LinkedIn post generator compared.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og-default.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/best-ai-linkedin-post-generator",
  },
};

const bestGenFAQs = [
  {
    question: "What makes LinkedGrow the best AI LinkedIn post generator?",
    answer:
      "Three things set LinkedGrow apart. First, you get access to 20+ AI models (GPT-5, Claude, Gemini, Llama 4, and more) instead of being locked into one. Second, voice training analyzes your past posts so every AI-generated post matches your writing style. Third, the BYOK model means unlimited generations at $19 per month plus $2 to $4 in AI costs - 80% less than competitors charging $49 to $99 with caps.",
  },
  {
    question: "How does LinkedGrow compare to Taplio, AuthoredUp, or Supergrow?",
    answer:
      "Most LinkedIn tools offer 1 AI model, cap generations at 30 to 100 per month, and charge $49 to $99. LinkedGrow offers 20+ models, unlimited generations, voice training, integrated image generation, scheduling, and analytics for $19 to $39 per month. The BYOK model adds only $2 to $4 in AI costs. No other tool offers this combination at this price.",
  },
  {
    question: "Why does having 20+ AI models matter?",
    answer:
      "Different AI models produce different writing styles and excel at different content types. GPT-5 is great for storytelling, Claude writes nuanced thought leadership, Gemini is fast and concise, and Llama 4 handles technical topics well. Having 20+ models means you can match the right model to each post type instead of being stuck with one.",
  },
  {
    question: "How accurate is the voice training?",
    answer:
      "Very accurate. You paste 3 to 5 of your best LinkedIn posts and the AI analyzes your sentence structure, vocabulary, tone, and formatting patterns. Users consistently report that their audience cannot distinguish between manually written and AI-generated posts after voice training is configured.",
  },
  {
    question: "Is there a free trial or free plan?",
    answer:
      "Yes. The free plan includes 3 AI post generations per month with voice training and access to all AI models. No credit card required. Paid plans start at $19 per month for unlimited generations.",
  },
  {
    question: "What AI models are available for post generation?",
    answer:
      "Text models: GPT-5, GPT-5.2 Pro, o4-mini, Claude Opus 4.5, Claude Sonnet 4.5, Claude Haiku 4.5, Gemini 3 Pro, Gemini 3 Flash, Llama 4 Maverick, Llama 4 Scout, DeepSeek-R1, Qwen3-Coder-480B, and more. Image models: DALL-E 3, GPT-5, FLUX.2 Pro, Gemini, Imagen 3.",
  },
  {
    question: "How much does the best AI LinkedIn post generator cost?",
    answer:
      "LinkedGrow starts free with 3 generations per month. Starter is $19 per month with unlimited generations. Pro is $39 per month adding image generation and analytics. BYOK AI costs are $2 to $4 per month on average with zero markup from LinkedGrow.",
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
        description="The best AI LinkedIn post generator with 20+ models, voice training, and unlimited generations. GPT-5, Claude, Gemini, Llama 4. BYOK pricing from $19/month."
        offers={{ price: "19", priceCurrency: "USD" }}
      />
      <BestPostGeneratorContent />
    </>
  );
}
