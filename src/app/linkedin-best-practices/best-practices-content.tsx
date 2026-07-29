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
  Sparkles,
  Zap,
  CircleDollarSign,
  Clock,
  Target,
  Key,
  AlertTriangle,
  Users,
  Calendar,
  Trophy,
  Globe2,
  BarChart3,
  Building2,
  PenTool,
  UserCheck,
  MessageCircle,
  TrendingUp,
  FileText,
  Eye,
  Search,
} from "lucide-react";

export function BestPracticesContent() {
  return (
    <main className={V3_ROOT}>
      <Header />

      <LandingHero
        badge={{ icon: Trophy, text: "LinkedIn Best Practices 2026" }}
        headline={{
          line1: "LinkedIn Best Practices for Business",
          gradient: "Profiles and Posting",
        }}
        descriptionBold="The LinkedIn playbook has changed. What worked in 2024 can hurt your reach in 2026."
        description="LinkedIn best practices for business profiles and posting now revolve around expert knowledge scoring, authentic content, and strategic consistency. LinkedGrow gives you the tools to apply every best practice on this page without spending hours each week. AI content generation, voice training that sounds like you, optimal scheduling, and a visual content calendar to keep everything on track."
        valuePropBadges={[
          { icon: UserCheck, text: "Profile optimization" },
          { icon: PenTool, text: "Content strategy" },
          { icon: Calendar, text: "Consistent posting" },
        ]}
        primaryCta={{ text: "Start applying best practices", href: "/sign-up" }}
        trustIndicators={["7-day Pro trial included", "Everything included", "Your own AI key"]}
        video={{
          videoId: "5cE1BRvxfiQ",
          thumbnailUrl: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/video-thumbnail-promo.avif",
          duration: "0:10",
          ctaText: "See Pricing",
          ctaHref: "/pricing",
        }}
      />

      <LandingPainPoints
        badge={{ icon: AlertTriangle, text: "Why Most Profiles Underperform" }}
        badgeColor="red"
        headline={{
          text: "Knowing best practices and actually following them are",
          gradient: "two different things.",
        }}
        descriptionBold="Most professionals know they should post more, optimize their profile, and engage with their network."
        description="But knowing and doing are not the same thing. Writing quality posts takes time you do not have. Figuring out when to post requires data you do not track. Optimizing your profile means understanding what the algorithm actually looks for in 2026. And staying consistent week after week is where nearly everyone falls off. The gap between knowing LinkedIn best practices and executing them is where most people lose."
        problems={[
          {
            icon: Clock,
            stat: "2+ hours",
            title: "Spent writing one decent LinkedIn post",
            description:
              "Crafting a post that sounds authentic, opens with a strong hook, and delivers genuine value takes most people over two hours when they do it manually. That is 10 hours per week if you want to post 5 times. Most professionals simply do not have that kind of time, so they post sporadically or stop entirely.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: Target,
            stat: "50%",
            title: "Drop in organic reach year over year",
            description:
              "LinkedIn organic reach has dropped roughly 50 percent compared to previous years. The algorithm now favors expert knowledge scoring over raw network size. If your content does not signal genuine expertise in a specific niche, LinkedIn shows it to fewer people. Generic posts get buried while focused expert content gets amplified.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: Eye,
            stat: "60 min",
            title: "Critical window you cannot afford to miss",
            description:
              "LinkedIn tests every post with just 2 to 5 percent of your network in the first hour. If that small group does not engage, the post dies. Only 5 percent of underperforming posts in that first hour ever recover. Being available to respond to comments immediately is now a core best practice, not optional.",
            color: "from-red-500 to-orange-600",
          },
          {
            icon: Search,
            stat: "Invisible",
            title: "Profiles that AI search engines cannot find",
            description:
              "In 2026, AI-powered search tools summarize LinkedIn profiles for recruiters, prospects, and partners. Profiles without structured content, clear keywords, and complete sections get skipped entirely. Your profile is not just a resume anymore. It is a landing page that needs to convert both humans and AI.",
            color: "from-rose-500 to-red-600",
          },
        ]}
        bottomQuote="I know what I should be doing on LinkedIn but I never have the time to actually do it consistently..."
      />

      <LandingFeatures
        badge={{ icon: Sparkles, text: "Best Practices Made Easy" }}
        headline={{
          text: "LinkedGrow turns best practices into",
          gradient: "your daily workflow",
        }}
        description="Every feature in LinkedGrow is built around proven LinkedIn best practices. You do not need to remember the rules when the tool enforces them for you."
        features={[
          {
            icon: PenTool,
            title: "AI Content That Sounds Like You",
            description:
              "LinkedIn's algorithm now penalizes generic AI content. LinkedGrow's voice training analyzes your past posts and writing style so every AI-generated post matches your authentic voice. The result is content that passes both algorithmic checks and human scrutiny, because it genuinely sounds like something you would write.",
            highlights: ["Voice training from your posts", "24+ AI models to choose from", "Your tone, your vocabulary"],
            badge: "Core",
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: Calendar,
            title: "Consistent Scheduling with Optimal Timing",
            description:
              "The best practice for LinkedIn posting frequency is 3 to 5 times per week during peak engagement hours. LinkedGrow's scheduler and content calendar make this effortless. Batch-create posts on Monday, schedule them for optimal times, and your LinkedIn presence runs itself all week without daily effort.",
            highlights: ["Visual content calendar", "Optimal time suggestions", "Batch creation workflow"],
            badge: "Pro+",
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: FileText,
            title: "Document and Carousel Posts",
            description:
              "Document posts get the highest engagement rate on LinkedIn in 2026. LinkedGrow's carousel generator lets you create professional multi-slide carousels without design skills. Choose a template, add your content, customize with your brand colors, and publish a carousel that drives 2 to 3 times more engagement than a text post.",
            highlights: ["Professional templates", "Brand customization", "One-click generation"],
            badge: "Pro",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: TrendingUp,
            title: "Hook Generator for Maximum Reach",
            description:
              "The first two lines of your LinkedIn post determine whether people click to read more or keep scrolling. LinkedIn best practices say your hook should create curiosity, challenge assumptions, or promise specific value. LinkedGrow's hook generator creates proven opening lines tailored to your topic and audience.",
            highlights: ["Proven hook formulas", "Topic-specific hooks", "Engagement-optimized"],
            badge: "Pro",
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: BarChart3,
            title: "Analytics to Refine Your Strategy",
            description:
              "A core LinkedIn best practice is reviewing your post performance and adjusting your strategy based on real data. LinkedGrow tracks engagement metrics across all your posts so you can identify what topics, formats, and posting times drive the most results for your specific audience.",
            highlights: ["Engagement tracking", "Time performance data", "Format comparison"],
            badge: "Pro",
            color: "from-pink-500 to-rose-500",
          },
          {
            icon: Building2,
            title: "Personal Profiles and Company Pages",
            description:
              "Personal profiles get dramatically more reach than company pages, but both matter for business. The best practice is to post thought leadership from personal profiles and brand content from company pages. LinkedGrow lets you manage and schedule to both from one dashboard without switching between tools.",
            highlights: ["Profile publishing", "Company page support", "Unified dashboard"],
            badge: "Core",
            color: "from-teal-500 to-cyan-600",
          },
        ]}
        ctaText="Start Applying Best Practices"
        ctaHref="/sign-up"
      />

      <LandingHowItWorks
        headline={{
          text: "Follow LinkedIn best practices in",
          gradient: "three simple steps",
        }}
        description="Stop reading about best practices and start executing them in under 15 minutes per week."
        steps={[
          {
            number: "01",
            title: "Set up your voice and profile",
            description:
              "Paste 3 to 5 of your best LinkedIn posts into LinkedGrow's voice training. The AI analyzes your writing patterns, vocabulary, and tone. Set your business description, target audience, and topics to avoid. This one-time setup ensures every generated post follows the best practice of authentic, expert-level content.",
            icon: UserCheck,
            color: "from-cyan-500 to-blue-500",
            time: "5 min",
          },
          {
            number: "02",
            title: "Generate a week of expert content",
            description:
              "Use the AI post generator to create 3 to 5 posts for the week. Each post matches your voice, opens with a strong hook, and delivers genuine value on your niche topic. Mix formats. Do a text post, a carousel, and a story-driven post. The generator follows best practices for length, structure, and engagement automatically.",
            icon: PenTool,
            color: "from-violet-500 to-purple-500",
            time: "10 min",
          },
          {
            number: "03",
            title: "Schedule at optimal times and engage",
            description:
              "Place each post on the content calendar at the suggested optimal times. LinkedGrow auto-publishes everything on schedule. When posts go live, respond to comments quickly. The first hour matters most for the algorithm. Spend 10 to 15 minutes engaging with your network daily and the compound effect handles the rest.",
            icon: Zap,
            color: "from-emerald-500 to-green-500",
            time: "5 min",
          },
        ]}
        totalTime="20 minutes per week"
      />

      <LandingBYOK
        badge={{ icon: Key, text: "Smart Economics" }}
        headline={{
          text: "Best practices tools should not cost",
          gradient: "a fortune every month",
        }}
        description="Most LinkedIn tools charge $50 to $200 per month for features that help you follow best practices. LinkedGrow gives you AI content generation, scheduling, voice training, and analytics in one price because you bring your own AI key."
        competitor={{
          name: "Typical LinkedIn Tools",
          price: "$50-200/month",
          issues: [
            { text: "Limited AI generations capped by your subscription tier" },
            { text: "Generic AI voice that sounds like everyone else" },
            { text: "Basic scheduling without optimal time suggestions" },
            { text: "No carousel or image generation included" },
            { text: "Separate tools needed for writing, scheduling, and analytics" },
          ],
        }}
        linkedgrow={{
          price: "$99/month",
          apiCost: "$2-4/month",
          benefits: [
            { text: "Unlimited AI generations with your own API key" },
            { text: "Voice training that matches your authentic writing style" },
            { text: "Scheduling with visual calendar and optimal time suggestions" },
            { text: "Carousel generator, image creation, and hook generator" },
            { text: "Everything in one platform from $99 per month" },
          ],
        }}
        savingsText="All the tools to follow every LinkedIn best practice for under $25 per month"
      />

      <LandingTestimonials
        badge={{ icon: Users, text: "Results From Best Practices" }}
        headline={{
          text: "Consistent best practices are creating",
          gradient: "measurable LinkedIn growth",
        }}
        description="LinkedIn professionals who use LinkedGrow to apply best practices consistently are seeing real improvements in reach, engagement, and business opportunities."
        stats={[
          { value: "3-5x", label: "Posts per week with batch creation", color: "text-cyan-600 dark:text-cyan-400" },
          { value: "20 min", label: "Per week to manage LinkedIn", color: "text-emerald-600 dark:text-emerald-400" },
          { value: "2-3x", label: "More engagement with carousels", color: "text-violet-600 dark:text-violet-400" },
          { value: "$2-4", label: "Monthly AI cost with BYOK", color: "text-amber-600 dark:text-amber-400" },
        ]}
        testimonials={[
          {
            quote:
              "I read dozens of LinkedIn best practice guides but never had the time to follow through. LinkedGrow changed that. I set up voice training once, now I generate and schedule 5 posts every Monday morning. My engagement rate has more than doubled since I started posting consistently.",
            author: "Sarah K.",
            role: "Marketing Consultant, 18K Followers",
          },
          {
            quote:
              "The combination of voice training and AI generation is what makes the difference. Every post sounds like me, not like a chatbot. My audience has commented multiple times that my content feels more thoughtful and consistent lately. They do not realize half of it is AI-assisted.",
            author: "David T.",
            role: "SaaS Founder, 25K Followers",
          },
          {
            quote:
              "I was spending $150 per month on a competitor just for scheduling and basic analytics. LinkedGrow gives me AI content, carousel creation, and scheduling for $99 plus about $3 in API costs. The savings alone made the switch obvious, but the results have been better too.",
            author: "Lisa R.",
            role: "Business Coach, 12K Followers",
          },
        ]}
      />

      <LandingFAQ
        headline={{
          text: "LinkedIn Best Practices",
          gradient: "FAQ",
        }}
        description="Answers to common questions about LinkedIn best practices for business profiles and posting in 2026"
        faqs={[
          {
            question: "What are the most important LinkedIn best practices in 2026?",
            answer:
              "Optimize your profile for both humans and AI search, post 3 to 5 times per week with original expert content, engage with your network daily, and use document posts and carousels for higher engagement. LinkedIn's expert knowledge scoring now rewards niche authority over broad reach.",
          },
          {
            question: "How often should I post on LinkedIn?",
            answer:
              "3 to 5 times per week is the recommended frequency for consistent growth. Quality matters more than quantity. LinkedGrow's batch creation and scheduling make this frequency sustainable without daily effort.",
          },
          {
            question: "What is the best time to post on LinkedIn?",
            answer:
              "Tuesday through Thursday between 8 and 10 AM in your audience's timezone. The first 60 minutes after posting are critical for algorithmic distribution. LinkedGrow provides optimal time suggestions based on engagement data.",
          },
          {
            question: "Does LinkedIn penalize AI-generated content?",
            answer:
              "LinkedIn deprioritizes content that reads like generic AI output. The key is using AI as a writing assistant with voice training so posts match your authentic style. LinkedGrow's voice training ensures AI-generated content sounds like you.",
          },
          {
            question: "Which content format performs best on LinkedIn?",
            answer:
              "Document posts and PDF carousels get the highest engagement rate, followed by native video. Text posts still work well with strong hooks. Mix formats throughout the week for the best results.",
          },
          {
            question: "How do I optimize my LinkedIn profile in 2026?",
            answer:
              "Write a keyword-rich headline that explains what you do and who you help. Complete your About section in first person with industry keywords. Add a professional photo and branded banner. Complete profiles get significantly more content reach.",
          },
          {
            question: "Should I use hashtags on LinkedIn posts?",
            answer:
              "Use 3 to 5 relevant hashtags per post. LinkedIn now treats hashtags as SEO signals rather than discovery tools. Choose hashtags that accurately describe your content rather than chasing trending tags.",
          },
          {
            question: "How does LinkedGrow help me follow LinkedIn best practices?",
            answer:
              "LinkedGrow automates the execution of every major LinkedIn best practice. AI generates expert content in your voice, the scheduler publishes at optimal times, the content calendar maintains your posting frequency, and analytics show what is working so you can improve.",
          },
        ]}
      />

      <LandingRelatedContent
        headline="Related Resources"
        links={[
          { title: "AI Post Generator", href: "/" },
          { title: "Post Scheduling", href: "/features/post-scheduling" },
          { title: "LinkedIn Algorithm 2026", href: "/blog/linkedin-algorithm-2026" },
        ]}
      />

      <LandingCTA
        badge="Start Following LinkedIn Best Practices Today"
        headline={{
          line1: "Ready to turn LinkedIn best practices",
          gradient: "into real results?",
        }}
        description="Generate expert content in your voice, schedule at optimal times, and post consistently every week. LinkedGrow handles the execution so you can focus on your business."
        primaryCta={{ text: "Get started free", href: "/sign-up" }}
        trustIndicators={[
          "7-day Pro trial included",
          "Everything included",
          "24+ AI models",
          "Your own AI key",
        ]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
