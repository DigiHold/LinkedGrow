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
  CircleDollarSign,
  Clock,
  Target,
  Key,
  AlertTriangle,
  Users,
  Wand2,
  Brain,
  Mic,
  PenTool,
  Calendar,
  Gift,
  Lightbulb,
  CreditCard,
} from "lucide-react";

export function FreePostGeneratorContent() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <AnimatedBackground />
      <Header />

      <LandingHero
        badge={{ icon: Gift, text: "100% Free to Start" }}
        headline={{
          line1: "Free LinkedIn post generator",
          gradient: "powered by AI",
        }}
        descriptionBold="Generate your first LinkedIn posts without paying anything."
        description="LinkedGrow's 7-day Pro trial gives you 3 AI-powered post generations per month. Access all 26+ AI models from OpenAI, Anthropic, Google, Grok, Perplexity, and Kimi. Voice training matches your writing style from day one. No credit card needed, no hidden costs, no surprises."
        valuePropBadges={[
          { icon: Gift, text: "3 free generations" },
          { icon: CreditCard, text: "No card required" },
          { icon: Mic, text: "Voice training free" },
        ]}
        primaryCta={{ text: "Generate posts free", href: "/sign-up" }}
        secondaryCta={{ text: "See all plans", href: "/pricing" }}
        trustIndicators={["7-day Pro trial plan", "No credit card", "All AI models included"]}
        video={{
          videoId: "5cE1BRvxfiQ",
          thumbnailUrl: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/video-thumbnail-promo.avif",
          duration: "0:10",
          ctaText: "See Pricing",
          ctaHref: "/pricing",
        }}
      />

      <LandingPainPoints
        badge={{ icon: AlertTriangle, text: "The Free Tool Problem" }}
        badgeColor="red"
        headline={{
          text: "Most free LinkedIn generators are",
          gradient: "barely usable.",
        }}
        descriptionBold="Free does not have to mean low quality."
        description="Most free LinkedIn post generators use outdated AI models, produce generic content with no personalization, and push you into expensive plans immediately. You deserve a free tool that actually produces content worth publishing."
        problems={[
          {
            icon: Brain,
            stat: "GPT-3.5",
            title: "Outdated models on free tools",
            description:
              "Most free generators use GPT-3.5 or older models that produce noticeably worse output. The content reads as clearly AI-generated, lacks nuance, and follows the same formulaic patterns your audience has seen a thousand times.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: Mic,
            stat: "None",
            title: "Zero personalization or voice matching",
            description:
              "Free tools produce identical output for every user. No voice training, no tone customization, no style matching. Every post sounds the same whether you are a CEO, a marketer, or an engineer. Your audience notices.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: Target,
            stat: "1",
            title: "Generation before being forced to pay",
            description:
              "Many free LinkedIn generators let you try exactly one post before hitting a paywall. That single generation is not enough to evaluate the tool, train your voice, or build a workflow. It is just a teaser to get your credit card.",
            color: "from-red-500 to-orange-600",
          },
          {
            icon: CircleDollarSign,
            stat: "$49+",
            title: "After the free trial ends",
            description:
              "The free trial funnels you into plans starting at $49 to $199 per month with generation caps. Even after paying, you still get one AI model and no voice training. The free offer is just a hook for an overpriced subscription.",
            color: "from-rose-500 to-red-600",
          },
        ]}
        bottomQuote="Every free LinkedIn generator I try is either terrible quality or immediately wants my credit card..."
      />

      <LandingFeatures
        badge={{ icon: Gift, text: "Free Plan Features" }}
        headline={{
          text: "A 7-day Pro trial that actually",
          gradient: "delivers quality",
        }}
        description="LinkedGrow's 7-day Pro trial is not a crippled trial. You get access to the same AI models, voice training, and post wizard that paid users have - just with 3 generations per month."
        features={[
          {
            icon: Brain,
            title: "All 26+ AI Models",
            description:
              "The 7-day Pro trial gives you access to every supported AI model from OpenAI, Anthropic, Google, Grok, Perplexity, and Kimi. No model restrictions. The same quality paid users get.",
            highlights: ["ChatGPT included", "Claude included", "Gemini included"],
            badge: "Free",
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: Mic,
            title: "Voice Training Included",
            description:
              "Paste your best LinkedIn posts and the AI learns your style. Voice training is available on the 7-day Pro trial so you can see how authentic the output is before deciding to upgrade. This is not available on any competitor's free tier.",
            highlights: ["Paste sample posts", "AI learns your style", "Authentic output"],
            badge: "Free",
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: PenTool,
            title: "4-Step Post Wizard",
            description:
              "The guided wizard walks you through topic, post type, tone, and generation. Select storytelling, how-to, thought leadership, or other formats. The same workflow paid users love, available on the 7-day Pro trial.",
            highlights: ["Guided workflow", "Multiple formats", "Same as paid"],
            badge: "Free",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: Sparkles,
            title: "3 Generations Per Month",
            description:
              "Generate 3 complete LinkedIn posts every month. That is enough to test the quality, train your voice, and see the difference compared to generic AI tools. Generations reset at the start of each billing period.",
            highlights: ["Monthly reset", "No expiration", "Full quality"],
            badge: "3/month",
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: Lightbulb,
            title: "Direct LinkedIn Publishing",
            description:
              "Connect your LinkedIn account and publish AI-generated posts directly from LinkedGrow. No copy-pasting needed. Click publish and your post goes live on your profile immediately.",
            highlights: ["One-click publish", "No copy-paste", "Profile connection"],
            badge: "Free",
            color: "from-pink-500 to-rose-500",
          },
          {
            icon: CreditCard,
            title: "No Credit Card Required",
            description:
              "Sign up with your email and start generating immediately. No credit card, no trial period, no surprise charges. The 7-day Pro trial is genuinely free with no strings attached. Upgrade only when you want unlimited generations.",
            highlights: ["Email signup only", "No payment info", "Upgrade anytime"],
            badge: "Zero cost",
            color: "from-teal-500 to-cyan-600",
          },
        ]}
        ctaText="Start Generating Free"
        ctaHref="/sign-up"
      />

      <LandingHowItWorks
        headline={{
          text: "Generate your first free post in",
          gradient: "90 seconds",
        }}
        description="From signup to published LinkedIn post in under 2 minutes."
        steps={[
          {
            number: "01",
            title: "Sign up free (30 seconds)",
            description:
              "Create your account with just an email address. No credit card, no payment info. Set up voice training by pasting a few of your best LinkedIn posts so the AI can learn your style.",
            icon: Gift,
            color: "from-cyan-500 to-blue-500",
            time: "30 sec",
          },
          {
            number: "02",
            title: "Enter a topic and generate",
            description:
              "Type a topic or idea, select a post type, choose your preferred AI model from 26+ options, and hit generate. The AI creates a complete LinkedIn post matching your trained voice in seconds.",
            icon: Brain,
            color: "from-violet-500 to-purple-500",
            time: "30 sec",
          },
          {
            number: "03",
            title: "Publish to LinkedIn",
            description:
              "Review and edit the post, then publish directly to your LinkedIn profile. Your first AI-generated post, written in your voice, published to LinkedIn - all within 90 seconds of signing up and completely free.",
            icon: Zap,
            color: "from-emerald-500 to-green-500",
            time: "15 sec",
          },
        ]}
        totalTime="Under 90 seconds total"
      />

      <LandingBYOK
        badge={{ icon: Key, text: "Free vs Paid Comparison" }}
        headline={{
          text: "Even the paid plan costs",
          gradient: "80% less than competitors",
        }}
        description="Start free and upgrade when you need unlimited generations. Even then, LinkedGrow's BYOK model keeps your costs dramatically lower than any competitor."
        competitor={{
          name: "Other Free LinkedIn Tools",
          price: "$0 then $49-199/month",
          issues: [
            { text: "Free tier limited to 1 generation or 24-hour trial" },
            { text: "Outdated AI model (GPT-3.5 or older) on free tier" },
            { text: "No voice training on any tier - generic output only" },
            { text: "Jumps to $49 to $199 per month after free trial" },
            { text: "Still caps generations at 30 to 100 per month on paid plans" },
          ],
        }}
        linkedgrow={{
          price: "Free - $19/month",
          apiCost: "$2-4/month",
          benefits: [
            { text: "7-day Pro trial with 3 real generations per month - no trial expiration" },
            { text: "All 26+ AI models on the 7-day Pro trial" },
            { text: "Voice training included on 7-day Pro trial" },
            { text: "Upgrade to unlimited at $19 per month - not $49 to $199" },
            { text: "BYOK AI costs of $2 to $4 per month with zero markup" },
          ],
        }}
        savingsText="Free to start, then 80% cheaper than competitors when you upgrade"
      />

      <LandingTestimonials
        badge={{ icon: Users, text: "Free Plan Success Stories" }}
        headline={{
          text: "Started free, now posting",
          gradient: "consistently",
        }}
        description="Users who started on the 7-day Pro trial and discovered the difference quality AI content makes for their LinkedIn presence."
        stats={[
          { value: "Free", label: "No credit card needed", color: "text-cyan-600 dark:text-cyan-400" },
          { value: "26+", label: "AI models on Pro trial", color: "text-emerald-600 dark:text-emerald-400" },
          { value: "3", label: "Generations per month", color: "text-violet-600 dark:text-violet-400" },
          { value: "$0", label: "Total cost to start", color: "text-amber-600 dark:text-amber-400" },
        ]}
        testimonials={[
          {
            quote:
              "I tried 3 free LinkedIn generators before LinkedGrow. The others used outdated AI and had no voice training. LinkedGrow's 7-day Pro trial gave me the latest models, voice matching, and 3 posts that actually sounded like me. Upgraded to Starter the same week.",
            author: "Nina R.",
            role: "Freelance Consultant, 4K Followers",
          },
          {
            quote:
              "The 7-day Pro trial was enough to prove the concept. I generated 3 posts, trained my voice, and published them to LinkedIn. The engagement was noticeably better than my manually written posts. Now I use the Starter plan and post 4 times per week.",
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
          text: "Free AI Generator",
          gradient: "FAQ",
        }}
        description="Everything about the free LinkedIn post generator AI"
        faqs={[
          {
            question: "Is this really free with no hidden costs?",
            answer:
              "Yes. The 7-day Pro trial includes 3 generations per month, all AI models, and voice training. No credit card required. No trial period. No surprise charges. 7-day Pro trial.",
          },
          {
            question: "Do I need to sign up?",
            answer:
              "Yes, a free account is needed to save your voice training and API key configuration. Takes 30 seconds with just an email. No credit card.",
          },
          {
            question: "What AI models are on the 7-day Pro trial?",
            answer:
              "All 26+ models from OpenAI, Anthropic, Google, Grok, Perplexity, and Kimi. No model restrictions on the 7-day Pro trial.",
          },
          {
            question: "Is voice training available for free?",
            answer:
              "Yes. Paste your sample posts and the AI learns your style. This is included on the 7-day Pro trial - no competitor offers this for free.",
          },
          {
            question: "What happens after 3 generations?",
            answer:
              "Wait for the monthly reset or upgrade to Starter at $19 per month for unlimited generations. Voice training and settings carry over.",
          },
          {
            question: "How much is the paid plan?",
            answer:
              "Starter is $19 per month unlimited. Pro is $39 per month with images and analytics. Business is $79 per month with carousels, A/B testing, and team collaboration. BYOK AI costs average $2 to $4 per month.",
          },
          {
            question: "What is BYOK?",
            answer:
              "Bring Your Own Key. Connect your API key from OpenAI, Anthropic, or Google. Pay them directly with zero markup from LinkedGrow.",
          },
          {
            question: "Can I publish to LinkedIn from the 7-day Pro trial?",
            answer:
              "Yes. Connect your LinkedIn account and publish directly. Scheduling requires Starter plan or above.",
          },
        ]}
      />

      <LandingRelatedContent
        headline="Related Resources"
        links={[
          { title: "AI Post Generator", href: "/features/ai-post-generator" },
          { title: "AI LinkedIn Posts Without Sounding Robotic", href: "/blog/ai-linkedin-posts-without-sounding-robotic" },
          { title: "Best AI LinkedIn Post Generator", href: "/best-ai-linkedin-post-generator" },
        ]}
      />

      <LandingCTA
        badge="Start Generating Free LinkedIn Posts with AI"
        headline={{
          line1: "Ready to generate your first",
          gradient: "LinkedIn post for free?",
        }}
        description="Sign up in 30 seconds, train your voice, and generate your first AI-powered LinkedIn post. No credit card, no trial, no strings attached."
        primaryCta={{ text: "Start free - no card needed", href: "/sign-up" }}
        secondaryCta={{ text: "See all plans", href: "/pricing" }}
        trustIndicators={[
          "3 free generations",
          "No credit card",
          "All AI models",
          "Voice training included",
        ]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
