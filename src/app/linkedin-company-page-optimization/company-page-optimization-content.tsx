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
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Users,
  Calendar,
  PenTool,
  Zap,
  Key,
  Target,
  Search,
  BarChart3,
  Megaphone,
  FileText,
  Eye,
  Clock,
  Globe2,
  UserCheck,
  Layers,
} from "lucide-react";

export function CompanyPageOptimizationContent() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <AnimatedBackground />
      <Header />

      <LandingHero
        badge={{ icon: TrendingUp, text: "Company Page Optimization 2026" }}
        headline={{
          line1: "How to Optimize Your LinkedIn Company Page",
          gradient: "for More Followers",
        }}
        descriptionBold="Creating a LinkedIn company page takes ten minutes. Turning it into a growth engine takes strategy."
        description="How to optimize your LinkedIn company page for more followers is the question every business asks after the initial setup excitement fades. The truth is that most company pages plateau at a few hundred followers because they treat the page like a static brochure instead of a living content channel. In 2026, company page organic reach has dropped significantly, which means optimization is no longer optional. It is the difference between a page that grows and a page that stagnates. This guide covers the SEO tactics, content strategies, posting cadence, and employee advocacy techniques that actually move the needle. LinkedGrow gives you the tools to execute all of it without adding hours to your weekly workload."
        valuePropBadges={[
          { icon: Search, text: "Page SEO" },
          { icon: TrendingUp, text: "Follower growth" },
          { icon: Megaphone, text: "Employee advocacy" },
        ]}
        primaryCta={{ text: "Try LinkedGrow free", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={["7-day Pro trial included", "No credit card required", "Cancel anytime"]}
      />

      <LandingPainPoints
        badge={{ icon: AlertTriangle, text: "The Optimization Gap" }}
        badgeColor="red"
        headline={{
          text: "The gap between creating a company page and",
          gradient: "actually growing it is enormous.",
        }}
        descriptionBold="Most LinkedIn company pages are technically complete but strategically empty."
        description="You filled in every field, uploaded a logo and banner, wrote an About section, and posted a few times. Then the follower count stopped moving. The problem is not your page setup. It is what happens after setup. LinkedIn rewards company pages that publish consistently, use high-engagement formats, and generate meaningful interactions. Without a content system, even well-built pages fade into irrelevance as the algorithm shifts attention elsewhere."
        problems={[
          {
            icon: Eye,
            stat: "2-5%",
            title: "Initial reach of company page posts",
            description:
              "When you publish a post from your company page, LinkedIn shows it to just 2 to 5 percent of your followers in the first hour. This is the testing window. If that small group engages with likes, comments, and shares, LinkedIn distributes the post more widely. If they scroll past it, the post dies. Every post is an audition, and most company page posts fail the test because they are not optimized for engagement.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: Target,
            stat: "5-8x less",
            title: "Reach compared to personal profiles",
            description:
              "Personal profiles generate 5 to 8 times more organic reach than company pages sharing identical content. LinkedIn's algorithm is designed around people, not brands. Company pages represent just 1 to 2 percent of content in the average user's feed. This means your optimization strategy must be fundamentally different from personal profile tactics. You need document posts, employee amplification, and a content format strategy built specifically for pages.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: Clock,
            stat: "Stalled",
            title: "Follower growth has slowed across all page sizes",
            description:
              "Large company pages that used to grow at over 20 percent per year are now averaging around 6 percent. Small pages have seen similar slowdowns. The era of passive follower growth from page creation alone is over. In 2026, every new follower has to be earned through valuable content, strategic engagement, and active promotion. The companies still growing are the ones that treat their page like a content publication, not a corporate brochure.",
            color: "from-red-500 to-orange-600",
          },
          {
            icon: BarChart3,
            stat: "No data",
            title: "Flying blind without proper analytics tracking",
            description:
              "Most companies have no idea which posts drive followers, which content formats perform best, or what days generate the most engagement on their company page. Without analytics, optimization is just guessing. You need to know your engagement rate benchmarks, track which content types generate the most impressions, and identify the posting times that work for your specific audience. Data-driven optimization is the only kind that works.",
            color: "from-rose-500 to-red-600",
          },
        ]}
        bottomQuote="Our company page has been stuck at the same follower count for months and nothing we post seems to make a difference..."
      />

      <LandingFeatures
        badge={{ icon: Sparkles, text: "Optimization Tools" }}
        headline={{
          text: "LinkedGrow gives you every tool to",
          gradient: "optimize and grow your company page",
        }}
        description="From content creation to analytics, everything you need to turn a stagnant company page into a follower growth engine."
        features={[
          {
            icon: Search,
            title: "Company Page SEO Optimization",
            description:
              "Your LinkedIn company page is indexed by Google and appears in search results for brand queries. LinkedGrow helps you create keyword-rich content that strengthens both your LinkedIn and Google visibility. Generate posts that naturally include industry terms your target audience searches for, building topical authority that LinkedIn's algorithm rewards with better distribution over time.",
            highlights: ["Keyword-rich content", "Google visibility", "Topical authority"],
            badge: "Core",
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: Layers,
            title: "High-Engagement Content Formats",
            description:
              "Document posts and carousels generate the highest engagement rate on LinkedIn in 2026, outperforming every other format. LinkedGrow's carousel generator creates professional multi-slide posts from your content in minutes. Pair carousels with AI-generated text posts and you have a content mix optimized for maximum reach and follower growth on your company page.",
            highlights: ["Carousel generator", "Document posts", "Format variety"],
            badge: "Pro",
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: PenTool,
            title: "AI Content in Your Brand Voice",
            description:
              "Consistency in voice builds brand recognition. LinkedGrow's voice training captures your company's communication style so every AI-generated post sounds authentically on-brand. Whether you are creating thought leadership content, product updates, or hiring announcements, the tone stays consistent. This matters because followers expect a predictable voice from company pages they follow.",
            highlights: ["Voice training", "Brand consistency", "24+ AI models"],
            badge: "Core",
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: Calendar,
            title: "Strategic Content Calendar",
            description:
              "Posting frequency directly impacts how LinkedIn distributes your company page content. The algorithm rewards pages that publish 2 to 5 times per week with significantly better reach. LinkedGrow's visual content calendar lets you plan, batch, and schedule your entire week of content in one session. Spot gaps before they happen and maintain the consistency that drives steady follower growth.",
            highlights: ["Weekly batch planning", "Gap detection", "Optimal frequency"],
            badge: "Starter+",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: Megaphone,
            title: "Employee Advocacy Amplification",
            description:
              "Only 3 percent of employees share company content on their personal profiles, but that 3 percent generates roughly 30 percent of total engagement. LinkedGrow's team features make it easy for employees to access approved content and share it from their own profiles. This is the single most effective way to overcome the company page reach disadvantage and grow followers organically.",
            highlights: ["Content sharing", "Team access", "30% engagement boost"],
            badge: "Business",
            color: "from-pink-500 to-rose-500",
          },
          {
            icon: BarChart3,
            title: "Performance Analytics and Tracking",
            description:
              "Optimization without data is just guessing. LinkedGrow tracks engagement metrics across all your company page posts so you can identify what works and double down on it. See which content formats generate the most impressions, which topics drive engagement, and which posting times work best for your specific audience. Use real data to continuously improve your company page strategy.",
            highlights: ["Engagement tracking", "Format comparison", "Data-driven decisions"],
            badge: "Pro",
            color: "from-teal-500 to-cyan-600",
          },
        ]}
        ctaText="Start Optimizing Your Company Page"
        ctaHref="/sign-up"
      />

      <LandingHowItWorks
        headline={{
          text: "Optimize your company page growth in",
          gradient: "three steps",
        }}
        description="A systematic approach to turning your LinkedIn company page from stagnant to growing, week after week."
        steps={[
          {
            number: "01",
            title: "Audit and optimize your page profile",
            description:
              "Start by completing every section of your company page. Write a keyword-rich tagline and About section that includes terms your audience searches for. Upload a professional logo and an eye-catching banner image. Add up to 20 specialties as keyword tags. Set a compelling call-to-action button. Claim a clean custom URL. Complete pages get significantly more weekly views and better search visibility than incomplete ones.",
            icon: Search,
            color: "from-cyan-500 to-blue-500",
            time: "1 hour",
          },
          {
            number: "02",
            title: "Build your content engine with LinkedGrow",
            description:
              "Set up voice training with your brand's existing content so the AI captures your company's communication style. Create a content mix of carousels, text posts, and image posts that covers thought leadership, product updates, culture, and industry insights. Schedule 3 to 5 posts per week on the content calendar at optimal times. One Monday session per week keeps your page active all week long.",
            icon: PenTool,
            color: "from-violet-500 to-purple-500",
            time: "20 min/week",
          },
          {
            number: "03",
            title: "Activate employee advocacy and track results",
            description:
              "Invite key team members to LinkedGrow and give them access to approved company content they can share from their personal profiles. This single step can multiply your company page reach by 5 to 10 times. Track your engagement metrics weekly to identify which content types and topics drive the most growth, then adjust your content mix based on real data. Optimization is a continuous loop, not a one-time task.",
            icon: TrendingUp,
            color: "from-emerald-500 to-green-500",
            time: "Ongoing",
          },
        ]}
        totalTime="1 hour setup, then 20 min/week"
      />

      <LandingBYOK
        badge={{ icon: Key, text: "Smart Economics" }}
        headline={{
          text: "Company page optimization tools at",
          gradient: "a fraction of the cost",
        }}
        description="Traditional social media management tools charge premium prices for company page features. LinkedGrow gives you everything you need to optimize and grow your page for a fraction of the price because you bring your own AI key."
        competitor={{
          name: "Traditional Social Media Tools",
          price: "$50-200/month",
          issues: [
            { text: "AI content generation capped by subscription tier" },
            { text: "Limited analytics without expensive plan upgrades" },
            { text: "No carousel or document post creation" },
            { text: "Team seats charged separately per user" },
            { text: "Generic scheduling without engagement optimization" },
          ],
        }}
        linkedgrow={{
          price: "$13/month",
          apiCost: "$2-4/month",
          benefits: [
            { text: "Unlimited AI content generation with your own API key" },
            { text: "Analytics and engagement tracking included" },
            { text: "Built-in carousel generator for high-engagement formats" },
            { text: "Team collaboration with roles included in plan" },
            { text: "Visual content calendar with optimal time suggestions" },
          ],
        }}
        savingsText="Optimize and grow your company page for under $25 per month"
      />

      <LandingTestimonials
        badge={{ icon: Users, text: "Optimization Results" }}
        headline={{
          text: "Companies optimizing with LinkedGrow are seeing",
          gradient: "real follower growth",
        }}
        description="Consistent content, the right formats, and employee advocacy are driving measurable company page growth."
        stats={[
          { value: "2-5x", label: "Weekly posting frequency", color: "text-cyan-600 dark:text-cyan-400" },
          { value: "278%", label: "More engagement from carousels", color: "text-emerald-600 dark:text-emerald-400" },
          { value: "5-10x", label: "Reach with employee advocacy", color: "text-violet-600 dark:text-violet-400" },
          { value: "$2-4", label: "Monthly AI cost with BYOK", color: "text-amber-600 dark:text-amber-400" },
        ]}
        testimonials={[
          {
            quote:
              "Our company page was stuck at 800 followers for almost a year. After optimizing our About section, switching to mostly carousel posts, and getting five team members to share content from their profiles, we crossed 2,000 followers in three months. LinkedGrow's content calendar made the consistency part effortless.",
            author: "Rachel S.",
            role: "Head of Marketing, Fintech Startup",
          },
          {
            quote:
              "The biggest unlock was employee advocacy. We had 15 employees on LinkedIn but none of them were sharing company content. Once we set up LinkedGrow's team features and made it easy for people to share approved posts, our combined reach went from a few hundred to thousands per week. The company page followers followed.",
            author: "Daniel K.",
            role: "CEO, Consulting Firm",
          },
          {
            quote:
              "I used to think company page optimization meant tweaking the About section once a year. LinkedGrow showed me it is really about consistent content in the right formats. Our carousel posts get 3 to 4 times more engagement than our text posts. The analytics make it obvious what to do more of and what to cut.",
            author: "Sophie L.",
            role: "Social Media Manager, B2B SaaS",
          },
        ]}
      />

      <LandingFAQ
        headline={{
          text: "Company Page Optimization",
          gradient: "FAQ",
        }}
        description="Common questions about optimizing your LinkedIn company page for more followers and better engagement"
        faqs={[
          {
            question: "How do I get more followers on my LinkedIn company page?",
            answer:
              "Complete every profile section with keywords, post 2 to 5 times per week using high-engagement formats like carousels, activate employee advocacy so team members share company content, and respond to every comment. LinkedGrow automates the content creation and scheduling.",
          },
          {
            question: "How often should I post on my company page?",
            answer:
              "2 to 5 posts per week is the optimal frequency. This range significantly boosts impressions and engagement compared to posting weekly. Quality matters more than quantity. LinkedGrow's content calendar and batch scheduling make this pace sustainable.",
          },
          {
            question: "What content format gets the most engagement on company pages?",
            answer:
              "Document posts and carousels generate the highest engagement rate, outperforming text, images, and video. Multi-image posts come second. LinkedGrow's carousel generator creates professional carousels in minutes.",
          },
          {
            question: "Does my LinkedIn company page affect Google search results?",
            answer:
              "Yes. LinkedIn company pages are indexed by Google and often rank on the first page for brand searches. Keywords in your tagline, About section, and specialties impact how your page appears in search results.",
          },
          {
            question: "Why does my company page get less reach than personal profiles?",
            answer:
              "LinkedIn's algorithm prioritizes personal content over brand content. Personal profiles get 5 to 8 times more reach. The best strategy combines company page content with employee advocacy to multiply your total reach.",
          },
          {
            question: "What is employee advocacy and why does it matter for company pages?",
            answer:
              "Employee advocacy is when employees share company content from their personal profiles. Only 3 percent of employees do this, but they generate roughly 30 percent of total engagement. LinkedGrow's team features make it easy for employees to access and share approved content.",
          },
          {
            question: "What should I include in my company page About section?",
            answer:
              "Write a compelling About section with industry keywords in the first 3 to 4 paragraphs since LinkedIn and Google index this content. Explain what your company does, who you serve, and what makes you different. Use up to 2,000 characters and add up to 20 specialties as keyword tags.",
          },
          {
            question: "How does LinkedGrow help optimize my company page?",
            answer:
              "LinkedGrow provides AI content generation in your brand voice, a visual content calendar for consistent posting, carousel generator for high-engagement formats, team collaboration for employee advocacy, and analytics to track what works. All from one dashboard.",
          },
        ]}
      />

      <LandingRelatedContent
        headline="Related Resources"
        links={[
          { title: "Create a Company Page", href: "/linkedin-company-page-guide" },
          { title: "Content Calendar", href: "/features/content-calendar" },
          { title: "Post Scheduling", href: "/features/post-scheduling" },
          { title: "For Agencies", href: "/for/agencies" },
          { title: "For Small Businesses", href: "/for/small-businesses" },
          { title: "Team Collaboration", href: "/features/team-collaboration" },
        ]}
      />

      <LandingCTA
        badge="Start Optimizing Your Company Page Today"
        headline={{
          line1: "Ready to turn your company page into",
          gradient: "a follower growth engine?",
        }}
        description="Generate brand-voice content, create high-engagement carousels, schedule at optimal times, and activate employee advocacy. LinkedGrow gives you every tool to optimize your LinkedIn company page."
        primaryCta={{ text: "Get started free", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={[
          "7-day Pro trial included",
          "No credit card required",
          "24+ AI models",
          "Cancel anytime",
        ]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
