import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { ContentCreationAiContent } from "./ai-content";

export const metadata: Metadata = {
  title: "LinkedIn Content Creation AI - Generate Posts, Photos & Carousels | LinkedGrow",
  description:
    "Use AI to create LinkedIn content 10x faster. Generate posts with ChatGPT, Claude, Gemini. Create photos with the latest AI image models. Build carousels, schedule posts, and track analytics.",
  openGraph: {
    title: "LinkedIn Content Creation AI - Generate Posts, Photos & Carousels | LinkedGrow",
    description:
      "Use AI to create LinkedIn content 10x faster. Posts, photos, carousels, scheduling, and analytics in one AI-powered platform.",
    url: "https://linkedgrow.ai/linkedin-content-creation-ai",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og-default.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow - LinkedIn Content Creation AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkedIn Content Creation AI | LinkedGrow",
    description:
      "AI-powered LinkedIn content creation. Generate posts, photos, and carousels 10x faster.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og-default.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/linkedin-content-creation-ai",
  },
};

const aiContentFAQs = [
  {
    question: "What AI models does LinkedGrow use for LinkedIn content creation?",
    answer:
      "LinkedGrow supports 26+ AI text models from OpenAI, Anthropic, Google, xAI, Perplexity, and Kimi (Moonshot AI) - always the latest versions available. For image generation it supports 10+ models from OpenAI, Google, and Replicate. You choose which model to use for each generation.",
  },
  {
    question: "How does AI content creation work for LinkedIn?",
    answer:
      "You describe what you want to write about - a topic, a key message, or even a Reddit post you want to repurpose. The AI generates a complete LinkedIn post matching your writing voice, tone, and target audience. You can edit the result, generate a matching photo with AI, schedule it, and publish directly to LinkedIn.",
  },
  {
    question: "Will AI-generated LinkedIn content sound like me?",
    answer:
      "Yes. LinkedGrow includes voice training that analyzes your past LinkedIn posts to learn your writing style, vocabulary, and tone. Every AI-generated post matches your voice so your audience cannot tell the difference between your manually written posts and AI-assisted ones.",
  },
  {
    question: "How much does AI LinkedIn content creation cost?",
    answer:
      "LinkedGrow plans start at $19 per month for Starter with unlimited post generation. The AI provider costs average $2 to $4 per month with the BYOK model - you bring your own API key and pay providers directly with zero markup. That is 60 to 80 percent less than typical LinkedIn tools that charge $49 to $199 per month with generation caps.",
  },
  {
    question: "Can AI create LinkedIn carousels and images too?",
    answer:
      "Yes. The Pro plan includes AI image generation with 10+ models, and the Business plan adds carousel creation. Generate custom photos from text descriptions, build multi-slide carousels for higher engagement, and attach everything directly to your scheduled posts.",
  },
  {
    question: "Is AI content creation allowed on LinkedIn?",
    answer:
      "Yes. LinkedIn allows AI-assisted content creation. The key is that your content should provide genuine value and reflect your professional expertise. LinkedGrow's voice training ensures your AI-generated posts maintain your authentic voice while saving you hours of writing time each week.",
  },
  {
    question: "How many LinkedIn posts can I generate with AI?",
    answer:
      "Unlimited on all paid plans. The free plan includes 3 AI generations per month. Paid plans have no caps, no credit limits, and no token restrictions. With BYOK, you generate as much as you want and pay the AI provider a few cents per post.",
  },
  {
    question: "Does LinkedGrow also schedule and publish AI content?",
    answer:
      "Yes. After generating a post with AI, you can schedule it to publish at the optimal time directly from the editor. LinkedGrow publishes to your LinkedIn profile or company page automatically. The content calendar gives you a visual overview of all scheduled posts.",
  },
];

export default function LinkedinContentCreationAiPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          {
            name: "LinkedIn Content Creation AI",
            url: "https://linkedgrow.ai/linkedin-content-creation-ai",
          },
        ]}
      />
      <FAQJsonLd questions={aiContentFAQs} />
      <SoftwareApplicationJsonLd
        name="LinkedGrow - AI LinkedIn Content Creator"
        url="https://linkedgrow.ai/linkedin-content-creation-ai"
        description="AI-powered LinkedIn content creation platform. Generate posts with ChatGPT, Claude, Gemini. Create photos with the latest AI image models. Schedule and publish directly to LinkedIn."
        offers={{ price: "19", priceCurrency: "USD" }}
      />
      <ContentCreationAiContent />
    </>
  );
}
