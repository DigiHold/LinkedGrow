"use client";

import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";
import { AnimatedBackground } from "@/components/marketing/animated-background";
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
  Sparkles,
  CircleDollarSign,
  Key,
  AlertTriangle,
  Users,
  Brain,
  Mic,
  Bot,
  Lock,
  Layers,
  Type,
  GitCompare,
  Settings,
} from "lucide-react";

export function ContentCreationAiContent() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <AnimatedBackground />
      <Header />

      <LandingHero
        badge={{ icon: Brain, text: "26 Models, One Voice" }}
        headline={{
          line1: "LinkedIn content creation AI",
          gradient: "with 26 models + voice training",
        }}
        descriptionBold="The AI engine behind LinkedGrow: 26 text models, voice training, BYOK pricing."
        description="Most LinkedIn AI tools lock you into one model with one writing style. LinkedGrow connects you to 26 frontier models from OpenAI, Anthropic, Google, Grok, Perplexity, and Kimi, then trains a voice fingerprint from your own posts so every model writes in your cadence - not the generic default."
        valuePropBadges={[
          { icon: Bot, text: "6 AI providers" },
          { icon: Mic, text: "Voice fingerprint" },
          { icon: Key, text: "BYOK, zero markup" },
        ]}
        primaryCta={{ text: "Try the AI free", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={["7-day Pro trial", "Cancel any time", "All 26 models on trial"]}
        video={{
          videoId: "5cE1BRvxfiQ",
          thumbnailUrl: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/video-thumbnail-promo.avif",
          duration: "0:10",
          ctaText: "See Pricing",
          ctaHref: "/pricing",
        }}
      />

      <LandingPainPoints
        badge={{ icon: AlertTriangle, text: "The Single-Model AI Problem" }}
        badgeColor="red"
        headline={{
          text: "One AI model cannot write",
          gradient: "every kind of post well.",
        }}
        descriptionBold="The model that nails your story posts is rarely the one that nails your data posts."
        description="Most LinkedIn AI tools pick one model and hide it from you. That works until your content needs vary. A narrative anecdote, a benchmark teardown, and a hot-take react each have a model that does them better. Locking you into one is a tooling decision, not a quality decision."
        problems={[
          {
            icon: Lock,
            stat: "1",
            title: "Hidden AI model on most tools",
            description:
              "You do not know if the tool is using GPT, Claude, or something cheaper. You cannot switch models when one style stops working for you. You are stuck with whatever the vendor negotiated cheapest token rates for.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: Mic,
            stat: "0",
            title: "Voice fingerprinting on capped tools",
            description:
              "Generic LinkedIn AI tools use a templated system prompt and feed your topic into it. There is no voice analysis pass. The output reads the same whether you are a CEO, a developer, or a recruiter. Your audience spots it in two seconds.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: CircleDollarSign,
            stat: "3-10x",
            title: "Token markup over provider rates",
            description:
              "Most capped tools charge $49 to $199 per month and resell tokens at 3 to 10 times what providers actually charge. You pay for the markup, the cap, and the lack of model choice all in one bill.",
            color: "from-red-500 to-orange-600",
          },
          {
            icon: Type,
            stat: "Generic",
            title: "Sentence cadence shared by all users",
            description:
              "If a tool has no voice training pass, every user gets the model's default sentence rhythm. That cadence is the single biggest signal that separates AI from human posts. Your audience has read that exact rhythm on a hundred other accounts.",
            color: "from-rose-500 to-red-600",
          },
        ]}
        bottomQuote="My old LinkedIn AI tool wrote every post like the same writer was behind it, and that writer was clearly not me..."
      />

      <LandingFeatures
        badge={{ icon: Brain, text: "What Makes the AI Engine Different" }}
        headline={{
          text: "Five pieces working together",
          gradient: "to write LinkedIn posts in your voice",
        }}
        description="LinkedGrow is not a single-model wrapper. It is a model-routing layer plus a voice-fingerprint layer, both running on your own API key. Here is what each layer does."
        features={[
          {
            icon: Bot,
            title: "26 text models from 6 providers",
            description:
              "GPT 5.2, GPT 5, Claude Opus 4.7, Claude Sonnet 4.6, Gemini 3 Pro, Gemini 3 Flash, Grok 4.1, Perplexity Sonar Reasoning Pro, Kimi K2.5, and 17 more. Always latest versions. Switch per draft - no contract lock-in to any provider.",
            highlights: ["OpenAI + Anthropic + Google", "Grok + Perplexity + Kimi", "Always latest versions"],
            badge: "BYOK",
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: Mic,
            title: "Voice fingerprint from 5 sample posts",
            description:
              "Paste up to 5 of your strongest LinkedIn posts. The AI extracts your sentence length distribution, opener patterns, vocabulary preferences, and paragraph density. Every subsequent draft starts from that fingerprint instead of from the model default.",
            highlights: ["Style analysis pass", "Cadence matching", "Reused on every draft"],
            badge: "Core",
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: GitCompare,
            title: "Per-draft model switching",
            description:
              "Draft a story-style post with Claude Opus 4.7. Switch to Gemini 3 Pro for the benchmark teardown. Use GPT 5.2 for the analytical post next week. Every generation lets you pick the model that fits the content type without leaving the editor.",
            highlights: ["Same editor", "Same voice fingerprint", "Different model per draft"],
            badge: "Routing",
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: Settings,
            title: "Audience and tone calibration",
            description:
              "Set who reads you - founders, recruiters, marketers, engineers - and the AI adjusts jargon, reference density, and register accordingly. Override per post if you are publishing to a different audience that week.",
            highlights: ["Audience profile", "Tone presets", "Per-post override"],
            badge: "Setting",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: Layers,
            title: "Image AI with 10 models",
            description:
              "Nano Banana Pro (Gemini 3 Pro Image), Nano Banana, Imagen 4 Ultra, GPT Image 1.5, FLUX 1.1 Pro Ultra, FLUX 2 Pro, and more. Generate post visuals from a prompt in the same editor. Pro plan and above. Typical cost $0.02 to $0.08 per image.",
            highlights: ["Google + OpenAI + Replicate", "$0.02-0.08 typical", "Pro+ plan"],
            badge: "Pro",
            color: "from-pink-500 to-rose-500",
          },
          {
            icon: Key,
            title: "BYOK with zero markup",
            description:
              "You connect your API keys from the providers you want to use. LinkedGrow never proxies tokens or marks up pricing. You pay the providers their list rates directly. Most users spend $2 to $4 per month even with daily writing.",
            highlights: ["Zero markup", "$2 to $4 typical", "Keys stored encrypted"],
            badge: "Pricing",
            color: "from-teal-500 to-cyan-600",
          },
        ]}
        ctaText="Test the AI free"
        ctaHref="/sign-up"
      />

      <LandingHowItWorks
        headline={{
          text: "How the AI engine writes a post in",
          gradient: "your voice",
        }}
        description="Three layers run before any draft is produced. Voice fingerprint, model routing, and audience calibration."
        steps={[
          {
            number: "01",
            title: "Voice fingerprint pass",
            description:
              "Paste 3 to 5 of your strongest LinkedIn posts once. The AI runs a style analysis - sentence length distribution, opener cadence, vocabulary preferences, paragraph density. The fingerprint lives on your account and is fed into every subsequent draft.",
            icon: Mic,
            color: "from-cyan-500 to-blue-500",
            time: "Once",
          },
          {
            number: "02",
            title: "Pick the model that fits",
            description:
              "For each post, pick the model that suits the content type. Narrative and story posts tend to favor Claude Opus 4.7. Analytical or data posts favor GPT 5.2 or Gemini 3 Pro. Research-style takes lean on Perplexity Sonar Reasoning Pro. You decide per draft.",
            icon: GitCompare,
            color: "from-violet-500 to-purple-500",
            time: "Per draft",
          },
          {
            number: "03",
            title: "Brief, generate, refine",
            description:
              "Enter your topic, set tone and audience overrides if needed, and the AI combines your fingerprint with the selected model to produce a draft. Refine sections in the editor, regenerate paragraphs, or swap the hook. Publish or schedule when ready.",
            icon: Brain,
            color: "from-emerald-500 to-green-500",
            time: "2 to 5 min",
          },
        ]}
        totalTime="Under 5 minutes per post"
      />

      <LandingBYOK
        badge={{ icon: Key, text: "BYOK Economics Explained" }}
        headline={{
          text: "Why bringing your own AI key",
          gradient: "beats capped resellers",
        }}
        description="Most LinkedIn AI tools resell tokens at 3 to 10 times what providers charge, then cap your monthly usage on top. BYOK flips the model - you pay providers directly and LinkedGrow charges only for the platform."
        competitor={{
          name: "Capped Token-Reseller AI Tools",
          price: "$49 to $199/month",
          issues: [
            { text: "Single hidden AI model with no per-draft choice" },
            { text: "30 to 100 post generation cap per month" },
            { text: "3x to 10x markup on token costs baked into the subscription" },
            { text: "No voice fingerprint - templated prompt only" },
            { text: "Overage fees when you exceed the monthly cap" },
          ],
        }}
        linkedgrow={{
          price: "$99/month",
          apiCost: "$2 to $4/month BYOK",
          benefits: [
            { text: "26 frontier models switchable per draft" },
            { text: "Unlimited drafts on every paid plan" },
            { text: "Zero markup on tokens - you pay providers directly at list rates" },
            { text: "Voice fingerprint runs on every draft you generate" },
            { text: "Cancel anytime - keys stay yours" },
          ],
        }}
        savingsText="Most users spend $2 to $4 per month on BYOK costs even when writing daily"
      />

      <LandingTestimonials
        badge={{ icon: Users, text: "Creators Who Switched Models" }}
        headline={{
          text: "What changes when the AI",
          gradient: "actually fits your voice",
        }}
        description="LinkedGrow users describe the difference voice fingerprinting plus per-draft model choice makes once they start using it."
        stats={[
          { value: "26", label: "Text models accessible", color: "text-cyan-600 dark:text-cyan-400" },
          { value: "6", label: "AI providers supported", color: "text-emerald-600 dark:text-emerald-400" },
          { value: "$2-4", label: "Typical monthly AI spend", color: "text-violet-600 dark:text-violet-400" },
          { value: "0%", label: "LinkedGrow markup on tokens", color: "text-amber-600 dark:text-amber-400" },
        ]}
        testimonials={[
          {
            quote:
              "I went from posting once a month to 4 times per week. The voice training is what sold me - every AI post genuinely sounds like something I would write. My engagement tripled and I have landed 3 new consulting clients directly from LinkedIn.",
            author: "Michael T.",
            role: "Strategy Consultant, 42K Followers",
          },
          {
            quote:
              "Having 26+ models to choose from is a game changer. I use Claude for thought leadership pieces and ChatGPT for storytelling posts. Different models, different strengths. And my total AI cost last month was $3.20.",
            author: "Priya S.",
            role: "Tech Founder, 19K Followers",
          },
          {
            quote:
              "The integrated workflow is what makes this special. I generate a post, create a matching photo, schedule it for tomorrow, all in under 3 minutes without leaving the dashboard. No other tool does this at this price.",
            author: "Chris W.",
            role: "Sales Director, 25K Followers",
          },
        ]}
      />

      <LandingFAQ
        headline={{
          text: "LinkedIn AI Engine",
          gradient: "FAQ",
        }}
        description="Common questions about the AI engine, model choice, voice training, and BYOK"
        faqs={[
          {
            question: "What AI models does LinkedGrow use for LinkedIn content creation?",
            answer:
              "LinkedGrow supports 26+ AI text models from OpenAI, Anthropic, Google, xAI, Perplexity, and Kimi (Moonshot AI) - always the latest versions available. For image generation it supports 10+ models from OpenAI, Google, and Replicate. You choose which model to use for each generation.",
          },
          {
            question: "Why does model choice matter for LinkedIn content?",
            answer:
              "Different models have different writing strengths. Claude Opus 4.7 tends to handle narrative and story posts better. GPT 5.2 is strong on analytical and data-driven takes. Gemini 3 Pro is good for research-style content. Perplexity Sonar Reasoning Pro is the pick when you want sourced reasoning. Locking into one model means accepting its weakness on the post types it does not nail.",
          },
          {
            question: "How does voice training capture my sentence rhythm?",
            answer:
              "When you paste 3 to 5 sample posts, the AI runs a style analysis pass. It extracts your sentence length distribution, opener patterns, vocabulary preferences, paragraph density, and rhetorical habits. That fingerprint is stored on your account and fed into every draft prompt - independently of the model you select.",
          },
          {
            question: "Will AI-generated LinkedIn content sound like me?",
            answer:
              "Yes, if you train your voice. Voice training analyzes your past LinkedIn posts to learn your writing style, vocabulary, and tone. Every AI-generated post matches your voice so your audience cannot tell the difference between your manually written posts and AI-assisted ones.",
          },
          {
            question: "What is BYOK and why does it lower my cost so much?",
            answer:
              "BYOK means Bring Your Own Key. You connect your own API key from OpenAI, Anthropic, Google, Grok, Perplexity, or Kimi. LinkedGrow does not proxy tokens or mark up pricing. You pay the AI provider their list rates directly. Most users spend $2 to $4 per month even with daily writing - compared to $49 to $199 with capped resellers.",
          },
          {
            question: "How much does the AI engine cost in total?",
            answer:
              "LinkedGrow plans start at $13/mo for Starter with unlimited post generation. AI provider costs average $2 to $4/month with BYOK. That is 60 to 80 percent less than typical LinkedIn tools that charge $49 to $199/month with generation caps.",
          },
          {
            question: "Can the AI engine also generate images and carousels?",
            answer:
              "Yes. The Pro plan includes AI image generation with 10+ models from Google, OpenAI, and Replicate. The Business plan adds carousel creation. Generate visuals from text in the same editor and attach to your scheduled posts.",
          },
          {
            question: "Is AI content creation allowed on LinkedIn?",
            answer:
              "Yes. LinkedIn allows AI-assisted content creation. The key is that your content should provide genuine value and reflect your professional expertise. Voice training ensures your AI-generated posts maintain your authentic voice.",
          },
          {
            question: "How many LinkedIn posts can I generate with AI?",
            answer:
              "Unlimited on the 7-day Pro trial and on all paid plans. No caps, no credit limits, no token restrictions. With BYOK you generate as much as you want and pay the AI provider a few cents per post.",
          },
        ]}
      />

      <LandingRelatedContent
        headline="Related Resources"
        links={[
          { title: "LinkedIn Marketing Tool", href: "/linkedin-marketing-tool" },
          { title: "Voice Training", href: "/features/voice-training" },
          { title: "AI LinkedIn Posts Without Sounding Robotic", href: "/blog/ai-linkedin-posts-without-sounding-robotic" },
        ]}
      />

      <LandingCTA
        badge="Test 26 AI Models on Your LinkedIn Content"
        headline={{
          line1: "Ready to pick the AI model",
          gradient: "that fits your voice?",
        }}
        description="Train your voice fingerprint, switch between 26 frontier models per draft, and pay providers directly with zero markup. 7-day Pro trial, cancel any time."
        primaryCta={{ text: "Start free for 7 days", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={[
          "7-day Pro trial",
          "26 AI models",
          "Voice training included",
          "BYOK, zero markup",
        ]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
