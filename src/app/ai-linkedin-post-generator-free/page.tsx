import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { PostGeneratorFreeContent } from "./post-generator-content";

export const metadata: Metadata = {
  title: "Free LinkedIn Post Generator: 7-Day Full Pro Trial",
  description:
    "7-day Pro trial with full access to 43 AI models, voice training, scheduling, and unlimited generation. The free LinkedIn post generator: everything included needed.",
  openGraph: {
    title: "Free LinkedIn Post Generator: 7-Day Full Pro Trial",
    description:
      "7-day Pro trial with full access to 43 AI models, voice training, scheduling, and unlimited generation. The free LinkedIn post generator: everything included needed.",
    url: "https://linkedgrow.ai/ai-linkedin-post-generator-free",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og/ai-linkedin-post-generator-free.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow - AI LinkedIn Post Generator Free",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free LinkedIn Post Generator: 7-Day Full Pro Trial",
    description:
      "7-day Pro trial with full access to 43 AI models, voice training, scheduling, and unlimited generation. The free LinkedIn post generator: everything included needed.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og/ai-linkedin-post-generator-free.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/ai-linkedin-post-generator-free",
  },
};

const postGenFreeFAQs = [
  {
    question: "Is the AI LinkedIn post generator really free?",
    answer:
      "Yes. The 7-day Pro trial gives you full Pro access with unlimited AI generation, all 43 AI models, and voice training - everything included. After the trial, paid plans start at $99/mo. With BYOK pricing, your AI costs are just a few cents per post since you pay the AI provider directly with zero markup from LinkedGrow.",
  },
  {
    question: "What AI models can I use to generate LinkedIn posts for free?",
    answer:
      "LinkedGrow supports 26+ AI text models from OpenAI, Anthropic, Google, xAI, Perplexity, and Kimi - always the latest versions available. You choose which model to use based on your preference and can switch between models at any time.",
  },
  {
    question: "How does the AI generate a LinkedIn post?",
    answer:
      "You enter a topic or idea, select a post type like storytelling, thought leadership, or how-to, and the AI generates a complete LinkedIn post. The 4-step wizard guides you through topic selection, tone setting, content generation, and final editing. You can regenerate or edit the result before publishing.",
  },
  {
    question: "Will the AI-generated posts sound like me?",
    answer:
      "Yes. LinkedGrow includes voice training where you paste 3 to 5 of your best LinkedIn posts. The AI analyzes your writing patterns, vocabulary, sentence structure, and tone, then generates all future posts matching your unique voice. Your audience will not be able to tell the difference.",
  },
  {
    question: "Can I schedule AI-generated posts to LinkedIn?",
    answer:
      "Yes. After generating a post, you can publish it immediately to LinkedIn or schedule it for a specific date and time. Pro and Business plans offer unlimited scheduling with a visual content calendar.",
  },
  {
    question: "How much does it cost after the 7-day Pro trial?",
    answer:
      "The Pro plan is $99 per month with unlimited post generation, unlimited scheduling, a content calendar, image generation, analytics, and network notifications. The Business plan at $179 per month includes everything in Pro plus carousel generator, A/B testing, team collaboration, advanced analytics, API access, and priority support. With BYOK, most users spend $2 to $4 per month on AI API costs for regular posting.",
  },
  {
    question: "What makes this better than ChatGPT for LinkedIn posts?",
    answer:
      "LinkedGrow is purpose-built for LinkedIn content. It includes voice training to match your writing style, a 4-step post wizard optimized for LinkedIn format, direct publishing and scheduling to your LinkedIn profile, hook generator for attention-grabbing opening lines, and a content calendar to plan your week. ChatGPT is a general tool that requires manual prompting and copy-pasting.",
  },
  {
    question: "Do I need to provide my own AI API key?",
    answer:
      "Yes, this is the BYOK (Bring Your Own Key) model, which is what keeps generation genuinely unlimited. You get an API key from OpenAI, Anthropic, Google, or other providers, and connect it in your settings. You pay the AI provider directly - typically $2 to $4 per month for regular usage - with zero markup from LinkedGrow.",
  },
];

export default function AiLinkedinPostGeneratorFreePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          {
            name: "AI LinkedIn Post Generator Free",
            url: "https://linkedgrow.ai/ai-linkedin-post-generator-free",
          },
        ]}
      />
      <FAQJsonLd questions={postGenFreeFAQs} />
      <SoftwareApplicationJsonLd
        name="LinkedGrow AI LinkedIn Post Generator"
        url="https://linkedgrow.ai/ai-linkedin-post-generator-free"
        description="Generate LinkedIn posts for free with AI. 26+ models including ChatGPT, Claude, Gemini. Voice training matches your writing style. 7-day Pro trial with everything included."
        offers={{ price: "0", priceCurrency: "USD" }}
      />
      <PostGeneratorFreeContent />
    </>
  );
}
