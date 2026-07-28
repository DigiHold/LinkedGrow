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
  Building2,
  Sparkles,
  AlertTriangle,
  Users,
  Calendar,
  PenTool,
  Zap,
  Key,
  Target,
  Clock,
  Eye,
  Ghost,
  UserCheck,
  BarChart3,
  Layers,
  Megaphone,
  Settings,
  CheckCircle,
} from "lucide-react";

export function CompanyPageGuideContent() {
  return (
    <main className={V3_ROOT}>
      <Header />

      <LandingHero
        badge={{ icon: Building2, text: "Company Page Guide 2026" }}
        headline={{
          line1: "How to Create a LinkedIn Company Page",
          gradient: "Step by Step",
        }}
        descriptionBold="Your LinkedIn company page is the front door to your business on the world's largest professional network."
        description="How to create a LinkedIn company page step by step is one of the most searched LinkedIn topics in 2026, and with good reason. A well-built company page drives brand awareness, attracts top talent, and generates leads around the clock. But most company pages fail because they stop after the initial setup. Creating the page takes ten minutes. Keeping it alive with consistent, high-quality content is what separates the pages that grow from the ones that collect dust. This guide walks you through every step of building your page, the mistakes that kill reach, and how LinkedGrow helps you keep your company page active without spending hours every week."
        valuePropBadges={[
          { icon: Building2, text: "Company page setup" },
          { icon: Calendar, text: "Content planning" },
          { icon: Users, text: "Team collaboration" },
        ]}
        primaryCta={{ text: "Try LinkedGrow free", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={["7-day Pro trial included", "Everything included", "Your own AI key"]}
      />

      <LandingPainPoints
        badge={{ icon: AlertTriangle, text: "Why Most Company Pages Fail" }}
        badgeColor="red"
        headline={{
          text: "Creating a company page is the easy part.",
          gradient: "Keeping it alive is where everyone struggles.",
        }}
        descriptionBold="Most LinkedIn company pages are abandoned within weeks of being created."
        description="The initial excitement fades fast when you realize that company pages need regular content, strategic timing, and consistent effort to generate any real results. Personal profiles dominate LinkedIn feeds because the algorithm heavily favors individual voices over brand accounts. That means your company page has to work harder for every impression, every follower, and every click. Without a system to produce and schedule content consistently, most company pages become ghost towns that actively hurt your brand perception."
        problems={[
          {
            icon: Ghost,
            stat: "Abandoned",
            title: "Most company pages go silent after the first month",
            description:
              "The pattern is painfully common. A team creates a company page with good intentions, posts a few updates in the first week, and then nothing. No new content for weeks or months. An abandoned company page sends a worse signal than having no page at all. It tells visitors your business is inactive or does not care about its professional presence.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: Eye,
            stat: "1-2%",
            title: "Company page content in the average user feed",
            description:
              "LinkedIn's algorithm shows company page content to a tiny fraction of followers compared to personal profiles. Personal posts get 5 to 8 times more organic reach than identical content posted from a company page. This means your company page needs more frequent posting, stronger hooks, and better content formats like carousels and documents to compete for attention in the feed.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: Target,
            stat: "60% drop",
            title: "Company page organic reach has declined sharply since 2024",
            description:
              "Organic reach for company pages has dropped roughly 60 percent compared to two years ago. A post that reached 10,000 people from your company page in 2024 now struggles to reach 4,000. The algorithm increasingly favors personal profiles and expert content over brand announcements. Companies that adapt with document posts, employee advocacy, and consistent scheduling are the ones still growing.",
            color: "from-red-500 to-orange-600",
          },
          {
            icon: Clock,
            stat: "2+ hours",
            title: "Time needed each week just to keep the page active",
            description:
              "Creating 2 to 3 quality company page posts per week, designing visuals, writing descriptions, and scheduling everything manually takes at least two hours. For small teams where everyone wears multiple hats, those two hours simply do not exist. The result is inconsistency, which is the single biggest killer of company page growth on LinkedIn.",
            color: "from-rose-500 to-red-600",
          },
        ]}
        bottomQuote="We created our company page months ago but nobody has time to post on it consistently..."
      />

      <LandingFeatures
        badge={{ icon: Sparkles, text: "Company Page Management Made Easy" }}
        headline={{
          text: "LinkedGrow keeps your company page active",
          gradient: "without the daily grind",
        }}
        description="Every tool you need to create, schedule, and manage company page content from one dashboard. No more abandoned pages, no more inconsistent posting."
        features={[
          {
            icon: Users,
            title: "Team Collaboration for Company Pages",
            description:
              "Company pages should not depend on one person. LinkedGrow's team collaboration lets multiple team members create, review, and schedule content for your company page. Assign roles like owner, admin, and member so everyone contributes without stepping on each other's toes. This is how agencies manage dozens of company pages at scale.",
            highlights: ["Role-based access", "Multi-member workflows", "Agency-ready"],
            badge: "Business",
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: Calendar,
            title: "Visual Content Calendar",
            description:
              "See your entire company page content schedule at a glance. The visual calendar shows what is going out, when, and on which days you have gaps. Drag and drop to rearrange posts, spot empty days before they become missed opportunities, and maintain the posting frequency that LinkedIn's algorithm rewards with better distribution.",
            highlights: ["Drag and drop scheduling", "Gap detection", "Weekly overview"],
            badge: "Pro+",
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: PenTool,
            title: "AI Content Generator with Brand Voice",
            description:
              "Generate company page posts that sound like your brand, not like a chatbot. LinkedGrow's voice training analyzes your existing content to capture your company's tone, vocabulary, and messaging style. Every AI-generated post maintains brand consistency whether it is a product update, industry insight, or hiring announcement.",
            highlights: ["Brand voice training", "24+ AI models", "Consistent messaging"],
            badge: "Core",
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: Zap,
            title: "Post Scheduling with Optimal Timing",
            description:
              "Schedule company page posts to go live at the exact times when your audience is most active on LinkedIn. Batch-create a week of content in one sitting and let LinkedGrow handle the publishing automatically. No more logging into LinkedIn every morning to manually post. Your content calendar runs itself.",
            highlights: ["Optimal time suggestions", "Auto-publishing", "Batch scheduling"],
            badge: "Pro+",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: Layers,
            title: "Carousel and Document Posts",
            description:
              "Document posts and carousels consistently generate the highest engagement on LinkedIn, outperforming text, images, and even video. LinkedGrow's carousel generator creates professional multi-slide posts with your brand colors and fonts. Turn company announcements, product features, or industry insights into swipeable carousels that keep viewers engaged.",
            highlights: ["Professional templates", "Brand customization", "Highest engagement format"],
            badge: "Pro",
            color: "from-pink-500 to-rose-500",
          },
          {
            icon: Megaphone,
            title: "Employee Advocacy Integration",
            description:
              "The biggest untapped growth channel for company pages is employee advocacy. When employees share company content from their personal profiles, the combined reach dwarfs what the company page achieves alone. LinkedGrow makes it easy for team members to access approved content and share it from their own profiles with a single click.",
            highlights: ["Shared content library", "One-click sharing", "Amplified reach"],
            badge: "Business",
            color: "from-teal-500 to-cyan-600",
          },
        ]}
        ctaText="Start Managing Your Company Page"
        ctaHref="/sign-up"
      />

      <LandingHowItWorks
        headline={{
          text: "Create and grow your company page in",
          gradient: "three steps",
        }}
        description="From initial setup to consistent content, here is how to build a LinkedIn company page that actually grows."
        steps={[
          {
            number: "01",
            title: "Create your company page on LinkedIn",
            description:
              "Log into LinkedIn, click the For Business dropdown in the top navigation, and select Create a Company Page. Choose your page type, which is Company for most businesses. Fill in your organization name, custom LinkedIn URL, industry, company size, and website. Check the verification box confirming you are authorized to represent the company, then click Create page. The entire process takes about ten minutes.",
            icon: Settings,
            color: "from-cyan-500 to-blue-500",
            time: "10 min",
          },
          {
            number: "02",
            title: "Optimize every section of your page",
            description:
              "Upload a high-resolution logo and a branded banner image. Write a compelling About section with industry keywords in the first few paragraphs since Google indexes this content. Add up to 20 specialties, set your call-to-action button, and add your office locations. Complete pages get significantly more weekly views than incomplete ones. Read our company page optimization guide for the full playbook.",
            icon: CheckCircle,
            color: "from-violet-500 to-purple-500",
            time: "1 hour",
          },
          {
            number: "03",
            title: "Set up LinkedGrow and start posting consistently",
            description:
              "Connect your LinkedIn account to LinkedGrow, set up your brand voice through voice training, and create your first week of company page content using the AI post generator. Schedule everything on the content calendar at optimal times. From here, spend 20 minutes each Monday batching content for the week. Your company page stays active without daily effort.",
            icon: Zap,
            color: "from-emerald-500 to-green-500",
            time: "20 min/week",
          },
        ]}
        totalTime="Setup: 1 hour, then 20 min/week"
      />

      <LandingBYOK
        badge={{ icon: Key, text: "Smart Economics" }}
        headline={{
          text: "Company page tools should not cost more",
          gradient: "than the results they deliver",
        }}
        description="Managing a company page with traditional social media tools means paying $50 to $200 per month per brand. LinkedGrow gives you AI content generation, scheduling, team collaboration, and analytics in one price because you bring your own AI key."
        competitor={{
          name: "Typical Social Media Tools",
          price: "$50-200/month",
          issues: [
            { text: "Limited posts per month with AI generation caps" },
            { text: "Extra seats cost extra for team collaboration" },
            { text: "Generic AI voice that does not match your brand" },
            { text: "Basic scheduling without optimal time suggestions" },
            { text: "No carousel or document post creation included" },
          ],
        }}
        linkedgrow={{
          price: "$99/month",
          apiCost: "$2-4/month",
          benefits: [
            { text: "Unlimited AI content generation with your own API key" },
            { text: "Team collaboration with role-based access included" },
            { text: "Voice training that maintains your brand tone" },
            { text: "Visual content calendar with optimal scheduling" },
            { text: "Carousel generator and image creation built in" },
          ],
        }}
        savingsText="Everything you need to manage your company page for under $25 per month"
      />

      <LandingTestimonials
        badge={{ icon: Users, text: "Company Page Success Stories" }}
        headline={{
          text: "Teams using LinkedGrow for their company pages see",
          gradient: "consistent growth",
        }}
        description="From solopreneurs managing a single page to agencies handling dozens, LinkedGrow keeps company pages active and growing."
        stats={[
          { value: "3-5x", label: "Posts per week on company pages", color: "text-cyan-600 dark:text-cyan-400" },
          { value: "20 min", label: "Weekly time investment", color: "text-emerald-600 dark:text-emerald-400" },
          { value: "2-3x", label: "More engagement with carousels", color: "text-violet-600 dark:text-violet-400" },
          { value: "$2-4", label: "Monthly AI cost with BYOK", color: "text-amber-600 dark:text-amber-400" },
        ]}
        testimonials={[
          {
            quote:
              "We created our company page six months ago and it sat empty for four of them. Once we set up LinkedGrow with voice training and started batch-scheduling content every Monday, our page went from zero engagement to consistent weekly growth. The carousel generator alone was worth the switch.",
            author: "James H.",
            role: "Marketing Director, SaaS Company",
          },
          {
            quote:
              "As an agency, we manage company pages for 15 clients. Before LinkedGrow, that meant logging into multiple accounts daily. Now our team creates and schedules everything from one dashboard with role-based access. We cut our content management time by more than half.",
            author: "Maria P.",
            role: "Agency Owner, 8-Person Team",
          },
          {
            quote:
              "The BYOK model is what sold me. I was paying $149 per month for another tool just to schedule posts to our company page. LinkedGrow gives me AI content, scheduling, and team features for $99 plus a few dollars in API costs. The content quality is actually better because the voice training matches our brand.",
            author: "Tom R.",
            role: "Startup Founder, B2B Tech",
          },
        ]}
      />

      <LandingFAQ
        headline={{
          text: "LinkedIn Company Page",
          gradient: "FAQ",
        }}
        description="Common questions about creating and managing a LinkedIn company page in 2026"
        faqs={[
          {
            question: "Can I create a LinkedIn company page for free?",
            answer:
              "Yes, creating a company page is completely free. You need a personal LinkedIn account and authorization to represent the company. LinkedIn also offers Premium Company Pages at around $77 per month for advanced features like competitor analytics and a verification badge, but the standard page costs nothing.",
          },
          {
            question: "What do I need before creating a LinkedIn company page?",
            answer:
              "An active personal LinkedIn profile with a verified email address. You must be authorized to act on behalf of the organization. LinkedIn will ask you to confirm this during setup. The creation takes about 10 minutes, but allow 1 to 2 hours for full optimization.",
          },
          {
            question: "Can I create a LinkedIn company page on mobile?",
            answer:
              "iOS supports company page creation through the LinkedIn app. Android does not support it natively. Android users should visit linkedin.com/company/setup/new/ in a mobile browser using desktop mode, or use a desktop computer for the best experience.",
          },
          {
            question: "How do I get my LinkedIn company page to show up in Google?",
            answer:
              "Include relevant keywords in your tagline and About section since Google indexes this content. Add up to 20 specialties, claim a custom URL, and post content regularly. Complete pages get significantly more visibility than incomplete ones.",
          },
          {
            question: "What is the difference between a company page and a showcase page?",
            answer:
              "A company page is your main business presence on LinkedIn. A showcase page is a sub-page for a specific brand, product, or initiative. Most businesses only need one company page. Large companies with multiple product lines use showcase pages to target different audiences.",
          },
          {
            question: "How often should I post on my LinkedIn company page?",
            answer:
              "2 to 5 posts per week is the optimal range. Research on over 2 million posts shows this frequency significantly boosts both impressions and engagement rate. Quality matters more than quantity. LinkedGrow's content calendar makes it easy to maintain this pace.",
          },
          {
            question: "Why does my company page get less reach than my personal profile?",
            answer:
              "LinkedIn's algorithm favors personal profiles over company pages. Personal posts get 5 to 8 times more organic reach. The best approach is to use both. Post brand content from the company page and amplify it through employee personal profiles using employee advocacy.",
          },
          {
            question: "Can LinkedGrow help manage my LinkedIn company page?",
            answer:
              "Yes. LinkedGrow lets you create AI-generated content in your brand voice, schedule posts at optimal times, manage a visual content calendar, create carousels, and collaborate with your team. Everything from one dashboard for $99 per month plus your own AI key costs.",
          },
        ]}
      />

      <LandingRelatedContent
        headline="Related Resources"
        links={[
          { title: "Optimize Your Company Page", href: "/linkedin-company-page-optimization" },
          { title: "Content Calendar", href: "/features/content-calendar" },
          { title: "Post Scheduling", href: "/features/post-scheduling" },
          { title: "For Agencies", href: "/for/agencies" },
          { title: "Team Collaboration", href: "/features/team-collaboration" },
        ]}
      />

      <LandingCTA
        badge="Start Building Your Company Page Today"
        headline={{
          line1: "Ready to create a LinkedIn company page",
          gradient: "that actually grows?",
        }}
        description="Generate brand-voice content with AI, schedule at optimal times, and keep your company page active every week. LinkedGrow handles the execution so your team can focus on the business."
        primaryCta={{ text: "Get started free", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
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
