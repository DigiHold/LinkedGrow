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
  PenTool,
  Calendar,
  MessageCircle,
  Lightbulb,
  Gift,
} from "lucide-react";

export function PostGeneratorFreeContent() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <AnimatedBackground />
      <Header />

      <LandingHero
        badge={{ icon: Gift, text: "Free AI Post Generator" }}
        headline={{
          line1: "Generate LinkedIn posts for free",
          gradient: "with AI",
        }}
        descriptionBold="Create professional LinkedIn posts without spending a dollar."
        description="LinkedGrow's free plan gives you 3 AI post generations per month with access to 20+ models including GPT-5, Claude, and Gemini. Voice training matches your writing style so every post sounds authentically you. No credit card needed to start."
        valuePropBadges={[
          { icon: Gift, text: "Free plan available" },
          { icon: Brain, text: "20+ AI models" },
          { icon: Mic, text: "Voice training" },
        ]}
        primaryCta={{ text: "Start generating free", href: "/sign-up" }}
        secondaryCta={{ text: "See all plans", href: "/pricing" }}
        trustIndicators={["3 free generations/month", "No credit card required", "Upgrade anytime"]}
        video={{
          videoId: "u31qwQUeGuM",
          thumbnailUrl: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/video-thumbnail.avif",
          duration: "0:10",
          ctaText: "See Pricing",
          ctaHref: "/pricing",
        }}
      />

      <LandingPainPoints
        badge={{ icon: AlertTriangle, text: "The Content Creation Struggle" }}
        badgeColor="red"
        headline={{
          text: "Writing LinkedIn posts from scratch is",
          gradient: "painfully slow.",
        }}
        descriptionBold="The average LinkedIn post takes 30 to 60 minutes to write well."
        description="Between finding a topic, drafting the content, editing for the right tone, crafting a hook, and formatting for LinkedIn's algorithm - a single post eats up a huge chunk of your day. No wonder most professionals never post consistently."
        problems={[
          {
            icon: Clock,
            stat: "45 min",
            title: "Per post if you write manually",
            description:
              "Ideation, drafting, editing, and formatting a single LinkedIn post takes most professionals 30 to 60 minutes. When you need to post 3 to 5 times per week, that is up to 5 hours of writing time every week.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: Target,
            stat: "97%",
            title: "Never achieve consistent posting",
            description:
              "The LinkedIn algorithm rewards consistency above almost everything else. But the time commitment means 97% of users never post weekly. They know LinkedIn matters for their career but cannot sustain the effort.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: CircleDollarSign,
            stat: "$49+",
            title: "Monthly cost of most AI writing tools",
            description:
              "LinkedIn-specific AI tools typically charge $49 to $199 per month. Many also cap your generations at 30 to 100 posts, forcing you to pay overage fees or wait until next month. That is expensive for what should be a simple tool.",
            color: "from-red-500 to-orange-600",
          },
          {
            icon: MessageCircle,
            stat: "Robotic",
            title: "AI output that does not match your voice",
            description:
              "Generic AI writing tools produce content that sounds like every other AI-generated post on LinkedIn. Without voice training, the output is formulaic, predictable, and immediately recognizable as AI-written by your audience.",
            color: "from-rose-500 to-red-600",
          },
        ]}
        bottomQuote="I want to post on LinkedIn more but I cannot justify the time or cost of existing tools..."
      />

      <LandingFeatures
        badge={{ icon: Sparkles, text: "Free AI Post Generator" }}
        headline={{
          text: "Professional LinkedIn posts in seconds,",
          gradient: "starting free",
        }}
        description="LinkedGrow's AI post generator is designed specifically for LinkedIn. Voice training, multiple post types, and 20+ AI models - with a free plan to get you started."
        features={[
          {
            icon: Brain,
            title: "20+ AI Models to Choose From",
            description:
              "GPT-5, Claude Opus 4.5, Claude Sonnet 4.5, Gemini 3 Pro, Grok 4, Sonar Pro, and more. Each model generates different styles of LinkedIn content. Try different models to find your favorite.",
            highlights: ["6 AI providers", "20+ models", "Your choice"],
            badge: "BYOK",
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: Mic,
            title: "Voice Training Included",
            description:
              "Paste 3 to 5 of your best LinkedIn posts and the AI learns your writing patterns, vocabulary, and tone. Every generated post matches your unique voice. Available even on the free plan so you can experience it before upgrading.",
            highlights: ["Paste sample posts", "AI learns your style", "Authentic output"],
            badge: "Free",
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: PenTool,
            title: "4-Step Post Wizard",
            description:
              "A guided workflow walks you from topic to finished post. Select your topic, choose a post type (storytelling, how-to, thought leadership, or more), set the tone, and generate. Review, edit, and publish in under 2 minutes.",
            highlights: ["Guided workflow", "Multiple post types", "Under 2 minutes"],
            badge: "Guided",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: Wand2,
            title: "Hook Generator",
            description:
              "The first line determines if people read your post. The hook generator creates multiple scroll-stopping opening lines based on your topic. Pick the most compelling hook to maximize your reach and engagement.",
            highlights: ["Multiple options", "Proven patterns", "Higher engagement"],
            badge: "Pro",
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: Lightbulb,
            title: "Reddit to LinkedIn Converter",
            description:
              "Found a viral Reddit post in your niche? Paste the URL and LinkedGrow transforms it into LinkedIn-ready content ideas and drafts. Repurpose trending discussions into professional posts your audience will love.",
            highlights: ["Paste any Reddit URL", "AI transforms content", "Fresh ideas daily"],
            badge: "Starter+",
            color: "from-pink-500 to-rose-500",
          },
          {
            icon: Calendar,
            title: "Schedule and Publish",
            description:
              "After generating your post, publish directly to your LinkedIn profile or schedule it for the perfect time. The content calendar shows your posting schedule so you can maintain consistency week after week.",
            highlights: ["Direct publishing", "Visual calendar", "Optimal timing"],
            badge: "Starter+",
            color: "from-teal-500 to-cyan-600",
          },
        ]}
        ctaText="Start Generating Free"
        ctaHref="/sign-up"
      />

      <LandingHowItWorks
        headline={{
          text: "From idea to LinkedIn post in",
          gradient: "under 2 minutes",
        }}
        description="The AI does the heavy lifting. You just provide the direction."
        steps={[
          {
            number: "01",
            title: "Enter a topic or idea",
            description:
              "Type a topic, key message, or paste a Reddit URL you want to repurpose. The 4-step wizard guides you through selecting a post type and tone so the AI knows exactly what to create.",
            icon: Lightbulb,
            color: "from-cyan-500 to-blue-500",
            time: "20 sec",
          },
          {
            number: "02",
            title: "AI generates your post",
            description:
              "Choose your preferred AI model and hit generate. The AI creates a complete LinkedIn post matching your trained writing voice. Review the output, regenerate with a different model if you prefer, or make quick edits.",
            icon: Brain,
            color: "from-violet-500 to-purple-500",
            time: "30 sec",
          },
          {
            number: "03",
            title: "Polish and publish",
            description:
              "Add a scroll-stopping hook, tweak the formatting, and publish directly to LinkedIn or schedule for later. The whole process takes under 2 minutes from start to finish with no copy-pasting between apps.",
            icon: Zap,
            color: "from-emerald-500 to-green-500",
            time: "30 sec",
          },
        ]}
        totalTime="Under 2 minutes total"
      />

      <LandingBYOK
        badge={{ icon: Key, text: "Smart Economics" }}
        headline={{
          text: "Why pay $99 per month for",
          gradient: "limited AI generations?",
        }}
        description="Most AI LinkedIn tools charge premium prices and cap how many posts you can generate. LinkedGrow starts free and keeps costs dramatically lower with the BYOK model."
        competitor={{
          name: "Typical AI LinkedIn Tools",
          price: "$49-199/month",
          issues: [
            { text: "30 to 100 post generations per month with hard limits" },
            { text: "One AI model with no option to choose alternatives" },
            { text: "No voice training - every post sounds generic and AI-written" },
            { text: "No free plan - must pay to even try the product" },
            { text: "Premium overage fees when you exceed the monthly cap" },
          ],
        }}
        linkedgrow={{
          price: "Free - $19/month",
          apiCost: "$2-4/month",
          benefits: [
            { text: "Free plan with 3 generations per month to start" },
            { text: "Unlimited generations on all paid plans - no caps ever" },
            { text: "20+ AI models - GPT-5, Claude, Gemini, Grok, and more" },
            { text: "Voice training matches your writing style on all plans" },
            { text: "AI costs average $2 to $4 per month with zero markup" },
          ],
        }}
        savingsText="Start free, then save 80%+ versus typical AI LinkedIn tools"
      />

      <LandingTestimonials
        badge={{ icon: Users, text: "Creator Results" }}
        headline={{
          text: "Free AI post generation is helping creators",
          gradient: "post consistently",
        }}
        description="LinkedIn professionals are using LinkedGrow's AI post generator to finally maintain a consistent posting schedule that drives real career and business results."
        stats={[
          { value: "Free", label: "To start generating posts", color: "text-cyan-600 dark:text-cyan-400" },
          { value: "20+", label: "AI models available", color: "text-emerald-600 dark:text-emerald-400" },
          { value: "< 2 min", label: "Per post on average", color: "text-violet-600 dark:text-violet-400" },
          { value: "$2-4", label: "Monthly AI costs (paid plan)", color: "text-amber-600 dark:text-amber-400" },
        ]}
        testimonials={[
          {
            quote:
              "I started with the free plan to test it out. Within a week I upgraded to Starter because the voice training was so good - my AI posts genuinely sound like me. I am posting 4x per week now and my network has grown 30% in two months.",
            author: "Lisa C.",
            role: "Product Manager, 12K Followers",
          },
          {
            quote:
              "The free plan was enough to convince me this is different from every other AI tool I have tried. The voice training actually works. I upgraded and now my total cost is $19 plus about $3 in AI fees. I was paying $79 for a competitor that gave me worse output.",
            author: "Ryan H.",
            role: "Startup Founder, 8K Followers",
          },
          {
            quote:
              "As a freelancer, LinkedIn is my number one lead source but I never posted consistently. With LinkedGrow I generate 5 posts every Monday morning in 10 minutes, schedule them for the week, and I am done. My inbound leads have doubled.",
            author: "Nadia K.",
            role: "Freelance Designer, 6K Followers",
          },
        ]}
      />

      <LandingFAQ
        headline={{
          text: "Free AI Post Generator",
          gradient: "FAQ",
        }}
        description="Everything you need to know about generating LinkedIn posts with AI for free"
        faqs={[
          {
            question: "Is the AI LinkedIn post generator really free?",
            answer:
              "Yes. The free plan includes 3 AI post generations per month with no credit card required. For unlimited generation, paid plans start at $19 per month with BYOK AI costs of $2 to $4 per month.",
          },
          {
            question: "What AI models are available?",
            answer:
              "20+ models including GPT-5, Claude Opus 4.5, Claude Sonnet 4.5, Gemini 3 Pro, Grok 4, Sonar Pro, and more. Switch between models anytime based on your preference.",
          },
          {
            question: "How does voice training work?",
            answer:
              "Paste 3 to 5 of your best LinkedIn posts. The AI analyzes your writing patterns, vocabulary, and tone, then generates all future posts matching your unique voice.",
          },
          {
            question: "Will people know my posts are AI-generated?",
            answer:
              "With voice training, no. The AI matches your established writing style so the output sounds authentically you. This is what sets LinkedGrow apart from generic AI tools.",
          },
          {
            question: "Can I schedule posts generated by AI?",
            answer:
              "Yes. Starter plan includes 10 scheduled posts, Pro and Business include unlimited scheduling. Publish directly to LinkedIn or schedule for optimal posting times.",
          },
          {
            question: "What is the BYOK model?",
            answer:
              "BYOK means Bring Your Own Key. You connect your own API key from OpenAI, Anthropic, or Google and pay them directly. LinkedGrow adds zero markup, keeping costs at $2 to $4 per month.",
          },
          {
            question: "What makes this better than using ChatGPT directly?",
            answer:
              "LinkedGrow is built specifically for LinkedIn with voice training, a 4-step post wizard, direct publishing, scheduling, hook generation, and a content calendar. ChatGPT requires manual prompting and copy-pasting.",
          },
          {
            question: "How do I upgrade from free to paid?",
            answer:
              "Upgrade anytime from your dashboard. Plans start at $19 per month for Starter with unlimited generations. Your voice training and content history carry over automatically.",
          },
        ]}
      />

      <LandingCTA
        badge="Start Generating LinkedIn Posts for Free"
        headline={{
          line1: "Ready to create LinkedIn posts",
          gradient: "in seconds instead of hours?",
        }}
        description="Sign up free, generate your first 3 posts with AI, and experience the difference voice training makes. No credit card needed, no commitment."
        primaryCta={{ text: "Start free - no card needed", href: "/sign-up" }}
        secondaryCta={{ text: "See all plans", href: "/pricing" }}
        trustIndicators={[
          "3 free generations",
          "No credit card",
          "Voice training included",
          "Upgrade anytime",
        ]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
