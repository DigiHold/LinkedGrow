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
  Image,
  Calendar,
  MessageCircle,
  PenTool,
  Bot,
} from "lucide-react";

export function ContentCreationAiContent() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <AnimatedBackground />
      <Header />

      <LandingHero
        badge={{ icon: Brain, text: "AI-Powered Content Creation" }}
        headline={{
          line1: "Create LinkedIn content 10x faster",
          gradient: "with AI",
        }}
        descriptionBold="LinkedIn rewards consistency. AI makes it possible."
        description="LinkedGrow uses 20+ AI models to generate posts, photos, and carousels that match your unique writing voice. GPT-5, Claude, Gemini, FLUX, and more - all accessible through one dashboard. Publish 3 to 5 posts per week without spending hours writing."
        valuePropBadges={[
          { icon: Bot, text: "20+ AI models" },
          { icon: Mic, text: "Voice training" },
          { icon: Zap, text: "Posts in 2 minutes" },
        ]}
        primaryCta={{ text: "Start creating with AI", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={["Free plan available", "No credit card required", "Cancel anytime"]}
        video={{
          videoId: "u31qwQUeGuM",
          thumbnailUrl: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/video-thumbnail.avif",
          duration: "0:10",
          ctaText: "See Pricing",
          ctaHref: "/pricing",
        }}
      />

      <LandingPainPoints
        badge={{ icon: AlertTriangle, text: "The Content Creation Problem" }}
        badgeColor="red"
        headline={{
          text: "Writing LinkedIn content manually is",
          gradient: "unsustainable.",
        }}
        descriptionBold="Only 3% of LinkedIn's 1 billion users post weekly."
        description="The reason is simple - creating quality LinkedIn content takes too long. Writing a single post can take 30 to 60 minutes when you factor in ideation, drafting, editing, and finding a visual. Multiply that by 3 to 5 posts per week and content creation becomes a full-time job."
        problems={[
          {
            icon: Clock,
            stat: "45 min",
            title: "Average time to write one LinkedIn post",
            description:
              "Between coming up with an idea, writing the draft, editing for tone and length, and finding a matching visual, most creators spend 30 to 60 minutes per post. That is 3 to 5 hours per week just for LinkedIn content.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: Target,
            stat: "97%",
            title: "Of LinkedIn users never post weekly",
            description:
              "The LinkedIn algorithm massively rewards consistent posting. But the time investment required means the vast majority of professionals never build a posting habit. They know they should post more but the effort is too high.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: MessageCircle,
            stat: "Generic",
            title: "AI tools that do not match your voice",
            description:
              "Most AI writing tools produce generic LinkedIn content that sounds robotic and formulaic. Your audience can spot AI-generated text immediately when it does not match your established writing style and professional voice.",
            color: "from-red-500 to-orange-600",
          },
          {
            icon: CircleDollarSign,
            stat: "$49-199",
            title: "Monthly cost of typical AI LinkedIn tools",
            description:
              "Most LinkedIn AI tools charge $49 to $199 per month and still limit your generations to 30 to 100 posts. When you need more, you pay premium overage fees. The economics do not work for most professionals.",
            color: "from-rose-500 to-red-600",
          },
        ]}
        bottomQuote="I know I should post on LinkedIn more, but I spend an hour per post and it still does not sound quite right..."
      />

      <LandingFeatures
        badge={{ icon: Brain, text: "AI Content Features" }}
        headline={{
          text: "AI that creates content",
          gradient: "that sounds like you",
        }}
        description="LinkedGrow is not just another AI writer. It is a complete AI content creation system designed specifically for LinkedIn with voice training, multi-model support, and an integrated publishing workflow."
        features={[
          {
            icon: Sparkles,
            title: "20+ AI Text Models",
            description:
              "Choose from GPT-5, GPT-5.2, Claude Opus 4.5, Claude Sonnet 4.5, Gemini 3 Pro, Gemini 3 Flash, Grok 4, Sonar Pro, and more. Each model has different strengths for different content types. Switch between models anytime.",
            highlights: ["6 AI providers", "20+ models", "Switch anytime"],
            badge: "BYOK",
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: Mic,
            title: "Voice Training",
            description:
              "Paste 3 to 5 of your best LinkedIn posts and the AI analyzes your writing patterns, vocabulary, sentence structure, and tone. Every generated post matches your unique voice so your audience cannot tell the difference.",
            highlights: ["Style analysis", "Tone matching", "Vocabulary learning"],
            badge: "Your voice",
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: Image,
            title: "AI Photo Generation",
            description:
              "Generate custom photos for every post with Nano Banana Pro, GPT Image 1.5, FLUX, Imagen 4. Describe the visual you want, generate it in the editor, and attach to your post in one click. No stock photos needed.",
            highlights: ["10+ image models", "In-editor creation", "$0.02-0.08 per photo"],
            badge: "Pro",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: Wand2,
            title: "Hook Generator",
            description:
              "The first line of your LinkedIn post determines whether people read the rest. The AI hook generator creates multiple scroll-stopping opening lines based on your topic so you can pick the one that will drive the most engagement.",
            highlights: ["Multiple variations", "Proven patterns", "Topic-based"],
            badge: "Pro",
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: Calendar,
            title: "Schedule and Auto-Publish",
            description:
              "Schedule AI-generated posts to publish at the optimal time for your audience. The content calendar shows your week at a glance. LinkedGrow publishes directly to your LinkedIn profile or company page without manual intervention.",
            highlights: ["Optimal timing", "Visual calendar", "Auto-publish"],
            badge: "Starter+",
            color: "from-pink-500 to-rose-500",
          },
          {
            icon: PenTool,
            title: "4-Step Post Wizard",
            description:
              "The guided wizard walks you through topic selection, tone setting, AI generation, and final editing. Select a post type (storytelling, how-to, thought leadership, or more), set parameters, and get a polished LinkedIn post in under 2 minutes.",
            highlights: ["Guided workflow", "Multiple post types", "Under 2 minutes"],
            badge: "Guided",
            color: "from-teal-500 to-cyan-600",
          },
        ]}
        ctaText="Start Creating AI Content"
        ctaHref="/sign-up"
      />

      <LandingHowItWorks
        headline={{
          text: "From blank page to published post in",
          gradient: "2 minutes",
        }}
        description="The AI handles the heavy lifting so you can focus on your message."
        steps={[
          {
            number: "01",
            title: "Enter your topic or idea",
            description:
              "Tell the AI what you want to write about. Enter a topic, a key insight, a Reddit post to repurpose, or just a rough idea. Select the post type and tone. The 4-step wizard makes this quick and structured.",
            icon: PenTool,
            color: "from-cyan-500 to-blue-500",
            time: "20 sec",
          },
          {
            number: "02",
            title: "AI generates your post",
            description:
              "The AI creates a complete LinkedIn post matching your trained writing voice. Review, edit, or regenerate with a different model. Each model brings a different style and perspective to the same topic.",
            icon: Brain,
            color: "from-violet-500 to-purple-500",
            time: "30 sec",
          },
          {
            number: "03",
            title: "Add visuals and polish",
            description:
              "Generate a matching AI photo or build a carousel directly in the editor. Add hooks, hashtags, and final formatting touches. Everything happens in one place with no copy-pasting between tools.",
            icon: Image,
            color: "from-emerald-500 to-green-500",
            time: "30 sec",
          },
          {
            number: "04",
            title: "Schedule or publish",
            description:
              "Publish immediately to LinkedIn or schedule for the optimal posting time. The content calendar shows your full week so you can maintain a consistent posting schedule without overlap.",
            icon: Zap,
            color: "from-amber-500 to-yellow-500",
            time: "10 sec",
          },
        ]}
        totalTime="Under 2 minutes total"
      />

      <LandingBYOK
        badge={{ icon: Key, text: "Smart Economics" }}
        headline={{
          text: "Why pay $99 per month for",
          gradient: "capped AI generations?",
        }}
        description="Most LinkedIn AI tools charge premium prices and still limit how much content you can create. LinkedGrow's BYOK model gives you unlimited generations at a fraction of the cost."
        competitor={{
          name: "Typical LinkedIn AI Tools",
          price: "$49-199/month",
          issues: [
            { text: "30 to 100 post generations per month with hard caps" },
            { text: "One AI model with no choice (usually GPT-3.5 or GPT-4)" },
            { text: "No voice training - generic output that sounds like everyone else" },
            { text: "Extra fees for image generation, scheduling, or analytics" },
            { text: "Premium overage charges when you hit the monthly limit" },
          ],
        }}
        linkedgrow={{
          price: "$19-79/month",
          apiCost: "$2-4/month",
          benefits: [
            { text: "Unlimited post generations with zero caps on any paid plan" },
            { text: "20+ AI models - switch between GPT-5, Claude, Gemini, Grok, and more" },
            { text: "Voice training that matches your exact writing style and tone" },
            { text: "AI costs average $2 to $4 per month at provider rates - zero markup" },
            { text: "Photos, scheduling, analytics, and hooks all included" },
          ],
        }}
        savingsText="Unlimited AI content at 80% less than typical tools"
      />

      <LandingTestimonials
        badge={{ icon: Users, text: "Creator Results" }}
        headline={{
          text: "AI-powered creators are posting",
          gradient: "3x more consistently",
        }}
        description="LinkedIn professionals are using AI to break through the content creation bottleneck and maintain consistent posting schedules that drive real business results."
        stats={[
          { value: "20+", label: "AI models to choose from", color: "text-cyan-600 dark:text-cyan-400" },
          { value: "< 2 min", label: "Average time per post", color: "text-emerald-600 dark:text-emerald-400" },
          { value: "$2-4", label: "Monthly AI costs (BYOK)", color: "text-violet-600 dark:text-violet-400" },
          { value: "3-5x", label: "More posts per week", color: "text-amber-600 dark:text-amber-400" },
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
              "Having 20+ models to choose from is a game changer. I use Claude for thought leadership pieces and GPT-5 for storytelling posts. Different models, different strengths. And my total AI cost last month was $3.20.",
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
          text: "AI Content Creation",
          gradient: "FAQ",
        }}
        description="Everything you need to know about using AI for LinkedIn content creation"
        faqs={[
          {
            question: "What AI models does LinkedGrow use for content creation?",
            answer:
              "LinkedGrow supports 20+ text models including GPT-5, Claude Opus 4.5, Gemini 3 Pro, Grok 4, and Sonar Pro. For images: GPT Image 1.5, Nano Banana Pro, FLUX.2 Pro, Imagen 4. You choose which model to use for each generation.",
          },
          {
            question: "How does AI content creation work for LinkedIn?",
            answer:
              "Describe what you want to write about, select a post type and AI model, and get a complete LinkedIn post in seconds. Voice training ensures it matches your writing style. Edit, add a photo, and publish or schedule directly.",
          },
          {
            question: "Will AI-generated content sound like me?",
            answer:
              "Yes. Voice training analyzes your past posts to learn your style, vocabulary, and tone. Every AI post matches your voice so your audience cannot tell the difference.",
          },
          {
            question: "How much does AI content creation cost?",
            answer:
              "Plans start at $19 per month. AI costs average $2 to $4 per month with BYOK - you pay providers directly with zero markup. That is 60 to 80 percent less than tools charging $49 to $199 per month.",
          },
          {
            question: "Can AI create images and carousels too?",
            answer:
              "Yes. Pro includes AI image generation with 10+ models. Business adds carousel creation. Generate photos from text descriptions and attach directly to posts.",
          },
          {
            question: "Is AI content allowed on LinkedIn?",
            answer:
              "Yes. LinkedIn allows AI-assisted content. The key is providing genuine value and reflecting your expertise. Voice training ensures authenticity.",
          },
          {
            question: "How many posts can I generate?",
            answer:
              "Unlimited on all paid plans. Free plan includes 3 generations per month. No caps, no credit limits, no token restrictions.",
          },
          {
            question: "Does LinkedGrow also schedule and publish?",
            answer:
              "Yes. Schedule posts to publish at optimal times directly from the editor. Visual content calendar, auto-publish to LinkedIn profiles and company pages.",
          },
        ]}
      />

      <LandingCTA
        badge="Start Creating AI-Powered LinkedIn Content"
        headline={{
          line1: "Ready to create LinkedIn content",
          gradient: "10x faster with AI?",
        }}
        description="Stop spending hours writing posts manually. Let AI handle the heavy lifting while you focus on your message and your business."
        primaryCta={{ text: "Start free - no card needed", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={[
          "Free plan available",
          "20+ AI models",
          "Cancel anytime",
          "Voice training included",
        ]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
