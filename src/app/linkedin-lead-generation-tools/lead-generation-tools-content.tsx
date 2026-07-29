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
  Target,
  AlertTriangle,
  CircleDollarSign,
  Clock,
  ShieldAlert,
  Key,
  Users,
  PenTool,
  Calendar,
  BarChart3,
  Image,
  Layers,
  Wand2,
  MessageSquare,
  Repeat,
  TrendingUp,
} from "lucide-react";

export function LeadGenerationToolsContent() {
  return (
    <main className={V3_ROOT}>
      <Header />

      <LandingHero
        badge={{ icon: Target, text: "LinkedIn Lead Generation Tools" }}
        headline={{
          line1: "LinkedIn lead generation tools",
          gradient: "that start with content",
        }}
        descriptionBold="LinkedGrow is a LinkedIn lead generation tool that turns your expertise into inbound leads through AI-powered content creation, scheduling, and analytics."
        description="Most LinkedIn lead generation tools focus on outreach automation, connection bots, and mass messaging. That approach risks your account and annoys prospects. LinkedGrow takes the opposite approach: help you publish content that positions you as the expert your ideal clients already want to hire. AI trained on your writing voice generates posts, hooks, carousels, and images that attract leads to you instead of chasing them. Schedule from a visual calendar, publish from your own account, and track which content drives the most profile views and connection requests."
        valuePropBadges={[
          { icon: PenTool, text: "43 AI models" },
          { icon: Calendar, text: "Content calendar" },
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
        badge={{ icon: AlertTriangle, text: "The Lead Generation Problem" }}
        badgeColor="red"
        headline={{
          text: "Most LinkedIn lead generation tools",
          gradient: "put your account at risk.",
        }}
        descriptionBold="Connection bots, auto-messaging sequences, and engagement pods generate activity, not leads. LinkedIn's abuse detection is better than ever, and accounts get restricted daily."
        description="The tools that promise 50 leads per week through automation are the same tools that get accounts flagged, restricted, or permanently banned. Real LinkedIn lead generation works differently: you publish content that proves your expertise, and qualified prospects reach out to you. That inbound approach requires consistent, high-quality posting, which is exactly what the right LinkedIn lead generation tools should help you do."
        problems={[
          {
            icon: ShieldAlert,
            stat: "38%",
            title: "Of automated LinkedIn accounts face restrictions within 90 days",
            description:
              "LinkedIn's automated behavior detection has improved significantly since 2024. Tools that send mass connection requests, auto-comment on posts, or run engagement pods now trigger restrictions faster than they generate leads. A restricted account loses access to messaging, posting, and search, which means zero lead generation until the restriction lifts.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: CircleDollarSign,
            stat: "$99-299",
            title: "Monthly cost of outreach tools that may get your account banned",
            description:
              "Expandi, Dripify, and similar outreach automation tools charge $59 to $99 per month per seat. Add LinkedIn Sales Navigator at $99 per month for the prospecting data, and you are spending $150 to $200 per month on a strategy that puts your primary professional network at risk. If your account gets restricted, that investment becomes a liability.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: Clock,
            stat: "2-3%",
            title: "Average reply rate on cold LinkedIn outreach messages",
            description:
              "Cold outreach on LinkedIn has a 2 to 3% reply rate on a good day. That means for every 100 connection requests you automate, 2 to 3 people respond, and most of those responses are polite declines. Compare that to inbound leads from content, where someone has already read your thinking, understands your expertise, and reaches out because they want to work with you.",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: MessageSquare,
            stat: "0",
            title: "Authority built through automated connection requests",
            description:
              "Outreach automation fills your inbox with conversations, but it doesn't build authority or trust. Content does both. A prospect who reads 4 of your LinkedIn posts before they message you is already warmed up. They know your perspective, your expertise, and your style. That first conversation starts at a completely different level than a cold pitch.",
            color: "from-rose-500 to-red-600",
          },
        ]}
        bottomQuote="I spent $200/month on automation tools and generated fewer leads than when I just posted consistently..."
      />

      <LandingFeatures
        badge={{ icon: TrendingUp, text: "Content-First Lead Generation" }}
        headline={{
          text: "LinkedIn lead generation tools",
          gradient: "that build authority",
        }}
        description="LinkedGrow helps you publish the kind of content that makes prospects come to you. Every feature is designed to make consistent, high-quality LinkedIn posting as fast and frictionless as possible."
        features={[
          {
            icon: PenTool,
            title: "AI Content Generation with Voice Training",
            description:
              "Generate LinkedIn posts that sound like you wrote them, not like a chatbot. The voice training system analyzes up to 5 of your best posts and matches your sentence structure, word choices, and tone across every generated post. Choose from 43 AI models (OpenAI, Anthropic, Google, xAI, Perplexity, Kimi) and generate unlimited posts with the BYOK model.",
            highlights: ["Voice training", "43 AI models", "Unlimited via BYOK"],
            badge: "LinkedGrow",
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: Wand2,
            title: "Hook Generator for Scroll-Stopping Openings",
            description:
              "The first line of your LinkedIn post decides whether someone reads the rest or keeps scrolling. The hook generator creates multiple opening line variants for any topic, tested against engagement patterns from high-performing LinkedIn content. A strong hook on a lead-generating post is the difference between 200 views and 20,000.",
            highlights: ["Multiple variants", "Pattern-tested", "One-click apply"],
            badge: "Pro Plan",
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: Layers,
            title: "Carousel Generator for High-Engagement Content",
            description:
              "LinkedIn carousels consistently outperform text posts in engagement and saves. The carousel generator builds multi-slide documents from your topic, applies your brand colors and fonts, and exports them ready to publish. Carousels that teach something specific generate the most profile visits, which is where lead generation from content begins.",
            highlights: ["AI slide content", "Brand customization", "Direct publishing"],
            badge: "Business",
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: Calendar,
            title: "Content Calendar and Post Scheduling",
            description:
              "Consistent posting is the single biggest factor in LinkedIn lead generation through content. The visual content calendar shows your week and month at a glance, so you can spot gaps before they happen. Schedule posts at optimal times and publish through LinkedIn's official Share API, which means your content is treated identically to manual posts.",
            highlights: ["Visual calendar", "Optimal timing", "Agent on your account"],
            badge: "From Pro",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: Image,
            title: "AI Image Generation",
            description:
              "Posts with images get 2x more engagement on LinkedIn than text-only posts. Generate custom images directly in the editor using 14+ models from Google (Imagen 4), OpenAI (GPT Image 1.5), and Replicate (FLUX.2 Pro). Each image costs $0.02 to $0.08 at provider rates, a fraction of what a stock photo subscription would cost.",
            highlights: ["14+ image models", "In-editor creation", "$0.02-0.08 per image"],
            badge: "Pro Plan",
            color: "from-pink-500 to-rose-500",
          },
          {
            icon: Repeat,
            title: "Content Repurposing from Multiple Sources",
            description:
              "Turn existing blog posts, YouTube videos, Reddit discussions, and web pages into LinkedIn content. Paste a URL and LinkedGrow extracts the key points, reformats them for LinkedIn, and applies your writing voice. One blog article can become 3 to 4 LinkedIn posts, each one a new opportunity to attract leads who would never have found the original content.",
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
          text: "Content-first lead generation",
          gradient: "in 4 steps",
        }}
        description="LinkedGrow handles the entire content-to-lead workflow. Create, schedule, publish, and track, all from one platform."
        steps={[
          {
            number: "01",
            title: "Train your voice and define your niche",
            description:
              "Paste up to 5 of your best LinkedIn posts into the voice training system. Set your business description, target audience, and writing tone in your profile. These inputs shape every piece of AI-generated content so your posts consistently speak to the prospects you want to attract, in the voice they already associate with your expertise.",
            icon: Wand2,
            color: "from-cyan-500 to-blue-500",
            time: "5 min setup",
          },
          {
            number: "02",
            title: "Create content that demonstrates expertise",
            description:
              "Generate posts from topics, repurpose your existing blog and video content, or start from content ideas suggested by the AI. Use the hook generator to test opening lines. Add images or build a carousel for higher engagement. Every piece of content should teach something specific, share an honest perspective, or solve a problem your ideal client faces.",
            icon: PenTool,
            color: "from-violet-500 to-purple-500",
            time: "60 sec",
          },
          {
            number: "03",
            title: "Schedule and publish consistently",
            description:
              "Load your content calendar for the week. Fill gaps, set optimal posting times, and let the scheduler handle publishing from your own account. Consistency is what separates accounts that generate leads from accounts that don't. Aim for 3 to 5 posts per week, and the calendar makes that cadence visible and manageable.",
            icon: Calendar,
            color: "from-emerald-500 to-green-500",
            time: "15 sec",
          },
          {
            number: "04",
            title: "Track engagement and refine your approach",
            description:
              "Review analytics after each post. Which topics drive the most profile views? Which hooks get the most engagement? Which formats (text, image, carousel) generate the most connection requests? Use those insights to double down on what works. The feedback loop between content and analytics, inside one tool, makes your lead generation compound over weeks.",
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
          text: "LinkedIn lead generation that costs less than",
          gradient: "one outreach tool",
        }}
        description="Outreach automation tools charge $59 to $99 per seat per month and put your account at risk. LinkedGrow starts at $99 per month with unlimited AI generation through the BYOK model."
        competitor={{
          name: "Typical Outreach Stack",
          price: "$150-300+/month",
          issues: [
            { text: "Outreach tool ($59-99) + Sales Navigator ($99) + CRM add-ons" },
            { text: "Account restriction risk from automated connection requests and messages" },
            { text: "2-3% cold reply rate means 97% of your outreach is ignored" },
            { text: "No authority built, every conversation starts cold" },
            { text: "Credit-based AI tools add $20-50 on top if you want AI-written messages" },
          ],
        }}
        linkedgrow={{
          price: "$99/month",
          apiCost: "$2-4/month",
          benefits: [
            { text: "Content-driven leads come to you, no account risk from automation" },
            { text: "Voice-trained AI creates posts that sound like you, not like a template" },
            { text: "Unlimited AI generation with BYOK, no credits or monthly caps" },
            { text: "AI costs average $2 to $4 per month at direct provider rates" },
            { text: "Publishing through your own account, treated like manual posting" },
          ],
        }}
        savingsText="Replace outreach automation with content-driven lead generation and cut costs by 70-90%"
      />

      <LandingTestimonials
        badge={{ icon: Users, text: "Lead Generation Results" }}
        headline={{
          text: "Creators generating leads through content are",
          gradient: "booking more calls",
        }}
        description="When you stop chasing prospects and start attracting them with content, the quality of every conversation improves."
        stats={[
          { value: "26+", label: "AI models for content creation", color: "text-cyan-600 dark:text-cyan-400" },
          { value: "$2-4", label: "Monthly AI costs with BYOK", color: "text-violet-600 dark:text-violet-400" },
          { value: "< 2 min", label: "From idea to scheduled post", color: "text-emerald-600 dark:text-emerald-400" },
          { value: "0", label: "Account restriction risk", color: "text-amber-600 dark:text-amber-400" },
        ]}
        testimonials={[
          {
            quote:
              "I canceled my Expandi subscription and started posting 4x per week with LinkedGrow instead. Within 6 weeks, I was getting more inbound messages from qualified prospects than I ever got from cold outreach. The leads are better because they already know my work.",
            author: "Marcus L.",
            role: "B2B Consultant, 8K Followers",
          },
          {
            quote:
              "The content repurposing feature is my lead generation engine. I turn every client case study blog post into 3 LinkedIn posts. Each one reaches a different segment of my audience, and the carousel format in particular drives profile visits that convert to discovery calls.",
            author: "Sarah K.",
            role: "Agency Owner, 15K Followers",
          },
          {
            quote:
              "Voice training made the difference for me. Before LinkedGrow, my AI-generated posts sounded generic and got ignored. Now every post sounds like something I would actually write, and prospects mention specific posts when they reach out. That kind of warm lead is worth 10 cold messages.",
            author: "David R.",
            role: "Executive Coach, 12K Followers",
          },
        ]}
      />

      <LandingFAQ
        headline={{
          text: "LinkedIn Lead Generation Tools",
          gradient: "FAQ",
        }}
        description="Common questions about using content-driven LinkedIn lead generation tools"
        faqs={[
          {
            question: "What are the best LinkedIn lead generation tools in 2026?",
            answer:
              "The best LinkedIn lead generation tools depend on your approach. For content-driven lead generation, LinkedGrow combines AI post writing, carousel creation, scheduling, and analytics in one platform with BYOK pricing starting at $99 per month. For outreach automation, tools like Expandi and Dripify handle connection sequences. For prospecting data, LinkedIn Sales Navigator provides advanced search filters. Content tools generate inbound leads over time, while outreach tools target specific prospects directly.",
          },
          {
            question: "How do LinkedIn lead generation tools actually generate leads?",
            answer:
              "LinkedIn lead generation tools work through two main approaches. Content tools like LinkedGrow help you publish consistently so prospects come to you through your posts, carousels, and articles. Outreach tools automate connection requests and follow-up messages to specific prospects. Content-driven lead generation is safer because it works your own account at a human pace and stays inside the limits you set, while automation tools that send mass connection requests or messages can trigger LinkedIn's abuse detection.",
          },
          {
            question: "Is content marketing or outreach automation better for LinkedIn leads?",
            answer:
              "Content marketing generates higher-quality leads because prospects reach out to you after seeing your expertise. Outreach automation reaches more people faster but has lower conversion rates and carries the risk of LinkedIn account restrictions. Most successful LinkedIn strategies combine both: consistent content to build authority, and targeted outreach to the prospects who engage with that content. LinkedGrow handles the content side with AI writing trained on your voice.",
          },
          {
            question: "How much do LinkedIn lead generation tools cost?",
            answer:
              "LinkedIn lead generation tools range from $19 per month (LinkedGrow Pro) to $99 per month (Expandi, Dripify) for individual plans. LinkedIn Sales Navigator starts at $99 per month. Enterprise tools like ZoomInfo and 6sense use custom pricing that often exceeds $1,000 per month. LinkedGrow's BYOK model keeps total costs low because AI API usage averages $2 to $4 per month on top of the subscription, with no credit caps or generation limits.",
          },
          {
            question: "Can LinkedGrow replace my current LinkedIn lead generation stack?",
            answer:
              "LinkedGrow replaces the content creation side of your lead generation stack: AI post writing with voice training, image generation, carousel building, scheduling with a visual calendar, and performance analytics. It doesn't replace outreach automation tools or CRM systems. If your lead generation strategy relies on publishing content that positions you as an expert and attracts inbound interest, LinkedGrow covers that entire workflow in one platform.",
          },
        ]}
      />

      <LandingRelatedContent
        headline="Related Resources"
        links={[
          { title: "LinkedIn Marketing Tool", href: "/linkedin-marketing-tool" },
          { title: "LinkedIn Automation Tools", href: "/linkedin-automation-tools" },
          { title: "Lead Generation Use Case", href: "/use-cases/lead-generation" },
          { title: "LinkedIn Posts That Generate Leads", href: "/blog/linkedin-posts-generate-leads" },
          { title: "LinkedIn Social Selling Strategy", href: "/blog/linkedin-social-selling-strategy" },
        ]}
      />

      <LandingCTA
        badge="LinkedIn Lead Generation Tools"
        headline={{
          line1: "Ready to generate leads through",
          gradient: "content, not cold outreach?",
        }}
        description="Stop risking your LinkedIn account on automation bots. LinkedGrow gives you AI content creation, scheduling, carousels, images, and analytics in one platform, so your expertise does the selling."
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
