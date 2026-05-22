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
  Calendar,
  Bell,
  Globe2,
  BarChart3,
  Building2,
  PenTool,
  CalendarCheck,
  Timer,
} from "lucide-react";

export function PostSchedulerContent() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <AnimatedBackground />
      <Header />

      <LandingHero
        badge={{ icon: CalendarCheck, text: "The LinkedIn Scheduler Tool" }}
        headline={{
          line1: "LinkedIn post scheduler with AI,",
          gradient: "profile + company page publishing",
        }}
        descriptionBold="The tool itself: an AI-integrated scheduler dashboard with visual calendar, profile + company page targeting, and auto-publish."
        description="LinkedGrow's post scheduler is a product, not a how-to. The dashboard combines AI post generation, visual content calendar, profile and company page targeting, and reliable auto-publish into one tool. Looking for the step-by-step workflow on scheduling LinkedIn posts in advance? See our scheduling guide."
        valuePropBadges={[
          { icon: Calendar, text: "Visual calendar UI" },
          { icon: Building2, text: "Profile + company pages" },
          { icon: Sparkles, text: "AI-integrated" },
        ]}
        primaryCta={{ text: "Start scheduling posts", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={["From $13/month", "No credit card to try", "Cancel anytime"]}
        video={{
          videoId: "5cE1BRvxfiQ",
          thumbnailUrl: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/video-thumbnail-promo.avif",
          duration: "0:10",
          ctaText: "See Pricing",
          ctaHref: "/pricing",
        }}
      />

      <LandingPainPoints
        badge={{ icon: AlertTriangle, text: "What Most Schedulers Are Missing" }}
        badgeColor="red"
        headline={{
          text: "Most LinkedIn schedulers are",
          gradient: "stripped-down tools.",
        }}
        descriptionBold="A scheduler that only schedules is a feature, not a product."
        description="Buffer, Hootsuite, and the generic social media schedulers were built for cross-platform reach. They schedule. That is the entire product. They have no AI post generation, no native company page targeting workflow, and no integrated content calendar that connects to a LinkedIn-specific editor. The result is a tool you have to glue to four other tools to actually use."
        problems={[
          {
            icon: Sparkles,
            stat: "0",
            title: "AI integration in standalone schedulers",
            description:
              "Standalone schedulers expect you to bring a finished post. They have no built-in AI generation, no voice training, and no model choice. You write the post elsewhere, paste it into the scheduler, and lose the connection between drafting and publishing.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: Building2,
            stat: "Manual",
            title: "Company page targeting in most tools",
            description:
              "Posting to a company page versus a personal profile is a different workflow in most schedulers - if it is supported at all. LinkedGrow's scheduler treats both as first-class destinations from the same dashboard, with a single dropdown to switch.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: Calendar,
            stat: "Generic",
            title: "Calendar UI built for every platform at once",
            description:
              "Cross-platform schedulers ship a calendar designed for Instagram, X, Facebook, and LinkedIn together. It works for none of them well. LinkedGrow's calendar UI shows LinkedIn-specific draft, scheduled, and published statuses with color coding.",
            color: "from-red-500 to-orange-600",
          },
          {
            icon: Timer,
            stat: "15-min",
            title: "Approximate windows on most scheduling APIs",
            description:
              "Most scheduling tools batch their publishing into 15-minute windows for cost. LinkedGrow uses QStash to fire posts at the exact minute you scheduled. The difference matters when your audience checks LinkedIn at 8:07 AM and your post lands at 8:15.",
            color: "from-rose-500 to-red-600",
          },
        ]}
        bottomQuote="My old scheduler was just a queue. I want a tool that knows it is scheduling LinkedIn posts, not generic social posts..."
      />

      <LandingFeatures
        badge={{ icon: CalendarCheck, text: "Scheduler Features" }}
        headline={{
          text: "Everything you need to schedule",
          gradient: "LinkedIn posts consistently",
        }}
        description="A complete LinkedIn scheduling system with visual calendar, optimal time suggestions, and auto-publish to profiles and company pages."
        features={[
          {
            icon: Calendar,
            title: "Visual Content Calendar",
            description:
              "See your week and month at a glance with a visual calendar showing all scheduled, published, and draft posts. Drag and drop to reschedule, click to edit, and identify gaps in your posting frequency immediately.",
            highlights: ["Week and month views", "Drag and drop", "Gap detection"],
            badge: "Visual",
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: Timer,
            title: "Optimal Time Suggestions",
            description:
              "LinkedGrow suggests the best posting times based on when LinkedIn engagement is highest for your industry and audience. Schedule posts at times when your content will reach the most people without guessing.",
            highlights: ["Data-driven timing", "Industry-specific", "Audience analysis"],
            badge: "Smart",
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: Building2,
            title: "Profiles and Company Pages",
            description:
              "Schedule posts to your personal LinkedIn profile or any company page you manage. Switch between posting targets from the same dashboard. Manage multiple LinkedIn presences from one place.",
            highlights: ["Personal profiles", "Company pages", "One dashboard"],
            badge: "Multi-target",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: Zap,
            title: "Reliable Auto-Publish",
            description:
              "Posts publish automatically at the scheduled time using QStash for exact-time delivery. No manual intervention needed. Your content goes live whether you are online, in a meeting, sleeping, or on vacation.",
            highlights: ["Exact-time delivery", "Zero manual work", "Always reliable"],
            badge: "Automatic",
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: Sparkles,
            title: "AI Post Generation + Scheduling",
            description:
              "Generate posts with AI and schedule them in the same workflow. Write a week of content in 15 minutes on Monday morning, schedule each post for the optimal time, and your LinkedIn presence runs itself all week.",
            highlights: ["Generate + schedule", "Batch creation", "Weekly workflow"],
            badge: "Integrated",
            color: "from-pink-500 to-rose-500",
          },
          {
            icon: BarChart3,
            title: "Post Performance Tracking",
            description:
              "Track how scheduled posts perform after they publish. See engagement metrics, identify which posting times drive the most engagement, and optimize your schedule based on real data from your audience.",
            highlights: ["Engagement metrics", "Time analysis", "Data-driven"],
            badge: "Pro",
            color: "from-teal-500 to-cyan-600",
          },
        ]}
        ctaText="Start Scheduling Posts"
        ctaHref="/sign-up"
      />

      <LandingHowItWorks
        headline={{
          text: "Schedule a full week of LinkedIn content in",
          gradient: "15 minutes",
        }}
        description="Batch your content creation and let the scheduler handle the rest."
        steps={[
          {
            number: "01",
            title: "Create or generate your posts",
            description:
              "Write posts manually or use the AI generator to create multiple posts in one session. Generate 5 posts for the week in about 10 minutes with AI assistance. Each post matches your voice thanks to voice training.",
            icon: PenTool,
            color: "from-cyan-500 to-blue-500",
            time: "10 min",
          },
          {
            number: "02",
            title: "Pick the best times to post",
            description:
              "Choose posting times for each day of the week using optimal time suggestions. The content calendar shows you the full week so you can spread posts evenly and avoid gaps or overlaps in your publishing schedule.",
            icon: Calendar,
            color: "from-violet-500 to-purple-500",
            time: "3 min",
          },
          {
            number: "03",
            title: "Schedule and relax",
            description:
              "Confirm the schedule and LinkedGrow takes over. Posts publish automatically at the exact times you set, to your personal profile or company page. Check back at the end of the week to see performance metrics.",
            icon: Zap,
            color: "from-emerald-500 to-green-500",
            time: "2 min",
          },
        ]}
        totalTime="15 minutes for a full week"
      />

      <LandingBYOK
        badge={{ icon: Key, text: "Smart Economics" }}
        headline={{
          text: "Why pay $25+ per month for just",
          gradient: "a scheduling tool?",
        }}
        description="Standalone LinkedIn schedulers charge $20 to $45 per month for scheduling alone. LinkedGrow includes scheduling alongside AI post generation, image creation, analytics, and more."
        competitor={{
          name: "Standalone Scheduling Tools",
          price: "$20-45/month",
          issues: [
            { text: "Only scheduling - no AI content generation included" },
            { text: "Limited scheduling slots on cheaper plans" },
            { text: "No image generation or carousel creation" },
            { text: "Basic calendar with no AI-powered time suggestions" },
            { text: "Separate tool needed for writing, images, and analytics" },
          ],
        }}
        linkedgrow={{
          price: "$13/month",
          apiCost: "$2-4/month",
          benefits: [
            { text: "Scheduling + AI post generator + image creator in one platform" },
            { text: "10 scheduled posts on Starter, unlimited on Pro and Business" },
            { text: "Visual content calendar with optimal time suggestions" },
            { text: "AI costs average $2 to $4 per month with BYOK pricing" },
            { text: "Auto-publish to personal profiles and company pages" },
          ],
        }}
        savingsText="Scheduling + AI content creation for less than scheduling alone"
      />

      <LandingTestimonials
        badge={{ icon: Users, text: "Scheduling Results" }}
        headline={{
          text: "Consistent scheduling is driving",
          gradient: "real LinkedIn growth",
        }}
        description="LinkedIn creators who switched from manual posting to LinkedGrow's scheduler are seeing measurable improvements in reach, engagement, and follower growth."
        stats={[
          { value: "15 min", label: "To schedule a full week", color: "text-cyan-600 dark:text-cyan-400" },
          { value: "3-5x", label: "More posts per week with batching", color: "text-emerald-600 dark:text-emerald-400" },
          { value: "40%", label: "Higher reach with optimal timing", color: "text-violet-600 dark:text-violet-400" },
          { value: "$13", label: "Per month with AI generation included", color: "text-amber-600 dark:text-amber-400" },
        ]}
        testimonials={[
          {
            quote:
              "I went from posting sporadically to 5 posts per week by scheduling everything on Monday morning. It takes me 15 minutes to generate and schedule the whole week. My follower count has grown 50% in 3 months since I started scheduling consistently.",
            author: "Alex M.",
            role: "Startup Advisor, 22K Followers",
          },
          {
            quote:
              "The optimal time suggestions made a real difference. I was posting at random times and getting mediocre reach. After switching to the suggested times, my average impressions per post increased about 40%. Data-driven scheduling works.",
            author: "Claire B.",
            role: "Content Strategist, 16K Followers",
          },
          {
            quote:
              "Being able to schedule to both my personal profile and company page from the same dashboard saves me so much time. I used to manage two separate tools. Now it is one platform, one calendar, one workflow.",
            author: "Patrick O.",
            role: "Agency Owner, 13K Followers",
          },
        ]}
      />

      <LandingFAQ
        headline={{
          text: "LinkedIn Post Scheduler",
          gradient: "FAQ",
        }}
        description="Everything about scheduling LinkedIn posts with LinkedGrow"
        faqs={[
          {
            question: "How does the scheduler work?",
            answer:
              "Create or generate a post, pick a date and time, and LinkedGrow auto-publishes to your LinkedIn profile or company page. Visual calendar shows all scheduled posts.",
          },
          {
            question: "Can I schedule to company pages?",
            answer:
              "Yes. Schedule to personal profiles and company pages you manage from the same dashboard.",
          },
          {
            question: "What is the best time to post on LinkedIn?",
            answer:
              "Typically Tuesday through Thursday, 8 to 10 AM in your audience's timezone. LinkedGrow provides optimal time suggestions based on engagement data.",
          },
          {
            question: "How many posts can I schedule?",
            answer:
              "Starter: 10 posts. Pro and Business: unlimited. 7-day Pro trial does not include scheduling but you can publish directly.",
          },
          {
            question: "Does it include a content calendar?",
            answer:
              "Yes. Week and month views, drag-and-drop rescheduling, color-coded post statuses, and gap detection to maintain consistency.",
          },
          {
            question: "Can I schedule AI-generated posts?",
            answer:
              "Yes. Generate with AI and schedule in the same workflow. Batch-generate a full week of posts and schedule them all in 15 minutes.",
          },
          {
            question: "What if I am offline when a post publishes?",
            answer:
              "Posts publish automatically using QStash for exact-time delivery. No manual intervention needed. Reliable publishing whether you are online or not.",
          },
          {
            question: "Can I include images with scheduled posts?",
            answer:
              "Yes. Attach photos, AI-generated images, or carousels before scheduling. Media is stored in Cloudflare R2 and published alongside your text.",
          },
        ]}
      />

      <LandingRelatedContent
        headline="Related Resources"
        links={[
          { title: "How to Schedule LinkedIn Posts in Advance (step-by-step)", href: "/features/post-scheduling" },
          { title: "Content Calendar", href: "/features/content-calendar" },
          { title: "Best Time to Post on LinkedIn", href: "/free-tools/linkedin-best-time-to-post" },
        ]}
      />

      <LandingCTA
        badge="Start Scheduling LinkedIn Posts Today"
        headline={{
          line1: "Ready to post on LinkedIn",
          gradient: "consistently without the stress?",
        }}
        description="Schedule a full week of LinkedIn content in 15 minutes. AI generates your posts, the scheduler publishes them at the perfect time. Your LinkedIn presence runs on autopilot."
        primaryCta={{ text: "Start scheduling free", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={[
          "From $13/month",
          "Visual calendar",
          "Cancel anytime",
          "Auto-publish included",
        ]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
