import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { MarketingToolContent } from "./marketing-tool-content";

export const metadata: Metadata = {
  title: "LinkedIn Marketing Tool for Content, Scheduling, Analytics",
  description:
    "LinkedGrow is a LinkedIn marketing tool with AI content creation, post scheduling, carousel generation, and analytics. 43 AI models, BYOK, from $99/mo.",
  openGraph: {
    title: "LinkedIn Marketing Tool for Content, Scheduling, Analytics",
    description:
      "LinkedGrow is a LinkedIn marketing tool with AI content creation, post scheduling, carousel generation, and analytics. 43 AI models, BYOK, from $99/mo.",
    url: "https://linkedgrow.ai/linkedin-marketing-tool",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og/linkedin-marketing-tool.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow - LinkedIn Marketing Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkedIn Marketing Tool for Content, Scheduling, Analytics",
    description:
      "LinkedGrow is a LinkedIn marketing tool with AI content creation, post scheduling, carousel generation, and analytics. 43 AI models, BYOK, from $99/mo.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og/linkedin-marketing-tool.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/linkedin-marketing-tool",
  },
};

const marketingToolFAQs = [
  {
    question: "What is a LinkedIn marketing tool?",
    answer:
      "A LinkedIn marketing tool is software that helps you create, schedule, publish, and analyze LinkedIn content from a single platform. Instead of writing posts directly in LinkedIn, switching to a design tool for images, and manually tracking performance, a LinkedIn marketing tool combines these steps into one workflow. LinkedGrow adds AI-powered content generation with 26+ models through the BYOK model.",
  },
  {
    question: "How much does a LinkedIn marketing tool cost?",
    answer:
      "LinkedIn marketing tools range from $99 per month (LinkedGrow Pro) to $299 per seat per month (Sprout Social). Most content-focused tools charge $30 to $80 per month. LinkedGrow uses the BYOK model where your AI API costs average $2 to $4 per month on top of the subscription, giving you unlimited AI generation without monthly caps or credit systems.",
  },
  {
    question: "Is LinkedGrow better than using LinkedIn natively?",
    answer:
      "LinkedIn's built-in tools cover basic posting and scheduling. LinkedGrow adds AI content generation trained on your writing voice, carousel creation, advanced scheduling with content calendar, hook generation, content repurposing from blogs, YouTube, and Reddit, plus analytics. The biggest difference is the AI writing assistant that maintains your personal voice across every post.",
  },
  {
    question: "Can I use LinkedGrow as my only LinkedIn marketing tool?",
    answer:
      "Yes. LinkedGrow covers the full LinkedIn content marketing workflow: AI-powered post writing, image generation, carousel creation, scheduling with content calendar, publishing straight from your own account, and performance analytics. You don't need separate tools for writing, designing, scheduling, and tracking.",
  },
  {
    question: "What AI models does LinkedGrow support for content creation?",
    answer:
      "LinkedGrow supports 26+ text AI models across 6 providers: OpenAI (GPT-5.2, GPT-5, o4-mini), Anthropic (Claude Opus 4.7, Sonnet 4.6, Haiku 4.5), Google (Gemini 3 Pro, 2.5 Flash), xAI (Grok 4), Perplexity (Sonar Deep Research), and Kimi (K2.5). For images, 14+ models from Google, OpenAI, and Replicate. You bring your own API keys and pay provider rates directly.",
  },
  {
    question: "Does LinkedGrow work with LinkedIn company pages?",
    answer:
      "Yes. LinkedGrow publishes to both personal profiles and company pages you manage, straight from your own account. You can schedule and publish company page content with the same AI tools, calendar, and analytics available for personal profiles.",
  },
  {
    question: "How is LinkedGrow different from Hootsuite or Buffer for LinkedIn?",
    answer:
      "Hootsuite and Buffer are general social media management tools that support LinkedIn alongside other platforms. LinkedGrow is built specifically for LinkedIn marketing. The key differences: AI content generation with voice training, BYOK pricing model (no credit limits), carousel generator, hook generator, content repurposing from multiple sources, and a LinkedIn-specific analytics dashboard.",
  },
  {
    question: "What is the BYOK model and why does it matter?",
    answer:
      "BYOK stands for Bring Your Own Key. Instead of paying LinkedGrow for AI credits or generations, you connect your own API keys from providers like OpenAI, Anthropic, or Google. You pay the provider directly at their published rates, which average $2 to $4 per month for typical LinkedIn posting volume. This means unlimited AI generation with no monthly caps, no credit systems, and no markup.",
  },
];

export default function LinkedinMarketingToolPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          {
            name: "LinkedIn Marketing Tool",
            url: "https://linkedgrow.ai/linkedin-marketing-tool",
          },
        ]}
      />
      <FAQJsonLd questions={marketingToolFAQs} />
      <SoftwareApplicationJsonLd
        name="LinkedGrow - LinkedIn Marketing Tool"
        url="https://linkedgrow.ai/linkedin-marketing-tool"
        description="Complete LinkedIn marketing tool with AI content creation, post scheduling, carousel generation, image creation, and analytics. BYOK model for unlimited AI generation."
        offers={{ price: "19", priceCurrency: "USD" }}
      />
      <MarketingToolContent />
    </>
  );
}
