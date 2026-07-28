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
  Eye,
  EyeOff,
  UserCheck,
  Search,
  PenTool,
  TrendingUp,
  MessageCircle,
  BarChart3,
  Shield,
  UserPlus,
  Bell,
  Lock,
} from "lucide-react";

export function ProfileViewsContent() {
  return (
    <main className={V3_ROOT}>
      <Header />

      <LandingHero
        badge={{ icon: Eye, text: "LinkedIn Profile Views Guide" }}
        headline={{
          line1: "See Who Viewed Your LinkedIn Profile",
          gradient: "And Turn Visitors Into Opportunities",
        }}
        descriptionBold="Your LinkedIn profile gets views every day. But do you know who is looking, and are you doing anything about it?"
        description="Understanding LinkedIn profile views is the first step toward turning passive visitors into real connections and business opportunities. This guide covers everything: how profile views work on free and Premium accounts, the three privacy modes, why your views fluctuate, and how to consistently drive more of the right people to your profile. LinkedGrow helps you create the content that gets you noticed and keeps your profile in front of the people who matter most."
        valuePropBadges={[
          { icon: Eye, text: "Profile view mechanics" },
          { icon: Shield, text: "Privacy settings explained" },
          { icon: TrendingUp, text: "Growth strategies" },
        ]}
        primaryCta={{ text: "Start growing your visibility", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={["7-day Pro trial included", "Everything included", "Cancel anytime"]}
        video={{
          videoId: "5cE1BRvxfiQ",
          thumbnailUrl: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/video-thumbnail-promo.avif",
          duration: "0:10",
          ctaText: "See Pricing",
          ctaHref: "/pricing",
        }}
      />

      <LandingPainPoints
        badge={{ icon: AlertTriangle, text: "The Profile Views Problem" }}
        badgeColor="red"
        headline={{
          text: "Most people treat profile views as a vanity metric.",
          gradient: "They are missing the real value.",
        }}
        descriptionBold="Every profile view represents a real person who was curious enough to click on your name."
        description="Maybe they saw your comment on a post. Maybe your content appeared in their feed. Maybe a recruiter searched for your skills and your profile came up. Whatever the reason, that person took an action that most LinkedIn users completely ignore. The difference between professionals who grow on LinkedIn and those who stay invisible is what happens after someone views their profile. If your content is inconsistent and your profile is bare, those visitors leave and never come back."
        problems={[
          {
            icon: EyeOff,
            stat: "5 only",
            title: "Free accounts see just the last 5 viewers",
            description:
              "LinkedIn shows free users only the 5 most recent profile visitors from the past 90 days. If 50 people viewed your profile this week, you will only see the last 5. The rest are invisible to you. This means you are missing potential leads, recruiters, and collaborators who showed genuine interest in what you do but never made it to your limited viewer list.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: Clock,
            stat: "90 days",
            title: "Free viewer history disappears after 3 months",
            description:
              "Profile view data on free accounts only goes back 90 days. Premium extends this to a full year with filters by company, industry, and location. For most professionals, 90 days of partial data is not enough to spot trends. You cannot see whether your profile views are growing or shrinking over time, which makes it impossible to know if your LinkedIn strategy is actually working.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: Lock,
            stat: "Hidden",
            title: "Private browsers are invisible to everyone",
            description:
              "A significant number of LinkedIn users browse in private mode. When someone views your profile in private mode, all you see is that an anonymous LinkedIn member visited. No name, no company, no job title. Even Premium cannot reveal their identity. These hidden visitors could be your ideal clients or potential partners, and you will never know they were interested.",
            color: "from-red-500 to-orange-600",
          },
          {
            icon: TrendingUp,
            stat: "Declining",
            title: "Profile views drop when you stop posting",
            description:
              "LinkedIn profile views are directly tied to your content activity. When you post regularly, your name and headline appear in feeds across your network, driving people to click through to your profile. When you go quiet for even a week or two, profile views can drop by half. Most professionals post inconsistently because writing takes time. The result is a cycle of visibility spikes followed by long stretches of being invisible.",
            color: "from-rose-500 to-red-600",
          },
        ]}
        bottomQuote="I check my profile views every week but I never know what to do with the information..."
      />

      <LandingFeatures
        badge={{ icon: Sparkles, text: "Drive More Profile Views" }}
        headline={{
          text: "Turn your LinkedIn profile into a",
          gradient: "lead generation machine",
        }}
        description="Profile views do not happen by accident. They are the result of showing up consistently with content that makes people curious about who you are. LinkedGrow handles the hard part."
        features={[
          {
            icon: PenTool,
            title: "AI Content That Puts Your Name in Feeds",
            description:
              "Every LinkedIn post you publish puts your name and headline in front of your network. The more you post, the more people see you, and the more profile views you get. LinkedGrow's AI post generator creates content in your authentic voice so you can publish 3 to 5 times per week without spending hours writing. More posts means more visibility means more profile views.",
            highlights: ["Voice-trained AI writing", "24+ models to choose from", "Your tone and vocabulary"],
            badge: "Core",
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: Target,
            title: "Hook Generator for Maximum Visibility",
            description:
              "The opening lines of your LinkedIn post determine whether people scroll past or stop to read. A strong hook gets more engagement, which tells the algorithm to show your post to more people. More eyeballs on your content means more clicks to your profile. LinkedGrow's hook generator creates proven opening lines tailored to your topic and audience.",
            highlights: ["Proven hook formulas", "Topic-specific hooks", "More engagement, more views"],
            badge: "Pro",
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: Calendar,
            title: "Consistent Scheduling at Optimal Times",
            description:
              "Posting once a month does nothing for profile views. Consistency is what drives sustained visibility on LinkedIn. LinkedGrow's content calendar and scheduler let you batch-create posts and schedule them at the times when your audience is most active. Your profile stays visible all week without daily effort.",
            highlights: ["Visual content calendar", "Optimal time suggestions", "Batch creation workflow"],
            badge: "Starter+",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: UserCheck,
            title: "Voice Training for Authentic Content",
            description:
              "People click through to profiles when a post feels genuine and insightful. Generic AI content does the opposite. LinkedGrow's voice training analyzes your writing style from sample posts so every generated post sounds exactly like you. Authentic content builds trust, and trust drives profile clicks.",
            highlights: ["Analyze your writing style", "Match your vocabulary", "Sound human, not robotic"],
            badge: "Core",
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: BarChart3,
            title: "Analytics to Track What Works",
            description:
              "Not all content drives profile views equally. Some topics and formats perform better with your specific audience. LinkedGrow's analytics help you identify which posts generate the most engagement so you can create more of what works and less of what does not. Data-driven content strategy leads to consistent profile growth.",
            highlights: ["Engagement tracking", "Format comparison", "Performance trends"],
            badge: "Pro",
            color: "from-pink-500 to-rose-500",
          },
          {
            icon: MessageCircle,
            title: "Comment Strategy for Network Growth",
            description:
              "Posting is not the only way to get profile views. Every comment you leave on someone else's post shows your name and headline to their entire audience. Strategic commenting on popular posts in your niche can drive just as many profile views as your own content. LinkedGrow's network notifications help you stay active in the conversations that matter.",
            highlights: ["Feed viewing in dashboard", "Quick engagement workflow", "Targeted commenting"],
            badge: "Pro",
            color: "from-teal-500 to-cyan-600",
          },
        ]}
        ctaText="Start Getting More Profile Views"
        ctaHref="/sign-up"
      />

      <LandingHowItWorks
        headline={{
          text: "Go from invisible to unforgettable in",
          gradient: "three simple steps",
        }}
        description="Stop wondering who viewed your profile and start making sure the right people do."
        steps={[
          {
            number: "01",
            title: "Train your AI voice and optimize your profile",
            description:
              "Paste 3 to 5 of your best LinkedIn posts into LinkedGrow's voice training. The AI learns your writing style, vocabulary, and tone. Set your business description and target audience so generated content speaks directly to the people you want visiting your profile. A well-optimized profile with consistent content is what converts viewers into connections.",
            icon: UserCheck,
            color: "from-cyan-500 to-blue-500",
            time: "5 min",
          },
          {
            number: "02",
            title: "Generate a week of visibility-driving content",
            description:
              "Use the AI post generator to create 3 to 5 posts for the week. Each one opens with a hook that stops the scroll, delivers genuine value on your niche topic, and ends with an invitation to engage. Mix text posts with carousels and images for maximum reach. Every post puts your name in feeds and drives profile visits.",
            icon: PenTool,
            color: "from-violet-500 to-purple-500",
            time: "10 min",
          },
          {
            number: "03",
            title: "Schedule, publish, and watch profile views climb",
            description:
              "Place your posts on the content calendar at suggested optimal times and let LinkedGrow handle the publishing. When posts go live, spend 10 to 15 minutes engaging with comments on your content and leaving thoughtful comments on other posts in your niche. This combination of original content plus strategic engagement is how profile views compound week after week.",
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
          text: "More profile views should not cost you",
          gradient: "a fortune every month",
        }}
        description="Most LinkedIn growth tools charge $50 to $200 per month for features that help you post consistently. LinkedGrow gives you AI content generation, scheduling, voice training, and analytics for a fraction of the price because you bring your own AI key."
        competitor={{
          name: "Typical LinkedIn Tools",
          price: "$50-200/month",
          issues: [
            { text: "Limited AI generations capped by your subscription tier" },
            { text: "Generic AI voice that sounds like everyone else" },
            { text: "No voice training to match your writing style" },
            { text: "Basic scheduling without optimal time suggestions" },
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
            { text: "Hook generator, carousel creator, and image generation" },
            { text: "Everything in one platform from $13 per month" },
          ],
        }}
        savingsText="All the tools to maximize your LinkedIn visibility for under $25 per month"
      />

      <LandingTestimonials
        badge={{ icon: Users, text: "Real Results" }}
        headline={{
          text: "Consistent content is driving",
          gradient: "real profile growth",
        }}
        description="LinkedIn professionals using LinkedGrow to post consistently are seeing measurable increases in profile views, connection requests, and business opportunities."
        stats={[
          { value: "3-5x", label: "More profile views with daily posting", color: "text-cyan-600 dark:text-cyan-400" },
          { value: "20 min", label: "Per week to stay consistently visible", color: "text-emerald-600 dark:text-emerald-400" },
          { value: "2-3x", label: "More engagement with voice-trained AI", color: "text-violet-600 dark:text-violet-400" },
          { value: "$2-4", label: "Monthly AI cost with BYOK", color: "text-amber-600 dark:text-amber-400" },
        ]}
        testimonials={[
          {
            quote:
              "My profile views tripled in the first month after I started using LinkedGrow to post consistently. I went from maybe 30 views per week to over 100. The difference is that I actually post 4 times a week now instead of once every two weeks when I remembered.",
            author: "James M.",
            role: "B2B Sales Consultant, 14K Followers",
          },
          {
            quote:
              "I used to spend an hour writing each post. Now I generate 5 posts in 10 minutes and they sound more like me than what I was writing manually. My profile views and connection requests have gone up significantly since I started posting every day.",
            author: "Priya S.",
            role: "Tech Recruiter, 9K Followers",
          },
          {
            quote:
              "The combination of consistent posting and the hook generator changed everything. People actually stop scrolling and read my posts now. More reads means more profile visits, and more profile visits means more leads reaching out directly.",
            author: "Carlos R.",
            role: "Freelance Consultant, 7K Followers",
          },
        ]}
      />

      <LandingFAQ
        headline={{
          text: "LinkedIn Profile Views",
          gradient: "FAQ",
        }}
        description="Answers to common questions about LinkedIn profile views, privacy settings, and how to get more visibility"
        faqs={[
          {
            question: "Can I see who viewed my LinkedIn profile without Premium?",
            answer:
              "Yes, but you only see the last 5 viewers from the past 90 days. Premium shows all viewers for 365 days with filters by company, industry, and location. LinkedGrow helps you maximize views through consistent content so more of the right people visit your profile.",
          },
          {
            question: "Does LinkedIn notify someone when I view their profile?",
            answer:
              "It depends on your browsing mode. Public mode shows your full name and headline. Semi-private shows your job title and company without your name. Private mode shows only that an anonymous member visited. Free users who switch to private lose access to their own viewer list.",
          },
          {
            question: "Why did my LinkedIn profile views drop?",
            answer:
              "Usually because you stopped posting or reduced your posting frequency. Profile views are directly tied to content activity. When you post, your name appears in feeds, driving profile clicks. When you stop, visibility drops fast. Consistent posting with LinkedGrow solves this.",
          },
          {
            question: "Can Premium users see who viewed in private mode?",
            answer:
              "No. Private mode hides your identity from everyone, including Premium users. They only see that an anonymous LinkedIn member visited. The trade-off for free users is that enabling private mode removes your ability to see your own viewer list.",
          },
          {
            question: "How do I increase my LinkedIn profile views?",
            answer:
              "Post content consistently, optimize your headline with relevant keywords, add a professional photo, and engage with other people's content through comments. Each post and comment puts your name in front of new audiences who may click through to your profile.",
          },
          {
            question: "Should I view prospects' profiles before connecting?",
            answer:
              "Yes. Viewing someone's profile sends them a notification, creating a warm touchpoint before you send a connection request. This profile view warmup strategy makes your name familiar before you reach out directly.",
          },
          {
            question: "What is the best way to turn profile views into leads?",
            answer:
              "Optimize your headline to clearly communicate who you help and what you do. Make your About section a value proposition, not a resume. Post content that demonstrates your expertise. When the right people view your profile, they should immediately understand why connecting with you benefits them.",
          },
          {
            question: "How does LinkedGrow help me get more profile views?",
            answer:
              "LinkedGrow makes consistent posting effortless with AI content generation in your voice, optimal scheduling, hook generation, and a visual content calendar. More consistent high-quality content means your name appears in more feeds, driving more profile visits every week.",
          },
        ]}
      />

      <LandingRelatedContent
        headline="Related Resources"
        links={[
          { title: "LinkedIn Analytics Guide", href: "/blog/linkedin-analytics-metrics-guide" },
          { title: "Personal Branding on LinkedIn", href: "/use-cases/personal-branding" },
          { title: "LinkedIn Algorithm 2026", href: "/blog/linkedin-algorithm-2026" },
        ]}
      />

      <LandingCTA
        badge="Start Getting More LinkedIn Profile Views Today"
        headline={{
          line1: "Ready to turn profile visitors",
          gradient: "into real opportunities?",
        }}
        description="Create content that puts your name in front of the right people every day. LinkedGrow handles the writing and scheduling so you can focus on building relationships with the people who actually visit your profile."
        primaryCta={{ text: "Get started free", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={[
          "7-day Pro trial included",
          "Everything included",
          "24+ AI models",
          "Cancel anytime",
        ]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
