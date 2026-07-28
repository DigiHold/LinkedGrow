"use client";

import { V3_ROOT } from "@/components/v3/root";
import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingPainPoints } from "@/components/landing/landing-pain-points";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { LandingBYOK } from "@/components/landing/landing-byok";
import { LandingTestimonials } from "@/components/landing/landing-testimonials";
import { LandingFAQ } from "@/components/landing/landing-faq";
import { LandingCTA } from "@/components/landing/landing-cta";
import { MarketingExitIntentPopup } from "@/components/marketing/exit-intent-popup";
import { LandingRelatedContent } from "@/components/landing/landing-related-content";
import {
  Image,
  Zap,
  CircleDollarSign,
  Eye,
  Clock,
  Palette,
  Target,
  Key,
  AlertTriangle,
  Users,
  Wand2,
  Layers,
  Settings,
  CloudUpload,
  Sparkles,
  Camera,
} from "lucide-react";

export function PhotoGeneratorContent() {
  return (
    <main className={V3_ROOT}>
      <Header />

      <LandingHero
        badge={{ icon: Camera, text: "Free AI Photo Generator" }}
        headline={{
          line1: "Generate free AI photos for",
          gradient: "your LinkedIn posts",
        }}
        descriptionBold="Stop wasting hours searching for the right stock photo."
        description="LinkedGrow's AI photo generator creates unique, professional visuals for your LinkedIn posts in seconds. Choose from 10+ AI models from OpenAI, Google, and Replicate. Describe what you want and the AI delivers. Photos cost pennies each with zero markup."
        valuePropBadges={[
          { icon: Sparkles, text: "10+ AI photo models" },
          { icon: Zap, text: "Generate in seconds" },
          { icon: CircleDollarSign, text: "From $0.02 per photo" },
        ]}
        primaryCta={{ text: "Start generating photos free", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={["Free to sign up", "Everything included", "Cancel anytime"]}
        video={{
          videoId: "5cE1BRvxfiQ",
          thumbnailUrl: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/video-thumbnail-promo.avif",
          duration: "0:10",
          ctaText: "See Pricing",
          ctaHref: "/pricing",
        }}
      />

      <LandingPainPoints
        badge={{ icon: AlertTriangle, text: "The Visual Content Problem" }}
        badgeColor="red"
        headline={{
          text: "LinkedIn posts without visuals are",
          gradient: "invisible in the feed.",
        }}
        descriptionBold="Posts with photos get 2x more engagement than text-only content."
        description="But creating the right visual for every post is a bottleneck. Stock photos feel generic, custom graphics require a designer, and creating your own visuals takes hours you do not have."
        problems={[
          {
            icon: Eye,
            stat: "2x",
            title: "More engagement with photos",
            description:
              "LinkedIn data confirms that posts with visual content receive approximately double the comments and significantly higher impressions. Publishing text-only posts puts you at a measurable disadvantage in the algorithm.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: Clock,
            stat: "25 min",
            title: "Average time finding a stock photo",
            description:
              "Searching through stock libraries for a photo that actually matches your post topic wastes valuable time. Most creators spend 20 to 30 minutes per post just looking for visuals, time that could be spent writing content.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: Palette,
            stat: "Overused",
            title: "Stock photos kill your credibility",
            description:
              "Your audience has seen those stock photos hundreds of times across LinkedIn, blogs, and ads. Using the same handshake photo or lightbulb image signals that you did not invest effort into your content. Custom visuals stand out.",
            color: "from-red-500 to-orange-600",
          },
          {
            icon: Target,
            stat: "$50+",
            title: "Per custom graphic from a designer",
            description:
              "Hiring a freelance designer for LinkedIn post graphics costs $50 to $200 per image with turnaround times of 1 to 3 days. That is not sustainable when you need a fresh visual for every post you publish each week.",
            color: "from-rose-500 to-red-600",
          },
        ]}
        bottomQuote="I know photos boost engagement, but searching for stock images takes longer than writing the actual post..."
      />

      <LandingFeatures
        badge={{ icon: Camera, text: "AI Photo Generator Features" }}
        headline={{
          text: "Everything you need to create",
          gradient: "stunning LinkedIn photos",
        }}
        description="A complete AI photo creation system built into your post editor. Generate, customize, and attach photos to your LinkedIn posts without leaving your workflow."
        features={[
          {
            icon: Layers,
            title: "10+ AI Photo Models",
            description:
              "Choose the best AI model for every photo. OpenAI models excel at creative compositions, FLUX models deliver photorealistic results, and Google models produce fast high-quality output. Switch between models anytime based on what you need.",
            highlights: ["3 AI providers", "10+ models", "Switch anytime"],
            badge: "BYOK",
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: Wand2,
            title: "In-Editor Photo Generation",
            description:
              "The photo generator is built directly into the post editor. Describe the visual you want, pick a model, and generate without leaving your draft. Click attach and your photo is instantly linked to the post.",
            highlights: ["Inline modal", "One-click attach", "No context switching"],
            badge: "Seamless",
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: Settings,
            title: "Custom Resolution and Style",
            description:
              "Configure resolution, aspect ratio, quality, and style for each AI provider. Create square photos for standard posts, landscape for articles, or portrait for mobile-first content. Settings are saved to your profile.",
            highlights: ["Multiple resolutions", "Aspect ratios", "Quality presets"],
            badge: "Customizable",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: Image,
            title: "Professional Quality Output",
            description:
              "Every AI model supported by LinkedGrow produces professional-grade photos suitable for LinkedIn. Whether you need abstract concepts, realistic scenes, data visualizations, or branded visuals - the AI delivers publication-ready results.",
            highlights: ["HD quality", "Professional look", "Publication-ready"],
            badge: "Pro quality",
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: CloudUpload,
            title: "Cloud Storage Included",
            description:
              "Every generated photo is automatically uploaded to Cloudflare R2 and served via a global CDN. Photos load instantly in your LinkedIn posts and stay available as long as your account is active. No storage limits to worry about.",
            highlights: ["Global CDN", "Fast loading", "Persistent storage"],
            badge: "Cloud-hosted",
            color: "from-pink-500 to-rose-500",
          },
          {
            icon: CircleDollarSign,
            title: "Pennies Per Photo",
            description:
              "With the BYOK model, you pay the AI provider directly at their standard rates with zero markup from LinkedGrow. Most photos cost $0.02 to $0.08 each. Generate 20 photos per month for less than $1.50 in total AI costs.",
            highlights: ["Zero markup", "$0.02-0.08 per photo", "Direct provider billing"],
            badge: "$0.02",
            badgeLabel: "per photo",
            color: "from-teal-500 to-cyan-600",
          },
        ]}
        ctaText="Try AI Photo Generation Free"
        ctaHref="/sign-up"
      />

      <LandingHowItWorks
        headline={{
          text: "From idea to LinkedIn photo in",
          gradient: "under 60 seconds",
        }}
        description="Generate and attach professional AI photos without leaving your post editor."
        steps={[
          {
            number: "01",
            title: "Describe the photo you want",
            description:
              "Open the photo generation modal from the post editor and describe your desired visual in plain English. Be specific about the subject, style, mood, and composition. The more detail you provide, the better the AI result.",
            icon: Sparkles,
            color: "from-cyan-500 to-blue-500",
            time: "15 sec",
          },
          {
            number: "02",
            title: "AI generates your photo",
            description:
              "Choose your preferred AI model and hit generate. OpenAI models excel at creative compositions, FLUX models deliver photorealistic photos, and Google models offer fast high-quality output. Preview the result instantly in the editor.",
            icon: Wand2,
            color: "from-violet-500 to-purple-500",
            time: "10-30 sec",
          },
          {
            number: "03",
            title: "Attach to your post and publish",
            description:
              "Click attach to link the AI photo to your LinkedIn post. The photo is uploaded to cloud storage automatically. Then publish directly to LinkedIn, schedule for later, or save as a draft. Your unique visual is ready to stop the scroll.",
            icon: Zap,
            color: "from-emerald-500 to-green-500",
            time: "5 sec",
          },
        ]}
        totalTime="Under 1 minute total"
      />

      <LandingBYOK
        badge={{ icon: Key, text: "Smart Economics" }}
        headline={{
          text: "Why pay for expensive stock photo",
          gradient: "subscriptions?",
        }}
        description="Stock photo subscriptions charge monthly fees for generic content everyone uses. LinkedGrow's BYOK model lets you create unlimited unique AI photos at a fraction of the cost."
        competitor={{
          name: "Stock Photo Subscriptions",
          price: "$13-30/month",
          issues: [
            { text: "Same stock photos used by thousands of LinkedIn creators" },
            { text: "Limited downloads per month on most subscription tiers" },
            { text: "No AI generation - you still search through existing libraries" },
            { text: "Photos never match your specific post topic perfectly" },
            { text: "Canva Pro costs $13 per month and still requires manual design" },
          ],
        }}
        linkedgrow={{
          price: "$99/month",
          apiCost: "$0.50-1.50/month",
          benefits: [
            { text: "Unique AI photos tailored to every single post topic" },
            { text: "10+ models from OpenAI, Google, and Replicate - always the latest" },
            { text: "Built into the editor - generate and attach in one click" },
            { text: "Photo AI costs average $0.50 to $1.50 per month - zero markup" },
            { text: "Custom resolution, aspect ratio, quality, and style settings" },
          ],
        }}
        savingsText="Better photos, lower cost, zero design work"
      />

      <LandingTestimonials
        badge={{ icon: Users, text: "Creator Results" }}
        headline={{
          text: "AI photos are driving",
          gradient: "real LinkedIn engagement",
        }}
        description="LinkedIn creators are using AI-generated photos to stand out in the feed and boost post performance measurably."
        stats={[
          { value: "2x", label: "More engagement with photos", color: "text-cyan-600 dark:text-cyan-400" },
          { value: "10+", label: "AI photo models available", color: "text-emerald-600 dark:text-emerald-400" },
          { value: "< 1 min", label: "From idea to photo", color: "text-violet-600 dark:text-violet-400" },
          { value: "$0.04", label: "Average cost per photo", color: "text-amber-600 dark:text-amber-400" },
        ]}
        testimonials={[
          {
            quote:
              "I used to spend 20 minutes per post searching for stock photos that never matched my topic. Now I describe what I want and the AI creates it in seconds. My engagement rate jumped 40% since switching to custom AI photos for every LinkedIn post.",
            author: "Marco R.",
            role: "Tech Startup Founder, 22K Followers",
          },
          {
            quote:
              "The FLUX models produce incredible photorealistic photos that actually stop the scroll. I generate a unique visual for every post and it costs me less than a dollar per month. People DM me asking who my designer is.",
            author: "Aisha T.",
            role: "Personal Brand Strategist",
          },
          {
            quote:
              "As a solo consultant, I cannot afford a graphic designer. LinkedGrow gives me agency-quality photos for every LinkedIn post. The in-editor workflow is seamless - write my post, generate a photo, and publish in one flow.",
            author: "James L.",
            role: "Management Consultant, 18K Followers",
          },
        ]}
      />

      <LandingFAQ
        headline={{
          text: "AI Photo Generator",
          gradient: "FAQ",
        }}
        description="Everything you need to know about generating free AI photos for LinkedIn"
        faqs={[
          {
            question: "Is the AI LinkedIn photo generator really free?",
            answer:
              "You can sign up for LinkedGrow for free and start generating LinkedIn posts immediately. AI photo generation is available on the Pro plan at $39 per month, but with the BYOK model you only pay the AI provider directly - most photos cost $0.02 to $0.08 each. That means generating 20 photos per month costs less than $1.50 total in AI fees with zero markup from LinkedGrow.",
          },
          {
            question: "What AI models can I use to generate LinkedIn photos?",
            answer:
              "LinkedGrow supports 10+ AI photo generation models across three providers. From OpenAI you get the latest GPT Image models. From Google you get the latest Gemini and Imagen models. From Replicate you get the latest FLUX models. Each model produces different visual styles so you can pick the best one for your content.",
          },
          {
            question: "How do I create a LinkedIn photo with AI?",
            answer:
              "Open the post editor in LinkedGrow and click the image generation button. Describe the photo you want in plain English - for example, a professional workspace with analytics charts on a laptop screen. Choose your preferred AI model, hit generate, and the photo appears in seconds. Click attach to link it to your post.",
          },
          {
            question: "Do LinkedIn posts with custom photos perform better?",
            answer:
              "Yes. LinkedIn data shows that posts with images receive approximately 2x more comments and significantly higher impressions than text-only posts. Custom AI photos outperform stock images because they are unique and directly relevant to your topic.",
          },
          {
            question: "How is this different from Canva or stock photo sites?",
            answer:
              "Stock photo sites and Canva give you the same images everyone else uses. AI photo generation creates completely unique visuals tailored to your specific post topic. Instead of searching through millions of generic photos, you describe what you want and the AI creates it in seconds.",
          },
          {
            question: "What does BYOK mean for photo generation costs?",
            answer:
              "BYOK stands for Bring Your Own Key. You connect your own API key from OpenAI, Google, or Replicate and pay the provider directly at their standard rates. LinkedGrow adds zero markup. Most photos cost $0.02 to $0.08 each, and most users spend less than $1.50 per month total.",
          },
          {
            question: "Can I customize the resolution and style?",
            answer:
              "Yes. Each provider offers different customization options. OpenAI lets you set resolution, quality, and style. Google models offer resolution and aspect ratio controls. Replicate FLUX models support resolution and aspect ratio settings. Preferences are saved to your profile.",
          },
          {
            question: "Where are the generated photos stored?",
            answer:
              "Every photo is automatically uploaded to Cloudflare R2 cloud storage and served via a global CDN. Photos load instantly when your LinkedIn post is published and remain available as long as your account is active.",
          },
        ]}
      />

      <LandingRelatedContent
        headline="Related Resources"
        links={[
          { title: "AI Image Generation", href: "/features/ai-image-generation" },
          { title: "LinkedIn Image Sizes", href: "/free-tools/linkedin-image-sizes" },
        ]}
      />

      <LandingCTA
        badge="Start Creating AI Photos for LinkedIn"
        headline={{
          line1: "Ready to make your LinkedIn posts",
          gradient: "impossible to scroll past?",
        }}
        description="Stop using generic stock photos that blend into the feed. Start generating unique AI photos that grab attention and drive engagement on every post you publish."
        primaryCta={{ text: "Start free for 7 days", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={[
          "Free to sign up",
          "10+ AI photo models",
          "Cancel anytime",
          "Your API key, your costs",
        ]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
