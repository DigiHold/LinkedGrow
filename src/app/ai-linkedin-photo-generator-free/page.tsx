import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { PhotoGeneratorContent } from "./photo-generator-content";

export const metadata: Metadata = {
  title: "AI LinkedIn Photo Generator: Create Free Post Visuals",
  description:
    "Generate professional LinkedIn post visuals with AI for free. 10+ image models from OpenAI, Google, and Replicate. Unique visuals in seconds.",
  openGraph: {
    title: "AI LinkedIn Photo Generator: Create Free Post Visuals",
    description:
      "Generate professional LinkedIn post visuals with AI for free. 10+ image models from OpenAI, Google, and Replicate. Unique visuals in seconds.",
    url: "https://linkedgrow.ai/ai-linkedin-photo-generator-free",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow - AI LinkedIn Photo Generator Free",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI LinkedIn Photo Generator: Create Free Post Visuals",
    description:
      "Generate professional LinkedIn post visuals with AI for free. 10+ image models from OpenAI, Google, and Replicate. Unique visuals in seconds.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/ai-linkedin-photo-generator-free",
  },
};

const photoGenFAQs = [
  {
    question: "Is the AI LinkedIn photo generator really free?",
    answer:
      "You can sign up for LinkedGrow for free and start generating LinkedIn posts immediately. AI photo generation is available on the Pro plan at $99 per month, but with the BYOK model you only pay the AI provider directly - most photos cost $0.02 to $0.08 each. That means generating 20 photos per month costs less than $1.50 total in AI fees with zero markup from LinkedGrow.",
  },
  {
    question: "What AI models can I use to generate LinkedIn photos?",
    answer:
      "LinkedGrow supports 10+ AI photo generation models across three providers. From OpenAI you get the latest GPT Image models. From Google you get the latest Gemini and Imagen models. From Replicate you get the latest FLUX models. Each model produces different visual styles so you can pick the best one for your content.",
  },
  {
    question: "How do I create a LinkedIn photo with AI?",
    answer:
      "Open the post editor in LinkedGrow and click the image generation button. Describe the photo you want in plain English - for example, a professional workspace with a laptop showing analytics charts. Choose your preferred AI model, hit generate, and the photo appears in seconds. Click attach to link it directly to your post draft.",
  },
  {
    question: "Do LinkedIn posts with custom photos perform better?",
    answer:
      "Yes. LinkedIn data shows that posts with images receive approximately 2x more comments and significantly higher impressions than text-only posts. Custom AI-generated photos outperform stock images because they are unique and directly relevant to your specific topic. Your audience scrolls past stock photos they have seen hundreds of times but stops for original visuals.",
  },
  {
    question: "Can I customize the resolution and style of generated photos?",
    answer:
      "Yes. Each AI provider offers different customization options. OpenAI lets you set resolution, quality (standard or HD), and style (natural or vivid). Google models offer resolution and aspect ratio controls. Replicate FLUX models support resolution and aspect ratio settings. All your preferences are saved to your profile automatically.",
  },
  {
    question: "How is this different from Canva or stock photo sites?",
    answer:
      "Stock photo sites and Canva give you the same images everyone else uses. AI photo generation creates completely unique visuals tailored to your specific post topic. Instead of searching through millions of generic photos hoping to find something close enough, you describe exactly what you want and the AI creates it in seconds. No design skills required.",
  },
  {
    question: "What does BYOK mean for photo generation costs?",
    answer:
      "BYOK stands for Bring Your Own Key. You connect your own API key from OpenAI, Google, or Replicate and pay the provider directly at their standard rates. LinkedGrow adds zero markup. Most photos cost $0.02 to $0.08 each depending on the model and provider. Most users spend less than $1.50 per month on photo generation.",
  },
  {
    question: "Where are the generated photos stored?",
    answer:
      "Every photo you generate is automatically uploaded to Cloudflare R2 cloud storage and served via a global CDN. Photos load instantly when your LinkedIn post is published and remain available as long as your LinkedGrow account is active. You do not need to manage any file storage yourself.",
  },
];

export default function AiLinkedinPhotoGeneratorFreePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          {
            name: "AI LinkedIn Photo Generator Free",
            url: "https://linkedgrow.ai/ai-linkedin-photo-generator-free",
          },
        ]}
      />
      <FAQJsonLd questions={photoGenFAQs} />
      <SoftwareApplicationJsonLd
        name="LinkedGrow AI Photo Generator for LinkedIn"
        url="https://linkedgrow.ai/ai-linkedin-photo-generator-free"
        description="Generate professional AI photos for LinkedIn posts. 10+ AI image models from OpenAI, Google, and Replicate. Create unique visuals in seconds with BYOK pricing."
        offers={{ price: "0", priceCurrency: "USD" }}
      />
      <PhotoGeneratorContent />
    </>
  );
}
