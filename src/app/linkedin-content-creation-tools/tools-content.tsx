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
  Calendar,
  BarChart3,
  Image,
  MessageCircle,
  Layers,
  PenTool,
  LayoutGrid,
} from "lucide-react";

export function ContentCreationToolsContent() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <AnimatedBackground />
      <Header />

      <LandingHero
        badge={{ icon: LayoutGrid, text: "All-in-One Content Platform" }}
        headline={{
          line1: "Every LinkedIn content tool",
          gradient: "in one platform",
        }}
        descriptionBold="Stop paying for 5 different tools to manage your LinkedIn presence."
        description="LinkedGrow combines AI post generation, photo creation, carousel building, scheduling, analytics, and engagement tools into a single platform. Write, design, schedule, and track - all from one dashboard. Powered by 20+ AI models with BYOK pricing."
        valuePropBadges={[
          { icon: Sparkles, text: "20+ AI models" },
          { icon: Layers, text: "6 tools in one" },
          { icon: CircleDollarSign, text: "From $19/month" },
        ]}
        primaryCta={{ text: "Try all tools free", href: "/sign-up" }}
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
        badge={{ icon: AlertTriangle, text: "The Tool Sprawl Problem" }}
        badgeColor="red"
        headline={{
          text: "Managing LinkedIn with 5 different tools is",
          gradient: "killing your productivity.",
        }}
        descriptionBold="The average LinkedIn creator uses 3 to 5 separate tools for content creation."
        description="One tool for writing, another for images, a third for scheduling, and yet another for analytics. Each has its own subscription, its own learning curve, and its own limitations. The context switching alone costs you hours every week."
        problems={[
          {
            icon: CircleDollarSign,
            stat: "$150+",
            title: "Per month on scattered tool subscriptions",
            description:
              "A writing tool ($29), stock photos ($15), Canva Pro ($13), a scheduling tool ($25), and an analytics tool ($30) add up fast. Most creators are spending $100 to $200 per month on a patchwork of tools that do not even talk to each other.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: Clock,
            stat: "45 min",
            title: "Wasted per post switching between apps",
            description:
              "Write in one app, copy to another for editing, download an image from a third, upload to a scheduler in a fourth, then check analytics in a fifth. Each switch breaks your creative flow and adds friction to your publishing workflow.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: Target,
            stat: "Limited",
            title: "AI generation caps on most platforms",
            description:
              "Most LinkedIn tools cap your AI generations at 30 to 100 posts per month and charge you extra for more. When you hit the limit mid-month, you either stop posting or pay a premium overage fee to keep going.",
            color: "from-red-500 to-orange-600",
          },
          {
            icon: MessageCircle,
            stat: "0",
            title: "Integration between your separate tools",
            description:
              "Your writing tool does not know about your scheduled posts. Your analytics tool cannot inform your next content idea. Your image tool has no connection to your text editor. Every tool works in isolation, creating more manual work for you.",
            color: "from-rose-500 to-red-600",
          },
        ]}
        bottomQuote="I spend more time managing my LinkedIn tools than actually creating content for LinkedIn..."
      />

      <LandingFeatures
        badge={{ icon: LayoutGrid, text: "Complete Content Toolkit" }}
        headline={{
          text: "Six powerful tools,",
          gradient: "one platform",
        }}
        description="Everything you need to create, schedule, publish, and grow on LinkedIn. All tools work together seamlessly from a single dashboard."
        features={[
          {
            icon: PenTool,
            title: "AI Post Generator",
            description:
              "Generate complete LinkedIn posts with 20+ AI models including GPT-5, Claude, and Gemini. Voice training matches your writing style. 4-step wizard guides you from topic to finished post in under 2 minutes.",
            highlights: ["20+ AI models", "Voice training", "Unlimited generations"],
            badge: "Core",
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: Image,
            title: "AI Photo Generator",
            description:
              "Create unique photos for your posts with Nano Banana Pro, FLUX, GPT Image 1.5, and Imagen 4. Generate directly from the post editor and attach in one click. No design skills needed, no stock photo subscriptions.",
            highlights: ["10+ image models", "In-editor generation", "$0.02-0.08 per photo"],
            badge: "Pro",
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: Layers,
            title: "Carousel Builder",
            description:
              "Create multi-slide LinkedIn carousels that get 2x more clicks than standard posts. AI helps generate slide content, and the visual builder lets you customize each slide with your branding and colors.",
            highlights: ["Multi-slide creation", "AI content assist", "Brand customization"],
            badge: "Business",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: Calendar,
            title: "Scheduler & Content Calendar",
            description:
              "Schedule posts to publish at the optimal time for your audience. Visual content calendar shows your week and month at a glance. Publish directly to your LinkedIn profile or company page automatically.",
            highlights: ["Visual calendar", "Optimal time suggestions", "Auto-publish"],
            badge: "Starter+",
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: BarChart3,
            title: "Analytics Dashboard",
            description:
              "Track engagement metrics across all your posts. See which content types perform best, identify optimal posting times, and measure your LinkedIn growth over time with visual charts and trend analysis.",
            highlights: ["Engagement tracking", "Trend analysis", "Best time insights"],
            badge: "Pro",
            color: "from-pink-500 to-rose-500",
          },
          {
            icon: Wand2,
            title: "Hook Generator",
            description:
              "Generate scroll-stopping opening lines that grab attention in the first 2 seconds. The hook generator creates multiple variations based on your topic so you can pick the most compelling one for maximum engagement.",
            highlights: ["Multiple variations", "Topic-based", "Proven patterns"],
            badge: "Pro",
            color: "from-teal-500 to-cyan-600",
          },
        ]}
        ctaText="Try All Tools Free"
        ctaHref="/sign-up"
      />

      <LandingHowItWorks
        headline={{
          text: "From blank page to published post in",
          gradient: "under 3 minutes",
        }}
        description="The complete content creation workflow without switching between apps."
        steps={[
          {
            number: "01",
            title: "Generate your post with AI",
            description:
              "Enter a topic or idea, select your preferred AI model and post type, and the AI generates a complete LinkedIn post matching your writing voice. Edit or regenerate until it is perfect.",
            icon: PenTool,
            color: "from-cyan-500 to-blue-500",
            time: "60 sec",
          },
          {
            number: "02",
            title: "Add a photo or carousel",
            description:
              "Generate a custom AI photo from the same editor or build a carousel for higher engagement. Describe what you want and the AI creates it. Attach to your post in one click.",
            icon: Image,
            color: "from-violet-500 to-purple-500",
            time: "30 sec",
          },
          {
            number: "03",
            title: "Schedule or publish directly",
            description:
              "Publish immediately to your LinkedIn profile or company page, or schedule for the optimal posting time. The content calendar shows you the full picture of your upcoming content.",
            icon: Calendar,
            color: "from-emerald-500 to-green-500",
            time: "15 sec",
          },
          {
            number: "04",
            title: "Track and optimize",
            description:
              "Monitor engagement metrics, identify what works best, and use insights to improve your next post. The analytics dashboard shows trends, best posting times, and content performance over time.",
            icon: BarChart3,
            color: "from-amber-500 to-yellow-500",
            time: "Ongoing",
          },
        ]}
        totalTime="Under 3 minutes per post"
      />

      <LandingBYOK
        badge={{ icon: Key, text: "Smart Economics" }}
        headline={{
          text: "Why pay for 5 tools when",
          gradient: "one does everything?",
        }}
        description="Most LinkedIn creators piece together multiple tools at high monthly costs. LinkedGrow replaces them all with a single platform that costs a fraction of the total."
        competitor={{
          name: "Typical Tool Stack",
          price: "$100-200/month",
          issues: [
            { text: "Separate AI writer ($29), stock photos ($15), Canva ($13), scheduler ($25), analytics ($30)" },
            { text: "Monthly generation caps on most AI writing tools" },
            { text: "No integration between tools - copy and paste everything" },
            { text: "5 different logins, 5 different interfaces to learn" },
            { text: "Each tool optimized for general use, not specifically for LinkedIn" },
          ],
        }}
        linkedgrow={{
          price: "$19-39/month",
          apiCost: "$2-4/month",
          benefits: [
            { text: "All 6 content tools in one platform with shared workflow" },
            { text: "Unlimited AI generations with BYOK - no caps or credit limits" },
            { text: "Everything designed specifically for LinkedIn content creation" },
            { text: "AI costs average $2 to $4 per month at provider rates - zero markup" },
            { text: "One login, one dashboard, one subscription" },
          ],
        }}
        savingsText="Save $80+ per month by consolidating your LinkedIn tool stack"
      />

      <LandingTestimonials
        badge={{ icon: Users, text: "Creator Results" }}
        headline={{
          text: "One platform is transforming how creators",
          gradient: "grow on LinkedIn",
        }}
        description="LinkedIn creators are replacing their scattered tool stacks with LinkedGrow and seeing better results at a fraction of the cost."
        stats={[
          { value: "6", label: "Content tools in one platform", color: "text-cyan-600 dark:text-cyan-400" },
          { value: "20+", label: "AI models for text and images", color: "text-emerald-600 dark:text-emerald-400" },
          { value: "80%", label: "Cost savings vs tool stacks", color: "text-violet-600 dark:text-violet-400" },
          { value: "< 3 min", label: "From idea to published post", color: "text-amber-600 dark:text-amber-400" },
        ]}
        testimonials={[
          {
            quote:
              "I was paying $140 per month across four different tools for my LinkedIn workflow. LinkedGrow replaced all of them for $39 plus a couple bucks in AI costs. The integrated workflow saves me at least an hour per week on top of the cost savings.",
            author: "Sarah K.",
            role: "Marketing Director, 35K Followers",
          },
          {
            quote:
              "Having the post generator, image creator, and scheduler in one place changed everything. I used to spend 30 minutes per post just switching between apps. Now I go from idea to scheduled post in under 3 minutes without leaving the dashboard.",
            author: "David M.",
            role: "SaaS Founder, 28K Followers",
          },
          {
            quote:
              "The BYOK model is brilliant. I connect my own OpenAI key, generate unlimited posts and images, and my total AI cost last month was $3.50. No other LinkedIn tool comes close to that value.",
            author: "Elena P.",
            role: "Business Coach, 15K Followers",
          },
        ]}
      />

      <LandingFAQ
        headline={{
          text: "Content Creation Tools",
          gradient: "FAQ",
        }}
        description="Everything you need to know about LinkedGrow's LinkedIn content creation toolkit"
        faqs={[
          {
            question: "What LinkedIn content creation tools does LinkedGrow include?",
            answer:
              "LinkedGrow includes an AI post generator with 20+ text models, AI photo generator with 10+ image models, LinkedIn carousel maker, content calendar with scheduling, hook generator for scroll-stopping opening lines, Reddit-to-LinkedIn content converter, engagement tools, analytics dashboard, and A/B testing. All tools are built into a single platform.",
          },
          {
            question: "How much do LinkedIn content creation tools typically cost?",
            answer:
              "Most LinkedIn content tools charge $49 to $99 per month and cap your generations. LinkedGrow starts at $19 per month for Starter with unlimited post generation, or $39 per month for Pro which adds image generation, analytics, and engagement tools. With BYOK, your AI costs are $2 to $4 per month on average.",
          },
          {
            question: "Can I generate unlimited LinkedIn posts?",
            answer:
              "Yes. Every paid plan includes unlimited AI post generation. You bring your own API key from OpenAI, Anthropic, Google, Grok (xAI), or Perplexity, and generate as many posts as you need with no monthly caps.",
          },
          {
            question: "Do I need separate tools for writing, images, and scheduling?",
            answer:
              "No. LinkedGrow combines everything into one platform. Write, generate photos, schedule, and track analytics from the same dashboard. No switching between apps.",
          },
          {
            question: "What AI models power the content creation tools?",
            answer:
              "For text: GPT-5, Claude Opus 4.5, Claude Sonnet 4.5, Gemini 3 Pro, Grok 4, and 15+ more. For images: GPT Image 1.5, Nano Banana Pro, FLUX.2 Pro, Imagen 4. Switch between models anytime.",
          },
          {
            question: "Is there a free plan available?",
            answer:
              "Yes. The free plan includes 3 AI post generations per month with no credit card required. Paid plans start at $19 per month for unlimited generations.",
          },
          {
            question: "How does the BYOK model work?",
            answer:
              "BYOK means Bring Your Own Key. You connect API keys from providers like OpenAI or Anthropic and pay them directly at their standard rates. LinkedGrow adds zero markup, keeping your costs at $2 to $4 per month for regular usage.",
          },
          {
            question: "Can I schedule posts to LinkedIn?",
            answer:
              "Yes. Starter includes 10 scheduled posts, Pro and Business include unlimited scheduling. Schedule through the content calendar with a visual timeline, set custom publish times in your timezone, and LinkedGrow publishes to your LinkedIn profile or company page automatically.",
          },
        ]}
      />

      <LandingCTA
        badge="Replace Your Entire LinkedIn Tool Stack"
        headline={{
          line1: "Ready to manage LinkedIn with",
          gradient: "one powerful platform?",
        }}
        description="Stop paying for 5 different tools and switching between apps all day. Get every LinkedIn content creation tool you need in one place at a fraction of the cost."
        primaryCta={{ text: "Start free - no card needed", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={[
          "Free plan available",
          "6 tools in one",
          "Cancel anytime",
          "BYOK - unlimited generations",
        ]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
