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
  Shield,
  AlertTriangle,
  CircleDollarSign,
  Clock,
  Ban,
  Key,
  Users,
  PenTool,
  Calendar,
  BarChart3,
  Image,
  Layers,
  Wand2,
  ShieldCheck,
  ShieldAlert,
  Zap,
} from "lucide-react";

export function AutomationToolsContent() {
  return (
    <main className={V3_ROOT}>
      <Header />

      <LandingHero
        badge={{ icon: Shield, text: "LinkedIn Automation Tools" }}
        headline={{
          line1: "LinkedIn automation tools:",
          gradient: "safe vs risky",
        }}
        descriptionBold="Not all LinkedIn automation is created equal. Some tools grow your presence safely, others get your account banned."
        description="LinkedIn automation tools fall into two categories: content tools that use your own account (safe) and outreach bots that simulate browser actions (risky). This breakdown covers both categories, what LinkedIn actually allows, and why content automation is the only approach that scales without putting your account at risk. LinkedGrow is a content automation platform built on your own account."
        valuePropBadges={[
          { icon: ShieldCheck, text: "Agent on your account only" },
          { icon: PenTool, text: "26+ AI models" },
          { icon: CircleDollarSign, text: "From $19/month" },
        ]}
        primaryCta={{ text: "Try safe automation free", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={["7-day Pro trial included", "Everything included", "Zero ban risk"]}
        video={{
          videoId: "5cE1BRvxfiQ",
          thumbnailUrl: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/video-thumbnail-promo.avif",
          duration: "0:10",
          ctaText: "See Pricing",
          ctaHref: "/pricing",
        }}
      />

      <LandingPainPoints
        badge={{ icon: AlertTriangle, text: "The Automation Risk" }}
        badgeColor="red"
        headline={{
          text: "Most LinkedIn automation tools put your account",
          gradient: "at serious risk.",
        }}
        descriptionBold="The majority of 'LinkedIn automation tools' listed in online roundups are outreach bots."
        description="They automate connection requests, send mass messages, visit profiles on autopilot, and simulate human behavior through browser extensions or cloud instances. LinkedIn's detection systems have gotten far better at catching these tools, and the consequences range from temporary restrictions to permanent account suspension."
        problems={[
          {
            icon: Ban,
            stat: "Permanent",
            title: "Account bans from outreach bots",
            description:
              "LinkedIn actively monitors for automated connection requests, mass messaging, and profile scraping. Tools that simulate browser actions trigger rate-limit warnings first, then temporary restrictions, and eventually permanent account suspension. Rebuilding a banned LinkedIn profile takes months or years.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: CircleDollarSign,
            stat: "$50-100",
            title: "Per month for tools that could get you banned",
            description:
              "Most outreach automation tools charge $30 to $100 per seat per month. You're paying a premium for software that violates LinkedIn's Terms of Service and puts your entire professional network at risk. If your account gets restricted, that investment is gone along with your connections.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: ShieldAlert,
            stat: "Growing",
            title: "LinkedIn's detection keeps improving",
            description:
              "LinkedIn uses behavioral analysis, IP reputation scoring, and activity pattern detection to identify automated actions. Techniques that worked in 2024, like random delays and human-like typing, are increasingly flagged. Even 'cloud-based' tools that claim built-in safety still leave detectable fingerprints.",
            color: "from-red-500 to-orange-600",
          },
          {
            icon: Clock,
            stat: "0 ROI",
            title: "When your account gets restricted mid-campaign",
            description:
              "Outreach automation looks efficient until LinkedIn restricts your ability to send connection requests or messages. Suddenly your entire lead generation pipeline freezes, your paid tool subscription continues billing, and you're stuck waiting days or weeks for restrictions to lift.",
            color: "from-rose-500 to-red-600",
          },
        ]}
        bottomQuote="I lost 15,000 connections when LinkedIn permanently restricted my account after using an outreach bot for 3 months..."
      />

      <LandingFeatures
        badge={{ icon: ShieldCheck, text: "Safe Content Automation" }}
        headline={{
          text: "Content automation tools that LinkedIn",
          gradient: "actually supports",
        }}
        description="These tools use your own account to create and publish content. They don't interact with LinkedIn's interface, send messages, or automate connections. LinkedIn treats API-published posts identically to posts you publish manually."
        features={[
          {
            icon: PenTool,
            title: "AI Post Generation",
            description:
              "LinkedGrow uses 26+ AI models from OpenAI, Anthropic, Google, xAI, Perplexity, and Kimi to generate LinkedIn posts that match your writing voice. Content creation happens entirely outside LinkedIn. Only the final post touches the platform the way a person does.",
            highlights: ["26+ AI models", "Voice training", "Unlimited via BYOK"],
            badge: "LinkedGrow",
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: Calendar,
            title: "Post Scheduling",
            description:
              "Schedule posts to publish at optimal times through LinkedIn's official Share API. Visual content calendar shows your upcoming week and month. LinkedGrow, Buffer, and Hootsuite all use this same authorized API endpoint for scheduled publishing.",
            highlights: ["Agent on your account", "Content calendar", "Timezone support"],
            badge: "Safe",
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: Image,
            title: "AI Image Generation",
            description:
              "Generate custom photos for your posts with AI models from OpenAI, Google, and Replicate. Create images directly in the post editor and attach them before scheduling. No stock photo subscriptions, no design tools, no switching between apps.",
            highlights: ["14+ image models", "In-editor creation", "$0.02-0.08 per image"],
            badge: "LinkedGrow Pro",
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: Layers,
            title: "Carousel Creation",
            description:
              "Build multi-slide LinkedIn carousels that consistently outperform standard text posts in engagement. AI generates slide content, and the visual builder lets you customize each slide with your own branding, colors, and fonts.",
            highlights: ["Multi-slide builder", "AI content assist", "Brand customization"],
            badge: "LinkedGrow Biz",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: BarChart3,
            title: "Analytics and Tracking",
            description:
              "Track post performance, identify what content works best with your audience, and find your optimal posting times. Analytics tools read engagement data without performing any actions on your account.",
            highlights: ["Engagement metrics", "Trend analysis", "Best time insights"],
            badge: "Safe",
            color: "from-pink-500 to-rose-500",
          },
          {
            icon: Wand2,
            title: "Hook Generation",
            description:
              "Generate scroll-stopping opening lines based on your topic. The hook generator creates multiple variations so you can pick the most engaging one. Like all content tools, this runs entirely outside LinkedIn and only the final post gets published.",
            highlights: ["Multiple variations", "Topic-based", "Proven patterns"],
            badge: "LinkedGrow Pro",
            color: "from-teal-500 to-cyan-600",
          },
        ]}
        ctaText="Try Safe Automation Free"
        ctaHref="/sign-up"
      />

      <LandingHowItWorks
        headline={{
          text: "How safe LinkedIn automation",
          gradient: "actually works",
        }}
        description="Content automation uses LinkedIn's authorized API - the same system LinkedIn built for third-party tools to publish on your behalf."
        steps={[
          {
            number: "01",
            title: "Connect with LinkedIn OAuth",
            description:
              "You authorize LinkedGrow through LinkedIn's agent on your account flow, the same authentication system LinkedIn provides for all approved apps. LinkedIn issues a secure access token that lets the tool publish on your behalf. No browser extensions, no password sharing, no scraping.",
            icon: Shield,
            color: "from-cyan-500 to-blue-500",
            time: "30 sec",
          },
          {
            number: "02",
            title: "Create content with AI",
            description:
              "Generate posts using your preferred AI model and writing voice. Create images, carousels, and hooks. All content creation happens outside LinkedIn, on your device and through your own AI API keys. Nothing interacts with LinkedIn until you're ready to publish.",
            icon: PenTool,
            color: "from-violet-500 to-purple-500",
            time: "60 sec",
          },
          {
            number: "03",
            title: "Schedule or publish via API",
            description:
              "Publish immediately or schedule for the optimal time. LinkedGrow sends the post to LinkedIn through the official Share API, the same endpoint LinkedIn's own mobile app uses. LinkedIn treats API-published posts identically to manual posts.",
            icon: Calendar,
            color: "from-emerald-500 to-green-500",
            time: "15 sec",
          },
          {
            number: "04",
            title: "Track results, stay safe",
            description:
              "Monitor engagement through the analytics dashboard. Identify what's working, find your best posting times, and refine your content strategy. At no point does any tool interact with LinkedIn's interface or perform actions on your behalf beyond publishing.",
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
          text: "Safe automation that costs a fraction of",
          gradient: "risky alternatives",
        }}
        description="Outreach bots charge $50 to $100 per month and put your account at risk. Content automation with LinkedGrow costs less and actually grows your LinkedIn presence without any ban risk."
        competitor={{
          name: "Outreach Automation Tools",
          price: "$50-100/month",
          issues: [
            { text: "Violates LinkedIn Terms of Service - permanent ban risk" },
            { text: "Monthly seat-based pricing with no generation caps (but no content)" },
            { text: "Simulates browser actions that LinkedIn actively detects" },
            { text: "Zero content creation - only sends automated messages" },
            { text: "Your professional network is the collateral if caught" },
          ],
        }}
        linkedgrow={{
          price: "$99/month",
          apiCost: "$2-4/month",
          benefits: [
            { text: "Uses your own account - zero ban risk, full compliance" },
            { text: "Unlimited AI post generation with BYOK (no caps, no credits)" },
            { text: "Complete content stack: write, design, schedule, analyze" },
            { text: "AI costs average $2 to $4 per month at provider rates, zero markup" },
            { text: "Content automation builds your brand - outreach bots just spam" },
          ],
        }}
        savingsText="Save money AND your account - content automation is safer and cheaper"
      />

      <LandingTestimonials
        badge={{ icon: Users, text: "Content Automation Results" }}
        headline={{
          text: "Creators choosing safe automation are",
          gradient: "growing faster",
        }}
        description="LinkedIn rewards consistent, quality content far more than mass connection requests. Creators who switched from outreach bots to content automation are seeing better engagement and zero account risk."
        stats={[
          { value: "0", label: "Account bans from content automation", color: "text-emerald-600 dark:text-emerald-400" },
          { value: "26+", label: "AI models for content creation", color: "text-cyan-600 dark:text-cyan-400" },
          { value: "$2-4", label: "Monthly AI costs with BYOK", color: "text-violet-600 dark:text-violet-400" },
          { value: "< 2 min", label: "From idea to scheduled post", color: "text-amber-600 dark:text-amber-400" },
        ]}
        testimonials={[
          {
            quote:
              "I used an outreach bot for six months and got my account restricted twice. Switched to LinkedGrow for content automation and my engagement actually went up because I was posting consistently instead of spamming connections.",
            author: "Mark R.",
            role: "B2B Consultant, 22K Followers",
          },
          {
            quote:
              "The BYOK model sold me. I was paying $79 per month for an outreach tool that LinkedIn kept flagging. Now I pay $39 plus about $3 in AI costs, and I'm publishing better content more consistently than I ever did with automated messaging.",
            author: "Sarah K.",
            role: "Agency Owner, 18K Followers",
          },
          {
            quote:
              "Content automation is the only LinkedIn strategy that compounds. Every post builds your reputation. Connection spam burns your credibility. That is the difference nobody in the automation space wants to admit.",
            author: "David M.",
            role: "SaaS Founder, 31K Followers",
          },
        ]}
      />

      <LandingFAQ
        headline={{
          text: "LinkedIn Automation Tools",
          gradient: "FAQ",
        }}
        description="Common questions about safe and risky LinkedIn automation"
        faqs={[
          {
            question: "Which LinkedIn automation tools are safe to use?",
            answer:
              "Content automation tools like LinkedGrow, Buffer, and Hootsuite are safe because they use LinkedIn's official publishing API. They never interact with LinkedIn's interface directly, never send automated messages, and never scrape profile data. LinkedIn explicitly supports scheduled publishing through its API.",
          },
          {
            question: "Will LinkedIn ban me for using automation tools?",
            answer:
              "It depends on the type of tool. LinkedIn bans tools that automate connection requests, profile visits, message sending, or any direct interaction with the platform's interface. Content scheduling and AI writing tools that publish from your own account are allowed and carry no ban risk.",
          },
          {
            question: "What is the difference between content automation and outreach automation?",
            answer:
              "Content automation tools help you write, schedule, and publish posts through your own account. Outreach automation tools send connection requests, automated messages, and profile visits by simulating browser actions. LinkedIn actively detects and penalizes outreach automation while supporting content tools through its API.",
          },
          {
            question: "How much do LinkedIn automation tools cost?",
            answer:
              "Content automation tools range from free (Buffer's basic plan) to $299 per seat per month (Sprout Social). LinkedGrow starts at $19 per month with unlimited AI generation via BYOK, where AI costs average $2 to $4 per month. Outreach automation tools typically cost $30 to $100 per seat per month.",
          },
          {
            question: "What does LinkedIn's Terms of Service say about automation?",
            answer:
              "LinkedIn's Professional Community Policies prohibit bots, crawlers, scrapers, or automated means to access or interact with the platform without authorization. Publishing through your own account with user-authorized OAuth tokens is permitted. The key distinction is authorized API access versus unauthorized platform manipulation.",
          },
          {
            question: "Can I automate LinkedIn posts without getting banned?",
            answer:
              "Yes. Scheduling posts through tools that use your own account is fully supported. LinkedGrow, Buffer, and Hootsuite all publish through authorized API connections. You connect your LinkedIn account via OAuth, and the tool publishes at scheduled times. LinkedIn treats this identically to manual posts.",
          },
          {
            question: "What happens if LinkedIn detects automation on my account?",
            answer:
              "For outreach automation (connection bots, auto-messages), penalties range from temporary restrictions to permanent suspension. For content automation the way a person does, there are no penalties because it is authorized use. LinkedIn has never penalized users for scheduling posts through approved API integrations.",
          },
          {
            question: "Is LinkedGrow a safe LinkedIn automation tool?",
            answer:
              "Yes. LinkedGrow uses LinkedIn's official Share API to publish posts. It never sends connection requests, automated messages, or performs any interaction on your profile. AI content generation happens outside LinkedIn using your own API keys, and only the final post is published the way a person does.",
          },
        ]}
      />

      <LandingRelatedContent
        headline="Related Resources"
        links={[
          { title: "Safe LinkedIn Automation Use Cases", href: "/use-cases/automation" },
          { title: "LinkedIn Content Creation Tools", href: "/linkedin-content-creation-tools" },
          { title: "LinkedIn Marketing Tool", href: "/linkedin-marketing-tool" },
          { title: "LinkedIn Lead Generation Tools", href: "/linkedin-lead-generation-tools" },
          { title: "LinkedIn Post Scheduling", href: "/features/post-scheduling" },
          { title: "AI Post Generator", href: "/features/blog-to-linkedin" },
        ]}
      />

      <LandingCTA
        badge="Safe LinkedIn Automation"
        headline={{
          line1: "Ready to automate LinkedIn",
          gradient: "without the risk?",
        }}
        description="Stop gambling your professional network on outreach bots. LinkedGrow gives you complete content automation through your own account, with AI-powered writing, scheduling, and analytics."
        primaryCta={{ text: "Start free for 7 days", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={[
          "7-day Pro trial included",
          "Agent on your account - zero ban risk",
          "Your own AI key",
          "BYOK - unlimited generations",
        ]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
