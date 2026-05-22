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
  Award,
  Shield,
  BarChart3,
  PenTool,
  Layers,
} from "lucide-react";

export function BestPostGeneratorContent() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <AnimatedBackground />
      <Header />

      <LandingHero
        badge={{ icon: Award, text: "Best LinkedIn Post Generator 2026" }}
        headline={{
          line1: "Best LinkedIn Post Generator:",
          gradient: "What to Look For + Why LinkedGrow Wins",
        }}
        descriptionBold="The best LinkedIn post generator comes down to three things: AI model choice, voice training, and transparent pricing."
        description="Most LinkedIn AI tools lock you into a single model, cap your generations, and bury the real cost in opaque pricing. LinkedGrow approaches it differently with 26+ AI models via BYOK, voice training on every plan, and total cost transparency. Here is what to evaluate and why this approach wins."
        valuePropBadges={[
          { icon: Award, text: "26+ AI models" },
          { icon: Mic, text: "Voice training" },
          { icon: CircleDollarSign, text: "80% cheaper" },
        ]}
        primaryCta={{ text: "Try the best generator", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={["7-day Pro trial included", "No credit card required", "Cancel anytime"]}
        video={{
          videoId: "5cE1BRvxfiQ",
          thumbnailUrl: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/video-thumbnail-promo.avif",
          duration: "0:10",
          ctaText: "See Pricing",
          ctaHref: "/pricing",
        }}
      />

      <LandingPainPoints
        badge={{ icon: AlertTriangle, text: "The Problem with Most AI Tools" }}
        badgeColor="orange"
        headline={{
          text: "Most AI LinkedIn tools are expensive,",
          gradient: "limited, and generic.",
        }}
        descriptionBold="You deserve better than one model, capped generations, and robotic output."
        description="The typical LinkedIn AI tool locks you into a single AI model, caps your generations at 30 to 100 per month, charges $49 to $199, and produces content that sounds like every other AI-written post on the platform. That is not the best. That is the status quo."
        problems={[
          {
            icon: Layers,
            stat: "1",
            title: "AI model on most platforms",
            description:
              "Most LinkedIn tools use a single AI model (usually an older GPT version) for all generations. You get one writing style with no alternatives. Different topics need different models - a storytelling post needs a different touch than a technical how-to.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: Target,
            stat: "30-100",
            title: "Generation caps per month",
            description:
              "Most tools limit you to 30 to 100 AI generations per month. If you post 5 times per week and iterate on each post, you hit the cap in 2 to 3 weeks. Then you either stop posting or pay overage fees to keep going.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: CircleDollarSign,
            stat: "$49-199",
            title: "Monthly cost for basic functionality",
            description:
              "The standard price for LinkedIn AI tools is $49 to $199 per month. For that price you get capped generations, one model, and often no image generation, analytics, or scheduling. The value proposition is poor.",
            color: "from-red-500 to-orange-600",
          },
          {
            icon: Mic,
            stat: "None",
            title: "Voice training on competitors",
            description:
              "Without voice training, AI-generated posts sound generic and formulaic. Your audience can spot them immediately. Most LinkedIn tools do not offer any way to train the AI on your personal writing style and vocabulary.",
            color: "from-rose-500 to-red-600",
          },
        ]}
        bottomQuote="I have tried 4 different AI LinkedIn tools and they all produce the same generic, capped, overpriced output..."
      />

      <LandingFeatures
        badge={{ icon: Award, text: "Why LinkedGrow Is the Best" }}
        headline={{
          text: "What makes this the",
          gradient: "best AI post generator",
        }}
        description="LinkedGrow addresses every limitation of typical LinkedIn AI tools. More models, no caps, voice training, and integrated tools at a fraction of the cost."
        features={[
          {
            icon: Brain,
            title: "26+ AI Models",
            description:
              "The latest models from OpenAI, Anthropic, Google, xAI, Perplexity, and Kimi. Each model has different strengths. Use Claude for nuanced thought leadership, ChatGPT for storytelling, Gemini for speed. Switch between models per post.",
            highlights: ["6 AI providers", "26+ models", "Switch per post"],
            badge: "BYOK",
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: Mic,
            title: "Voice Training",
            description:
              "Paste 3 to 5 of your best LinkedIn posts. The AI analyzes your writing patterns, vocabulary, sentence length, and tone. Every post it generates matches your unique voice. This is the single most important feature for authentic AI content.",
            highlights: ["Style analysis", "Tone matching", "Authentic output"],
            badge: "Unique",
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: Sparkles,
            title: "Unlimited Generations",
            description:
              "Every paid plan includes unlimited AI post generations. No monthly caps, no credit limits, no overage fees. Generate as many posts as you need, iterate as much as you want, and never worry about hitting a limit mid-month.",
            highlights: ["No caps", "No credits", "No overage fees"],
            badge: "Unlimited",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: Wand2,
            title: "Integrated Hook Generator",
            description:
              "The first line of your post determines if people read the rest. The built-in hook generator creates multiple scroll-stopping opening lines for each post. Pick the one that grabs the most attention and watch your engagement climb.",
            highlights: ["Multiple hooks", "Proven patterns", "Higher read rate"],
            badge: "Pro",
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: BarChart3,
            title: "Analytics and A/B Testing",
            description:
              "Track which posts perform best, identify optimal posting times, and run A/B tests to scientifically determine what resonates with your audience. Data-driven content creation instead of guessing.",
            highlights: ["Engagement tracking", "Best time insights", "A/B testing"],
            badge: "Pro/Biz",
            color: "from-pink-500 to-rose-500",
          },
          {
            icon: Shield,
            title: "All-in-One Platform",
            description:
              "Post generation, image creation, carousel building, scheduling, analytics, network notifications, and a content calendar. Everything in one platform instead of juggling multiple tools. One subscription, one dashboard.",
            highlights: ["6+ tools", "One platform", "One price"],
            badge: "Complete",
            color: "from-teal-500 to-cyan-600",
          },
        ]}
        ctaText="Try the Best Generator"
        ctaHref="/sign-up"
      />

      <LandingHowItWorks
        headline={{
          text: "See why 179+ founders chose",
          gradient: "LinkedGrow",
        }}
        description="The best AI post generator works in under 2 minutes, every time."
        steps={[
          {
            number: "01",
            title: "Enter your topic",
            description:
              "Type a topic, key insight, or paste a Reddit URL. Select a post type (storytelling, how-to, thought leadership, listicle, and more) and choose your preferred AI model from 26+ options.",
            icon: PenTool,
            color: "from-cyan-500 to-blue-500",
            time: "20 sec",
          },
          {
            number: "02",
            title: "AI generates in your voice",
            description:
              "The AI creates a complete LinkedIn post matching your trained writing style. Review, edit, or regenerate with a different model for a fresh perspective. Each model brings different strengths to the same topic.",
            icon: Brain,
            color: "from-violet-500 to-purple-500",
            time: "30 sec",
          },
          {
            number: "03",
            title: "Add visuals if you want",
            description:
              "Optionally generate a custom AI image with the latest models from Google, OpenAI, or Replicate directly in the editor. Or build a carousel. Attach to your post in one click - no separate tools needed.",
            icon: Sparkles,
            color: "from-emerald-500 to-green-500",
            time: "30 sec",
          },
          {
            number: "04",
            title: "Publish or schedule",
            description:
              "Publish immediately to LinkedIn or schedule for the optimal time. The content calendar keeps your posting consistent. Set it and forget it - LinkedGrow handles the rest.",
            icon: Zap,
            color: "from-amber-500 to-yellow-500",
            time: "10 sec",
          },
        ]}
        totalTime="Under 2 minutes per post"
      />

      <LandingBYOK
        badge={{ icon: Key, text: "Best Value in the Market" }}
        headline={{
          text: "Why LinkedGrow beats every",
          gradient: "competitor on value",
        }}
        description="The best AI LinkedIn post generator is also the most affordable. BYOK pricing eliminates the markup that makes other tools so expensive."
        competitor={{
          name: "Typical LinkedIn AI Tools",
          price: "$49-199/month",
          issues: [
            { text: "1 AI model with no alternatives or choice" },
            { text: "30 to 100 generation caps with premium overage fees" },
            { text: "No voice training - generic output for everyone" },
            { text: "Separate subscriptions needed for images, scheduling, analytics" },
            { text: "High monthly cost for basic AI writing functionality" },
          ],
        }}
        linkedgrow={{
          price: "$13-55/month",
          apiCost: "$2-4/month",
          benefits: [
            { text: "26+ AI models - ChatGPT, Claude, Gemini, Grok, Perplexity, Kimi, and more" },
            { text: "Unlimited generations on all paid plans - no caps ever" },
            { text: "Voice training that matches your exact writing style" },
            { text: "Images, scheduling, analytics, hooks, carousels all included" },
            { text: "BYOK AI costs of $2 to $4 per month - zero markup" },
          ],
        }}
        savingsText="The best AI generator at 80% less than the competition"
      />

      <LandingTestimonials
        badge={{ icon: Users, text: "Why Creators Switch" }}
        headline={{
          text: "Creators are switching to the",
          gradient: "best AI post generator",
        }}
        description="LinkedIn professionals who have tried multiple AI tools are choosing LinkedGrow for its model variety, voice training, and value."
        stats={[
          { value: "26+", label: "AI models to choose from", color: "text-cyan-600 dark:text-cyan-400" },
          { value: "0", label: "Generation caps on paid plans", color: "text-emerald-600 dark:text-emerald-400" },
          { value: "80%", label: "Cheaper than competitors", color: "text-violet-600 dark:text-violet-400" },
          { value: "179+", label: "Founders trust LinkedGrow", color: "text-amber-600 dark:text-amber-400" },
        ]}
        testimonials={[
          {
            quote:
              "I switched from Taplio after hitting the generation cap for the third month in a row. LinkedGrow gives me unlimited generations, 26+ models to choose from, and voice training that actually works. My total cost dropped from $79 to $22.",
            author: "Thomas B.",
            role: "SaaS Founder, 31K Followers",
          },
          {
            quote:
              "Having 26+ models is not a gimmick - it genuinely matters. I use Claude for my leadership posts and ChatGPT for casual storytelling. Different models, different voices, better content. And the BYOK pricing is unbeatable.",
            author: "Amara J.",
            role: "Executive Coach, 45K Followers",
          },
          {
            quote:
              "The voice training is what makes this the best generator I have used. I pasted 5 of my posts and every AI-generated post since then sounds exactly like me. People have no idea I am using AI. That is the whole point.",
            author: "Kevin D.",
            role: "Marketing VP, 20K Followers",
          },
        ]}
      />

      <LandingFAQ
        headline={{
          text: "Best AI Generator",
          gradient: "FAQ",
        }}
        description="Common questions about the best AI LinkedIn post generator"
        faqs={[
          {
            question: "What makes LinkedGrow the best AI LinkedIn post generator?",
            answer:
              "26+ AI models instead of one, voice training for authentic output, unlimited generations with no caps, and BYOK pricing at 80% less than competitors. Plus integrated image generation, scheduling, analytics, and more.",
          },
          {
            question: "How does it compare to Taplio, AuthoredUp, or Supergrow?",
            answer:
              "Most competitors offer 1 model, cap generations, and charge $49 to $199. LinkedGrow offers 26+ models, unlimited generations, voice training, and integrated tools for $19 to $79 plus $2 to $4 in BYOK AI costs.",
          },
          {
            question: "Why do 26+ AI models matter?",
            answer:
              "Different models excel at different content types. ChatGPT for storytelling, Claude for thought leadership, Gemini for speed. Having choice means better content for every post type.",
          },
          {
            question: "How accurate is voice training?",
            answer:
              "Very. Paste 3 to 5 of your best posts and the AI learns your style, vocabulary, and tone. Users report their audience cannot distinguish AI-generated from manually written posts.",
          },
          {
            question: "Is there a free trial?",
            answer:
              "Yes. 3 generations per month with voice training and all AI models. No credit card. Paid plans start at $19 per month for unlimited.",
          },
          {
            question: "What AI models are available?",
            answer:
              "The latest models from OpenAI, Anthropic, Google, xAI, Perplexity, and Kimi - 26+ text models in total. Plus 14 image models from OpenAI, Google, and Replicate.",
          },
          {
            question: "How much does it cost?",
            answer:
              "7-day Pro trial included. Starter $19 per month, Pro $39 per month, Business $79 per month with carousels, A/B testing, and team collaboration. BYOK AI costs average $2 to $4 per month with zero markup. 80% less than typical LinkedIn AI tools.",
          },
          {
            question: "Can I publish directly to LinkedIn?",
            answer:
              "Yes. Publish immediately or schedule for later. Content calendar, optimal time suggestions, profiles and company pages supported.",
          },
        ]}
      />

      <LandingRelatedContent
        headline="Related Resources"
        links={[
          { title: "AI Post Generator", href: "/" },
          { title: "Best LinkedIn AI Tools 2026", href: "/blog/best-linkedin-ai-tools-2026" },
          { title: "Free LinkedIn Post Generator", href: "/free-linkedin-post-generator-ai" },
        ]}
      />

      <LandingCTA
        badge="Try the Best AI LinkedIn Post Generator"
        headline={{
          line1: "Ready to use the best",
          gradient: "AI post generator for LinkedIn?",
        }}
        description="26+ AI models, voice training, unlimited generations, and 80% lower cost than competitors. Join 179+ founders who made the switch."
        primaryCta={{ text: "Start free - no card needed", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={[
          "7-day Pro trial included",
          "26+ AI models",
          "Voice training",
          "Cancel anytime",
        ]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
