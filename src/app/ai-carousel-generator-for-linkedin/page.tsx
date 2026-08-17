import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { CarouselGeneratorContent } from "./carousel-content";

export const metadata: Metadata = {
  title: "LinkedIn Carousel Maker: AI Builds Multi-Slide Posts Fast",
  description:
    "AI-generated LinkedIn carousel posts with text per slide, brand customization, and direct publishing. Builds multi-slide posts in minutes.",
  openGraph: {
    title: "LinkedIn Carousel Maker: AI Builds Multi-Slide Posts Fast",
    description:
      "AI-generated LinkedIn carousel posts with text per slide, brand customization, and direct publishing. Builds multi-slide posts in minutes.",
    url: "https://linkedgrow.ai/ai-carousel-generator-for-linkedin",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og/ai-carousel-generator-for-linkedin.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow - AI Carousel Generator for LinkedIn",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkedIn Carousel Maker: AI Builds Multi-Slide Posts Fast",
    description:
      "AI-generated LinkedIn carousel posts with text per slide, brand customization, and direct publishing. Builds multi-slide posts in minutes.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og/ai-carousel-generator-for-linkedin.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/ai-carousel-generator-for-linkedin",
  },
};

const carouselFAQs = [
  {
    question: "How does the AI carousel generator for LinkedIn work?",
    answer:
      "Enter your topic or key points and the AI generates a complete multi-slide carousel with headlines, body text, and call-to-action slides. Customize each slide with your brand colors, fonts, and logo. Export as a PDF and publish directly to LinkedIn or schedule for later.",
  },
  {
    question: "Do LinkedIn carousels actually get more engagement?",
    answer:
      "Yes. LinkedIn carousels (document posts) receive approximately 2x more clicks than standard image posts and significantly higher dwell time. The swipeable format encourages users to spend more time with your content, which signals high quality to the algorithm and increases your reach.",
  },
  {
    question: "What AI features does the carousel builder include?",
    answer:
      "The AI assists with content generation for each slide, suggests optimal slide counts, creates compelling headlines and call-to-action copy, and can generate visual elements. You provide the topic and the AI structures the content into a swipeable carousel format optimized for LinkedIn engagement.",
  },
  {
    question: "Can I customize the carousel design with my brand?",
    answer:
      "Yes. Upload your logo, set your brand colors (primary and secondary), choose fonts, and customize the layout of each slide. Your brand settings are saved to your profile so every carousel you create maintains consistent visual identity.",
  },
  {
    question: "How many slides should a LinkedIn carousel have?",
    answer:
      "The optimal length is 8 to 12 slides. Research shows that carousels with fewer than 6 slides underperform because there is not enough content to build momentum, while carousels over 15 slides see higher drop-off rates. The AI suggests an optimal slide count based on your topic complexity.",
  },
  {
    question: "Which plan includes the AI carousel generator?",
    answer:
      "The carousel generator is available on the Business plan at $179 per month. This plan also includes A/B testing, team collaboration, advanced analytics, API access, and priority support. The Pro plan at $99 per month includes post generation and image generation but not carousel creation.",
  },
  {
    question: "Can I schedule carousels to publish to LinkedIn?",
    answer:
      "Yes. After creating your carousel, you can publish it directly to your LinkedIn profile or company page, or schedule it for a specific date and time using the content calendar. The Business plan includes unlimited scheduling.",
  },
  {
    question: "What format are the exported carousels?",
    answer:
      "Carousels are exported as PDF documents, which is the format LinkedIn uses for carousel posts. Each slide becomes a page in the PDF. The export is optimized for LinkedIn's recommended dimensions and file size limits.",
  },
];

export default function AiCarouselGeneratorForLinkedinPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          {
            name: "AI Carousel Generator for LinkedIn",
            url: "https://linkedgrow.ai/ai-carousel-generator-for-linkedin",
          },
        ]}
      />
      <FAQJsonLd questions={carouselFAQs} />
      <SoftwareApplicationJsonLd
        name="LinkedGrow AI Carousel Generator for LinkedIn"
        url="https://linkedgrow.ai/ai-carousel-generator-for-linkedin"
        description="Create AI-powered LinkedIn carousels that get 2x more clicks. Multi-slide builder with AI content assist, brand customization, and direct publishing to LinkedIn."
        offers={{ price: "79", priceCurrency: "USD" }}
      />
      <CarouselGeneratorContent />
    </>
  );
}
