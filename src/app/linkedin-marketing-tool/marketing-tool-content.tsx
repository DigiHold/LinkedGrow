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
  Megaphone,
  AlertTriangle,
  CircleDollarSign,
  Clock,
  Puzzle,
  Key,
  Users,
  PenTool,
  Calendar,
  BarChart3,
  Image,
  Layers,
  Wand2,
  Target,
  Repeat,
  MessageSquare,
} from "lucide-react";

export function MarketingToolContent() {
  return (
    <main className={V3_ROOT}>
      <Header />

      <LandingHero
        badge={{ icon: Megaphone, text: "LinkedIn Marketing Tool" }}
        headline={{
          line1: "The LinkedIn marketing tool",
          gradient: "that writes like you",
        }}
        descriptionBold="LinkedGrow is a LinkedIn marketing tool that combines AI content creation, scheduling, carousel design, and analytics in one platform."
        description="Most LinkedIn marketing tools make you choose between writing quality and publishing speed. LinkedGrow trains AI on your actual writing voice, then generates posts, hooks, carousels, and images that sound like you wrote them. Schedule everything from a visual content calendar, publish from your own account, and track what performs. Your AI keys, your models, your cost control."
        valuePropBadges={[
          { icon: PenTool, text: "43 AI models" },
          { icon: Calendar, text: "Visual calendar" },
          { icon: CircleDollarSign, text: "From $19/month" },
        ]}
        primaryCta={{ text: "Try free for 7 days", href: "/sign-up" }}
        trustIndicators={["7-day Pro trial included", "Everything included", "Agent working your own account"]}
        video={{
          videoId: "5cE1BRvxfiQ",
          thumbnailUrl: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/video-thumbnail-promo.avif",
          duration: "0:10",
          ctaText: "See Pricing",
          ctaHref: "/pricing",
        }}
      />

      <LandingPainPoints
        badge={{ icon: AlertTriangle, text: "The Marketing Stack Problem" }}
        badgeColor="red"
        headline={{
          text: "LinkedIn marketing shouldn't require",
          gradient: "5 different tools.",
        }}
        descriptionBold="Most creators and marketers juggle a writing tool, an image editor, a scheduling app, an analytics dashboard, and a spreadsheet to track everything."
        description="That fragmented workflow costs time, money, and consistency. You lose your writing voice switching between tools, forget to post because scheduling lives in a separate app, and can't connect what you published to what actually performed. A proper LinkedIn marketing tool handles the entire workflow in one place."
        problems={[
          {
            icon: Puzzle,
            stat: "3-5",
            title: "Tools stitched together for one LinkedIn workflow",
            description:
              "A typical LinkedIn marketing stack includes ChatGPT or Claude for writing, Canva for images, Buffer or Hootsuite for scheduling, LinkedIn's native analytics for tracking, and a spreadsheet for content planning. Each tool has its own login, pricing tier, and learning curve. The handoff between them is where posts fall through the cracks.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: CircleDollarSign,
            stat: "$80-200+",
            title: "Monthly cost of a fragmented marketing stack",
            description:
              "ChatGPT Plus at $20, Canva Pro at $13, Buffer at $15 to $100, a scheduling tool at $30+, and maybe a LinkedIn analytics tool on top. Those subscriptions add up fast, especially when each tool only handles one piece of your LinkedIn marketing. And none of them know your writing voice.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: Clock,
            stat: "45-90 min",
            title: "Per post when you're switching between tools",
            description:
              "Write in one app, copy to another, generate an image somewhere else, download it, upload it to the scheduler, set the time, and hope the formatting survived the copy-paste. That 45-minute process for a single post is why most people give up on consistent LinkedIn marketing after a few weeks.",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: MessageSquare,
            stat: "Lost",
            title: "Your writing voice disappears in generic AI output",
            description:
              "Generic AI tools produce generic LinkedIn posts. Without voice training, every AI-generated post sounds like every other AI-generated post. Your audience can tell. Engagement drops because the content doesn't sound like you, and the whole point of LinkedIn marketing is building a personal brand that people recognize.",
            color: "from-rose-500 to-red-600",
          },
        ]}
        bottomQuote="I was spending more time managing my marketing tools than actually creating content..."
      />

      <LandingFeatures
        badge={{ icon: Target, text: "Complete Marketing Stack" }}
        headline={{
          text: "Everything a LinkedIn marketing tool",
          gradient: "should include",
        }}
        description="LinkedGrow replaces your entire LinkedIn marketing stack with one platform. Write, design, schedule, publish, and analyze from a single dashboard."
        features={[
          {
            icon: PenTool,
            title: "AI Content Generation",
            description:
              "Generate LinkedIn posts using 43 AI models from OpenAI, Anthropic, Google, xAI, Perplexity, and Kimi. The voice training system analyzes up to 5 of your best posts to match your personal writing style. Every generated post sounds like you, not like a chatbot.",
            highlights: ["43 AI models", "Voice training", "Unlimited via BYOK"],
            badge: "LinkedGrow",
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: Calendar,
            title: "Scheduling and Content Calendar",
            description:
              "Schedule posts for optimal publishing times with a visual content calendar that shows your week and month at a glance. Drag posts, adjust timing, and plan weeks ahead. Publishing happens from your own account, so your posts are exactly like manual ones.",
            highlights: ["Visual calendar", "Optimal timing", "Agent on your account"],
            badge: "From Pro",
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: Image,
            title: "AI Image Generation",
            description:
              "Create custom images for your posts directly in the editor. Choose from 14+ image models from Google (Imagen 4), OpenAI (GPT Image 1.5), and Replicate (FLUX.2 Pro). No Canva subscription, no stock photo hunting, no design skills needed. Images cost $0.02 to $0.08 each at provider rates.",
            highlights: ["14+ image models", "In-editor creation", "$0.02-0.08 per image"],
            badge: "Pro Plan",
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: Layers,
            title: "Carousel Generator",
            description:
              "Build multi-slide LinkedIn carousels that consistently outperform text-only posts in engagement. AI generates slide content from your topic, and the visual builder lets you customize each slide with your brand colors, fonts, and logo. Export and schedule from the same dashboard.",
            highlights: ["Multi-slide builder", "AI content assist", "Brand customization"],
            badge: "Business",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: BarChart3,
            title: "Analytics Dashboard",
            description:
              "Track what's working across your LinkedIn content. See engagement trends, find your best posting times, identify which topics your audience responds to, and measure growth over time. Data-driven decisions replace guesswork, and everything lives inside the same tool where you create.",
            highlights: ["Engagement metrics", "Best time insights", "Trend analysis"],
            badge: "Pro Plan",
            color: "from-pink-500 to-rose-500",
          },
          {
            icon: Repeat,
            title: "Content Repurposing",
            description:
              "Turn your existing blog posts, YouTube videos, Reddit discussions, and web pages into LinkedIn content. Paste a URL and LinkedGrow's AI extracts the key points, reformats them for LinkedIn, and applies your writing voice. One piece of content becomes multiple LinkedIn posts.",
            highlights: ["Blog to LinkedIn", "YouTube to LinkedIn", "Reddit to LinkedIn"],
            badge: "LinkedGrow",
            color: "from-teal-500 to-cyan-600",
          },
        ]}
        ctaText="Start Your Free Trial"
        ctaHref="/sign-up"
      />

      <LandingHowItWorks
        headline={{
          text: "From idea to published post",
          gradient: "in under 2 minutes",
        }}
        description="LinkedGrow handles the entire LinkedIn marketing workflow in a single platform. No tool-switching, no copy-pasting, no lost formatting."
        steps={[
          {
            number: "01",
            title: "Train your writing voice",
            description:
              "Paste up to 5 of your best LinkedIn posts into the voice training system. LinkedGrow's AI analyzes your sentence structure, word choices, and tone to create a voice profile. Every post generated after this step matches your personal style, so your audience never notices the assist.",
            icon: Wand2,
            color: "from-cyan-500 to-blue-500",
            time: "5 min setup",
          },
          {
            number: "02",
            title: "Generate or repurpose content",
            description:
              "Start from a topic, a content idea, a blog URL, a YouTube link, or a Reddit thread. Pick your preferred AI model and generate a LinkedIn post in your trained voice. Use the hook generator to test different opening lines. Add an AI-generated image or build a carousel slide deck.",
            icon: PenTool,
            color: "from-violet-500 to-purple-500",
            time: "60 sec",
          },
          {
            number: "03",
            title: "Schedule from the content calendar",
            description:
              "Pick the optimal date and time, or let LinkedGrow suggest the best posting window. View your upcoming week and month in the visual calendar, spot gaps, and balance your content mix. Posts publish from your own account at the exact scheduled time.",
            icon: Calendar,
            color: "from-emerald-500 to-green-500",
            time: "15 sec",
          },
          {
            number: "04",
            title: "Track and refine",
            description:
              "Review engagement metrics after each post. Identify which topics, formats, and posting times drive the best results. Use those insights to inform your next round of content. The feedback loop gets tighter each week because analytics and creation live in the same tool.",
            icon: BarChart3,
            color: "from-amber-500 to-yellow-500",
            time: "Ongoing",
          },
        ]}
        totalTime="Under 2 minutes per post"
      />

      <LandingBYOK
        badge={{ icon: Key, text: "BYOK Model" }}
        headline={{
          text: "A LinkedIn marketing tool that costs less than",
          gradient: "a single design subscription",
        }}
        description="Most LinkedIn marketing tools charge per credit, per seat, or per generation. LinkedGrow uses the BYOK model: connect your own AI API keys and pay provider rates directly. No markup, no caps, no surprises."
        competitor={{
          name: "Typical Marketing Stack",
          price: "$80-200+/month",
          issues: [
            { text: "ChatGPT Plus ($20) + Canva Pro ($13) + scheduler ($30+) + analytics" },
            { text: "Credit-based AI tools run out mid-month and push upsells" },
            { text: "Each tool has a separate login, billing cycle, and learning curve" },
            { text: "No voice training - generic AI output sounds like every other post" },
            { text: "Content created in one tool, scheduled in another, analyzed in a third" },
          ],
        }}
        linkedgrow={{
          price: "$99/month",
          apiCost: "$2-4/month",
          benefits: [
            { text: "One platform for writing, images, carousels, scheduling, and analytics" },
            { text: "Unlimited AI generation with BYOK - no credits, no caps, no markup" },
            { text: "Voice training matches your personal writing style across every post" },
            { text: "AI costs average $2 to $4 per month at direct provider rates" },
            { text: "26+ text models and 14+ image models - you choose the best for each task" },
          ],
        }}
        savingsText="Replace 3-5 tools with one platform and cut your LinkedIn marketing costs by 60-80%"
      />

      <LandingTestimonials
        badge={{ icon: Users, text: "Marketing Results" }}
        headline={{
          text: "Creators who consolidated their marketing stack are",
          gradient: "posting more consistently",
        }}
        description="When your entire LinkedIn marketing workflow lives in one tool, the friction that stops most people from posting regularly disappears."
        stats={[
          { value: "26+", label: "AI models for content creation", color: "text-cyan-600 dark:text-cyan-400" },
          { value: "$2-4", label: "Monthly AI costs with BYOK", color: "text-violet-600 dark:text-violet-400" },
          { value: "< 2 min", label: "From idea to scheduled post", color: "text-emerald-600 dark:text-emerald-400" },
          { value: "14+", label: "Image generation models", color: "text-amber-600 dark:text-amber-400" },
        ]}
        testimonials={[
          {
            quote:
              "I was paying for ChatGPT, Canva, and Buffer separately. Switched to LinkedGrow and now I spend $99 plus about $3 in API costs. The voice training alone is worth the switch because my posts actually sound like me instead of generic AI.",
            author: "Rachel T.",
            role: "Marketing Consultant, 14K Followers",
          },
          {
            quote:
              "The content repurposing feature changed everything. I turn every blog post into 3-4 LinkedIn posts now. Before LinkedGrow I was writing each post from scratch, which meant I posted maybe twice a month. Now it's 3-4 times per week.",
            author: "James P.",
            role: "SaaS Founder, 9K Followers",
          },
          {
            quote:
              "Having analytics in the same tool where I create content is underrated. I can see exactly which hooks work, which topics my audience cares about, and adjust my next post without leaving the app. That feedback loop makes the whole thing compound.",
            author: "Priya S.",
            role: "Executive Coach, 21K Followers",
          },
        ]}
      />

      <LandingFAQ
        headline={{
          text: "LinkedIn Marketing Tool",
          gradient: "FAQ",
        }}
        description="Common questions about using LinkedGrow as your LinkedIn marketing tool"
        faqs={[
          {
            question: "What is a LinkedIn marketing tool?",
            answer:
              "A LinkedIn marketing tool is software that helps you create, schedule, publish, and analyze LinkedIn content from a single platform. Instead of writing posts directly in LinkedIn, switching to a design tool for images, and manually tracking performance, a LinkedIn marketing tool combines these steps into one workflow. LinkedGrow adds AI-powered content generation with 26+ models through the BYOK model.",
          },
          {
            question: "How much does a LinkedIn marketing tool cost?",
            answer:
              "LinkedIn marketing tools range from $99 per month (LinkedGrow Pro, agents included) to $299 per seat per month (Sprout Social). Most content-focused tools charge $30 to $80 per month. LinkedGrow uses the BYOK model where your AI API costs average $2 to $4 per month on top of the subscription, giving you unlimited AI generation without monthly caps.",
          },
          {
            question: "Is LinkedGrow better than using LinkedIn natively?",
            answer:
              "LinkedIn's built-in tools cover basic posting and scheduling. LinkedGrow adds AI content generation trained on your writing voice, carousel creation, advanced scheduling with content calendar, hook generation, content repurposing from blogs, YouTube, and Reddit, plus analytics. The biggest difference is the AI writing assistant that maintains your personal voice across every post.",
          },
          {
            question: "Can I use LinkedGrow as my only LinkedIn marketing tool?",
            answer:
              "Yes. LinkedGrow covers the full LinkedIn content marketing workflow: AI-powered post writing, image generation, carousel creation, scheduling with content calendar, publishing straight from your own account, and performance analytics.",
          },
          {
            question: "What AI models does LinkedGrow support?",
            answer:
              "LinkedGrow supports 26+ text AI models across 6 providers (OpenAI, Anthropic, Google, xAI, Perplexity, Kimi) and 14+ image models from Google, OpenAI, and Replicate. You bring your own API keys and pay provider rates directly, with no markup or credit systems.",
          },
          {
            question: "Does LinkedGrow work with LinkedIn company pages?",
            answer:
              "Yes. LinkedGrow publishes to both personal profiles and company pages you manage, straight from your own account. Schedule and publish company page content with the same AI tools, calendar, and analytics available for personal profiles.",
          },
          {
            question: "How is LinkedGrow different from Hootsuite or Buffer?",
            answer:
              "Hootsuite and Buffer are general social media management tools that support multiple platforms. LinkedGrow is built specifically for LinkedIn marketing. Key differences include AI content generation with voice training, BYOK pricing (no credit limits), carousel generator, hook generator, content repurposing from multiple sources, and LinkedIn-specific analytics.",
          },
          {
            question: "What is the BYOK model?",
            answer:
              "BYOK stands for Bring Your Own Key. Instead of paying for AI credits, you connect your own API keys from providers like OpenAI, Anthropic, or Google. You pay the provider directly at their published rates, which average $2 to $4 per month for typical LinkedIn posting volume. Unlimited generation, no caps, no markup.",
          },
        ]}
      />

      <LandingRelatedContent
        headline="Related Resources"
        links={[
          { title: "LinkedIn Content Creation Tools", href: "/linkedin-content-creation-tools" },
          { title: "LinkedIn Automation Tools", href: "/linkedin-automation-tools" },
          { title: "LinkedIn Lead Generation Tools", href: "/linkedin-lead-generation-tools" },
          { title: "LinkedIn Post Scheduler", href: "/linkedin-post-scheduler" },
          { title: "Best LinkedIn AI Tools 2026", href: "/blog/best-linkedin-ai-tools-2026" },
          { title: "LinkedIn Content Strategy for Coaches", href: "/blog/linkedin-content-strategy-coaches" },
        ]}
      />

      <LandingCTA
        badge="LinkedIn Marketing Tool"
        headline={{
          line1: "Ready to simplify your",
          gradient: "LinkedIn marketing?",
        }}
        description="Stop juggling 5 tools for one workflow. LinkedGrow gives you AI content creation, scheduling, carousels, images, and analytics in one platform, with voice training that keeps every post sounding like you."
        primaryCta={{ text: "Start free for 7 days", href: "/sign-up" }}
        trustIndicators={[
          "7-day Pro trial included",
          "43 AI models via BYOK",
          "Your own AI key",
          "Agent working your own account",
        ]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
