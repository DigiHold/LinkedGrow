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
  Zap,
  Clock,
  Key,
  AlertTriangle,
  Users,
  Brain,
  Mic,
  PenTool,
  Type,
  MessageSquare,
  CreditCard,
} from "lucide-react";

export function FreePostGeneratorContent() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <AnimatedBackground />
      <Header />

      <LandingHero
        badge={{ icon: PenTool, text: "AI Writer for LinkedIn" }}
        headline={{
          line1: "Free AI LinkedIn post writer",
          gradient: "trained on your voice",
        }}
        descriptionBold="An AI writer that captures your sentence rhythm, vocabulary, and tone."
        description="LinkedGrow is not just a post generator. It is an AI writer that studies how you write before it writes for you. Paste 3 to 5 of your best posts, pick one of 26 AI models from OpenAI, Anthropic, Google, Grok, Perplexity, or Kimi, and the writer produces drafts your audience cannot tell apart from your manual ones. 7-day Pro trial, no credit card."
        valuePropBadges={[
          { icon: Mic, text: "Voice-matched writing" },
          { icon: Brain, text: "26 AI models" },
          { icon: Key, text: "BYOK pricing" },
        ]}
        primaryCta={{ text: "Start writing free", href: "/sign-up" }}
        secondaryCta={{ text: "See all plans", href: "/pricing" }}
        trustIndicators={["7-day Pro trial", "No credit card", "All 26 models included"]}
        video={{
          videoId: "5cE1BRvxfiQ",
          thumbnailUrl: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/video-thumbnail-promo.avif",
          duration: "0:10",
          ctaText: "See Pricing",
          ctaHref: "/pricing",
        }}
      />

      <LandingPainPoints
        badge={{ icon: AlertTriangle, text: "Why AI Writing Sounds Like AI" }}
        badgeColor="red"
        headline={{
          text: "Most AI writers ignore",
          gradient: "how you actually write.",
        }}
        descriptionBold="Generic AI output kills your LinkedIn credibility."
        description="LinkedIn readers spot AI-written posts in two seconds. The reason is simple. Most tools feed your topic into a single model with a templated prompt and ship the first draft. No voice analysis, no rhythm matching, no tone calibration. The result is content that reads like every other post in your feed."
        problems={[
          {
            icon: Mic,
            stat: "0",
            title: "Tools that study your writing voice",
            description:
              "Free generators take your topic and produce one of a few templated patterns. There is no voice analysis step. Whether you write in short punchy lines or long flowing paragraphs, the output looks identical to what everyone else gets.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: Type,
            stat: "Same",
            title: "Sentence rhythm and structure for every user",
            description:
              "Most AI writing tools rely on the model's default cadence. Three-sentence intro, bullet list, conclusion question. Your audience has read that exact structure on twenty other posts this week. There is no signal that you wrote it.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: Brain,
            stat: "1",
            title: "AI model option on most generators",
            description:
              "Most free LinkedIn writers lock you into one model. If that model produces flat output for your industry, you have no recourse. Different models have very different writing styles. The writer should choose, not the tool builder.",
            color: "from-red-500 to-orange-600",
          },
          {
            icon: MessageSquare,
            stat: "Generic",
            title: "Tone with no audience awareness",
            description:
              "Free writers default to one register, usually mid-corporate. They do not know if your audience is founders, recruiters, or developers. The same topic written for a CTO crowd should not read the same as one written for HR leaders. Most tools ignore this entirely.",
            color: "from-rose-500 to-red-600",
          },
        ]}
        bottomQuote="The AI posts I generated last quarter all sounded like the same person wrote them, and that person was not me..."
      />

      <LandingFeatures
        badge={{ icon: PenTool, text: "Built to Write, Not Just Generate" }}
        headline={{
          text: "An AI writer that learns",
          gradient: "your voice first",
        }}
        description="LinkedGrow runs a voice training pass before any post is written. Paste your samples once, calibrate tone and audience, and every draft after that starts from your style fingerprint - not a generic prompt."
        features={[
          {
            icon: Mic,
            title: "Voice training from sample posts",
            description:
              "Paste up to 5 of your strongest LinkedIn posts. The writer extracts your sentence length distribution, vocabulary preferences, opener patterns, and rhetorical habits. Every subsequent draft is grounded in that fingerprint, not in the model's default cadence.",
            highlights: ["5 sample posts max", "Style fingerprint extracted", "Reused on every draft"],
            badge: "Core",
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: Brain,
            title: "26 AI models to write with",
            description:
              "Switch the writer's underlying model on every draft. GPT 5.2 for analytical posts, Claude Opus 4.7 for narrative-heavy ones, Gemini 3 Pro for research-style takes. Different models write differently and you get to pick.",
            highlights: ["6 providers supported", "Switch per draft", "Always latest versions"],
            badge: "BYOK",
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: MessageSquare,
            title: "Tone and audience calibration",
            description:
              "Configure who reads you - founders, recruiters, marketers, engineers - and which register you want. The writer adjusts vocabulary, jargon level, and reference density to match. Same topic, different audience, different post.",
            highlights: ["Audience profile field", "Tone presets", "Per-post overrides"],
            badge: "Setting",
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: Type,
            title: "Sentence rhythm matching",
            description:
              "The writer reproduces your sentence-length variation. If your samples open with a 6-word line then a 25-word line, the AI does the same. This is the single biggest signal that separates AI-written from human-written posts.",
            highlights: ["Length variation", "Opener cadence", "Paragraph density"],
            badge: "Built-in",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: PenTool,
            title: "Edit and refine loop",
            description:
              "A real writer does not ship the first draft. The editor lets you regenerate sections, tighten lines, swap hooks, or rewrite paragraphs in a different tone. The writer revises with full context of what you already changed.",
            highlights: ["Section regenerate", "Tighten or expand", "Hook swap"],
            badge: "Workflow",
            color: "from-pink-500 to-rose-500",
          },
          {
            icon: Key,
            title: "BYOK keeps writing affordable",
            description:
              "You bring your own API key from OpenAI, Anthropic, Google, Grok, Perplexity, or Kimi. LinkedGrow takes zero markup. Most users spend $2 to $4 per month on AI costs, even with daily writing.",
            highlights: ["Zero markup", "$2 to $4 typical", "Cancel anytime"],
            badge: "Pricing",
            color: "from-teal-500 to-cyan-600",
          },
        ]}
        ctaText="Train your voice free"
        ctaHref="/sign-up"
      />

      <LandingHowItWorks
        headline={{
          text: "From sample posts to first draft in",
          gradient: "under 5 minutes",
        }}
        description="Voice training is the first step, not an upsell. Set it up once and every post the writer produces is grounded in your style."
        steps={[
          {
            number: "01",
            title: "Paste 3 to 5 sample posts",
            description:
              "Pick your strongest LinkedIn posts - the ones that already sound like you on a good day. Paste them into the voice training field. The writer extracts your style fingerprint in a single pass and stores it on your account.",
            icon: Mic,
            color: "from-cyan-500 to-blue-500",
            time: "2 min",
          },
          {
            number: "02",
            title: "Brief the writer on the post",
            description:
              "Enter a topic or rough idea, pick a post type, select your preferred AI model from 26 options, and choose a tone. The writer combines this brief with your voice fingerprint and audience profile to produce a draft that reads like you wrote it.",
            icon: Brain,
            color: "from-violet-500 to-purple-500",
            time: "2 min",
          },
          {
            number: "03",
            title: "Refine and publish",
            description:
              "Open the draft in the editor. Regenerate sections, swap hooks, tighten phrasing. When you are happy, publish directly to LinkedIn or save the draft for later. Voice training improves every time you mark a post as approved.",
            icon: PenTool,
            color: "from-emerald-500 to-green-500",
            time: "1 min",
          },
        ]}
        totalTime="Under 5 minutes total"
      />

      <LandingBYOK
        badge={{ icon: Key, text: "Why BYOK Beats Capped Writers" }}
        headline={{
          text: "Other AI writers charge per word.",
          gradient: "We charge per month.",
        }}
        description="Most LinkedIn writing tools meter your output. You get 30 to 100 posts per month, then a paywall. LinkedGrow uses BYOK so the writer can produce as many drafts as you want, with no token caps."
        competitor={{
          name: "Capped AI LinkedIn Writers",
          price: "$49 to $199/month",
          issues: [
            { text: "Single AI model with no per-post switching" },
            { text: "No voice training - templated prompts only" },
            { text: "30 to 100 post cap per month, even on paid plans" },
            { text: "Output reads like the same writer no matter who uses it" },
            { text: "Token markup of 3x to 10x over provider rates" },
          ],
        }}
        linkedgrow={{
          price: "$13/mo billed yearly",
          apiCost: "$2 to $4/month BYOK",
          benefits: [
            { text: "7-day Pro trial with full Pro access - no card required" },
            { text: "26 AI models switchable on every draft" },
            { text: "Voice training included on the trial" },
            { text: "Unlimited drafts on every paid plan after the trial" },
            { text: "BYOK with zero markup - pay providers directly" },
          ],
        }}
        savingsText="Unlimited drafts in your voice, for less than the cost of one capped competitor seat"
      />

      <LandingTestimonials
        badge={{ icon: Users, text: "Writers Who Found Their Voice" }}
        headline={{
          text: "AI posts that finally",
          gradient: "sound like them",
        }}
        description="LinkedGrow users describe the difference voice training makes the first time the writer hands them a draft."
        stats={[
          { value: "26", label: "AI models on trial", color: "text-cyan-600 dark:text-cyan-400" },
          { value: "5", label: "Sample posts for voice training", color: "text-emerald-600 dark:text-emerald-400" },
          { value: "$0", label: "Cost to start writing", color: "text-violet-600 dark:text-violet-400" },
          { value: "$2-4", label: "Typical monthly AI spend", color: "text-amber-600 dark:text-amber-400" },
        ]}
        testimonials={[
          {
            quote:
              "I tried several free LinkedIn generators before LinkedGrow. The others used outdated AI and had no voice training. LinkedGrow's 7-day Pro trial gave me the latest models, voice matching, and posts that actually sounded like me. Upgraded to Starter the same week.",
            author: "Nina R.",
            role: "Freelance Consultant, 4K Followers",
          },
          {
            quote:
              "The 7-day Pro trial was enough to prove the concept. I generated a week of posts, trained my voice, and published them to LinkedIn. The engagement was noticeably better than my manually written posts. Now I use the Starter plan and post 4 times per week.",
            author: "Marcus W.",
            role: "Product Manager, 9K Followers",
          },
          {
            quote:
              "As a student, I could not afford $49 per month for a LinkedIn tool. LinkedGrow's 7-day Pro trial let me start building my professional presence with AI-generated posts. When I got my first job, I upgraded to Starter at $19. Best LinkedIn investment I have made.",
            author: "Jessica L.",
            role: "Recent Graduate, 2K Followers",
          },
        ]}
      />

      <LandingFAQ
        headline={{
          text: "AI LinkedIn Writer",
          gradient: "FAQ",
        }}
        description="Common questions about the AI LinkedIn writer and voice training"
        faqs={[
          {
            question: "How is an AI writer different from a generator?",
            answer:
              "A generator produces output from a topic and a templated prompt. A writer studies your voice first, calibrates to your audience and tone, then drafts in your style. LinkedGrow runs voice training before any post is written so the output reads like you, not like the default AI cadence.",
          },
          {
            question: "How many sample posts do I need for voice training?",
            answer:
              "3 to 5 of your strongest posts. The voice training field accepts up to 5 samples. More is not better here - quality matters more than volume. Pick posts that already sound like you on a good day and the writer will fingerprint your style in a single pass.",
          },
          {
            question: "Which AI model writes the best LinkedIn posts?",
            answer:
              "It depends on the post type. Claude Opus 4.7 tends to win on narrative and story posts. GPT 5.2 handles analytical and data-driven takes well. Gemini 3 Pro is strong for research-heavy content. The writer lets you switch on every draft so you can compare for your own niche.",
          },
          {
            question: "Can I use the writer without giving it sample posts?",
            answer:
              "Yes. Voice training is optional. Without samples the writer uses your audience and tone settings plus the model's default style. You will still get a usable draft - it just will not match your unique cadence. Most users find the lift from training is worth the 2 minutes it takes.",
          },
          {
            question: "Will my LinkedIn audience notice the posts are AI-written?",
            answer:
              "If you train your voice properly, no. Sentence rhythm matching is the single biggest tell that separates AI from human posts. Once the writer has your samples, it reproduces your length variation, openers, and paragraph density. Most users report their audience cannot tell trained AI posts from manual ones.",
          },
          {
            question: "How much does the AI writer cost after the 7-day trial?",
            answer:
              "Starter is $13/mo with unlimited writing. Pro is $27/mo and adds image generation, analytics, and network notifications. Business is $55/mo and adds carousels, A/B testing, team collaboration, and API access. BYOK AI costs are typically $2 to $4/month with zero markup from LinkedGrow.",
          },
          {
            question: "What is BYOK and why does the writer use it?",
            answer:
              "BYOK means Bring Your Own Key. You connect your API key from OpenAI, Anthropic, Google, Grok, Perplexity, or Kimi, and LinkedGrow uses it to write your posts. You pay the provider directly at their rates with zero markup. This is why the writer can offer unlimited drafts at $19/mo instead of $49 to $199 with caps.",
          },
          {
            question: "Can the AI writer publish directly to LinkedIn?",
            answer:
              "Yes. Connect your LinkedIn account and publish drafts directly from the editor. Scheduling for future dates is available on Starter and above - 10 scheduled posts on Starter, unlimited on Pro and Business.",
          },
        ]}
      />

      <LandingRelatedContent
        headline="Related Resources"
        links={[
          { title: "AI Post Generator", href: "/" },
          { title: "AI LinkedIn Posts Without Sounding Robotic", href: "/blog/ai-linkedin-posts-without-sounding-robotic" },
          { title: "Best AI LinkedIn Post Generator", href: "/best-ai-linkedin-post-generator" },
        ]}
      />

      <LandingCTA
        badge="Start Writing LinkedIn Posts in Your Voice"
        headline={{
          line1: "Ready to write LinkedIn posts",
          gradient: "that sound like you?",
        }}
        description="Paste 3 sample posts, brief the writer, and get your first draft in your voice in under 5 minutes. 7-day Pro trial, no credit card, all 26 models included."
        primaryCta={{ text: "Train your voice free", href: "/sign-up" }}
        secondaryCta={{ text: "See all plans", href: "/pricing" }}
        trustIndicators={[
          "7-day Pro trial",
          "No credit card",
          "All 26 AI models",
          "Voice training included",
        ]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
