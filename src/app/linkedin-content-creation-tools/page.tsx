import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { ContentCreationToolsContent } from "./tools-content";

export const metadata: Metadata = {
  title: "LinkedIn Content Creation Tools - All-in-One AI Platform | LinkedGrow",
  description:
    "Complete LinkedIn content creation toolkit with AI post generator, photo creator, carousel maker, scheduler, and analytics. Everything you need to grow on LinkedIn in one platform.",
  openGraph: {
    title: "LinkedIn Content Creation Tools - All-in-One AI Platform | LinkedGrow",
    description:
      "Complete LinkedIn content creation toolkit. AI post generator, photo creator, carousel maker, scheduler, and analytics in one platform.",
    url: "https://linkedgrow.ai/linkedin-content-creation-tools",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow - LinkedIn Content Creation Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkedIn Content Creation Tools | LinkedGrow",
    description:
      "All-in-one LinkedIn content toolkit. AI post generator, photo creator, scheduler, analytics, and more.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/linkedin-content-creation-tools",
  },
};

const toolsFAQs = [
  {
    question: "What LinkedIn content creation tools does LinkedGrow include?",
    answer:
      "LinkedGrow includes an AI post generator with 26+ text models, AI photo generator with 10+ image models, LinkedIn carousel maker, content calendar with scheduling, hook generator for scroll-stopping opening lines, Reddit-to-LinkedIn content converter, network notifications for liking and commenting from your dashboard, analytics dashboard, and A/B testing. All tools are built into a single platform.",
  },
  {
    question: "How much do LinkedIn content creation tools typically cost?",
    answer:
      "Most LinkedIn content tools charge $49 to $199 per month and cap your generations. LinkedGrow starts at $19 per month for Starter with unlimited post generation, or $39 per month for Pro which adds image generation, analytics, and network notifications. The Business plan at $79 per month includes everything in Pro plus carousel generator, A/B testing, team collaboration, advanced analytics, API access, and priority support. With the BYOK model, your AI costs are $2 to $4 per month on average - making the total cost 60 to 80 percent less than competitors.",
  },
  {
    question: "Can I generate unlimited LinkedIn posts with these tools?",
    answer:
      "Yes. Every paid plan on LinkedGrow includes unlimited AI post generation. You bring your own API key from OpenAI, Anthropic, Google, Grok (xAI), Perplexity, or Kimi, and generate as many posts as you need. There are no monthly caps, credit limits, or token restrictions on post generation.",
  },
  {
    question: "Do I need separate tools for writing, images, and scheduling?",
    answer:
      "No. LinkedGrow combines everything into one platform. Write your post with AI, generate a custom photo, schedule it to publish at the optimal time, and track engagement - all from the same dashboard. No switching between tools, no copy-pasting between apps.",
  },
  {
    question: "What AI models power the content creation tools?",
    answer:
      "For text generation, LinkedGrow supports the latest models from OpenAI, Anthropic, Google, xAI, Perplexity, and Kimi - 26+ models in total. For image generation, it supports the latest models from OpenAI, Google, and Replicate - 10+ models in total. You choose which models to use and can switch between them at any time.",
  },
  {
    question: "Is there a free plan available?",
    answer:
      "Yes. LinkedGrow offers a free plan that includes 3 AI post generations per month. Paid plans start at $19 per month for Starter with unlimited generations, scheduling, and a content calendar. The Pro plan at $39 per month adds image generation, analytics, and network notifications. The Business plan at $79 per month includes everything in Pro plus carousel generator, A/B testing, team collaboration, advanced analytics, API access, and priority support.",
  },
  {
    question: "How does the BYOK model work with content creation tools?",
    answer:
      "BYOK stands for Bring Your Own Key. Instead of paying LinkedGrow per generation or being limited to a monthly quota, you connect your own API keys from AI providers like OpenAI or Anthropic. You pay the providers directly at their standard rates with zero markup from LinkedGrow. This keeps your costs low and your generations unlimited.",
  },
  {
    question: "Can I schedule LinkedIn posts with these tools?",
    answer:
      "Yes. The Starter plan includes scheduling up to 10 posts. The Pro and Business plans include unlimited scheduling. You can schedule posts through the content calendar with a visual timeline view, set custom publish times in your timezone, and LinkedGrow publishes directly to your LinkedIn profile or company page.",
  },
];

export default function LinkedinContentCreationToolsPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          {
            name: "LinkedIn Content Creation Tools",
            url: "https://linkedgrow.ai/linkedin-content-creation-tools",
          },
        ]}
      />
      <FAQJsonLd questions={toolsFAQs} />
      <SoftwareApplicationJsonLd
        name="LinkedGrow - LinkedIn Content Creation Tools"
        url="https://linkedgrow.ai/linkedin-content-creation-tools"
        description="All-in-one LinkedIn content creation platform with AI post generator, photo creator, carousel maker, scheduler, and analytics. BYOK model for unlimited generations."
        offers={{ price: "19", priceCurrency: "USD" }}
      />
      <ContentCreationToolsContent />
    </>
  );
}
