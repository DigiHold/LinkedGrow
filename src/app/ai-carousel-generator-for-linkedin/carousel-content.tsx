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
  Eye,
  Clock,
  Palette,
  Target,
  Key,
  AlertTriangle,
  Users,
  Wand2,
  Layers,
  FileText,
  MousePointerClick,
  PenTool,
  Download,
} from "lucide-react";

export function CarouselGeneratorContent() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <AnimatedBackground />
      <Header />

      <LandingHero
        badge={{ icon: Layers, text: "AI Carousel Generator" }}
        headline={{
          line1: "Create AI-powered LinkedIn carousels",
          gradient: "that get 2x more clicks",
        }}
        descriptionBold="Carousels are the highest-engagement format on LinkedIn."
        description="LinkedGrow's AI carousel generator builds multi-slide carousels from your topics in minutes. AI generates the content for each slide, you customize with your brand colors and logo, then publish directly to LinkedIn. Swipeable carousels keep readers engaged longer than any other format."
        valuePropBadges={[
          { icon: MousePointerClick, text: "2x more clicks" },
          { icon: Sparkles, text: "AI content assist" },
          { icon: Palette, text: "Brand customization" },
        ]}
        primaryCta={{ text: "Start creating carousels", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={["Business plan feature", "AI content generation", "Cancel anytime"]}
        video={{
          videoId: "u31qwQUeGuM",
          thumbnailUrl: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/video-thumbnail.avif",
          duration: "0:10",
          ctaText: "See Pricing",
          ctaHref: "/pricing",
        }}
      />

      <LandingPainPoints
        badge={{ icon: AlertTriangle, text: "The Carousel Problem" }}
        badgeColor="red"
        headline={{
          text: "Building LinkedIn carousels manually is",
          gradient: "painfully time-consuming.",
        }}
        descriptionBold="A 10-slide carousel can take 2+ hours to create from scratch."
        description="Between planning the content structure, writing copy for each slide, designing in Canva or PowerPoint, maintaining brand consistency, and exporting to PDF - carousel creation is the most time-intensive content format on LinkedIn. Most creators give up before publishing their first one."
        problems={[
          {
            icon: Clock,
            stat: "2+ hrs",
            title: "To create one carousel manually",
            description:
              "Planning content for 8 to 12 slides, writing compelling copy for each one, designing visuals, and maintaining consistent branding across every slide takes most creators 2 to 4 hours. That is a full afternoon for a single post.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: Eye,
            stat: "2x",
            title: "More clicks than standard posts",
            description:
              "LinkedIn carousels receive approximately 2x more clicks than standard image posts. The swipeable format creates curiosity and encourages users to consume every slide. But the creation effort prevents most creators from publishing them regularly.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: Palette,
            stat: "$15-30",
            title: "Canva Pro subscription for basic design",
            description:
              "Creating professional carousels requires a design tool like Canva Pro ($15 per month) or Adobe Creative Cloud ($55 per month). Even then, you need design skills to make carousels that look professional and on-brand.",
            color: "from-red-500 to-orange-600",
          },
          {
            icon: Target,
            stat: "Inconsistent",
            title: "Branding across slides without a system",
            description:
              "Maintaining consistent colors, fonts, and layout across 10+ slides is difficult without a template system. Most manually-created carousels have subtle inconsistencies that undermine the professional appearance.",
            color: "from-rose-500 to-red-600",
          },
        ]}
        bottomQuote="I know carousels get better engagement but I cannot justify spending 3 hours creating one..."
      />

      <LandingFeatures
        badge={{ icon: Layers, text: "AI Carousel Features" }}
        headline={{
          text: "Build branded LinkedIn carousels",
          gradient: "in minutes, not hours",
        }}
        description="The AI carousel generator handles content creation and design so you can publish high-performing carousels consistently without the manual effort."
        features={[
          {
            icon: Wand2,
            title: "AI Content Generation",
            description:
              "Enter your topic and the AI generates structured content for each slide - headlines, body text, statistics, and call-to-action copy. Review and edit each slide individually or regenerate specific slides that need improvement.",
            highlights: ["Per-slide generation", "Structured content", "Edit individually"],
            badge: "AI-powered",
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: Palette,
            title: "Brand Customization",
            description:
              "Upload your logo, set your brand colors (primary and secondary), choose fonts, and customize the layout. Your brand settings are saved so every carousel you create maintains a consistent, professional visual identity automatically.",
            highlights: ["Logo upload", "Brand colors", "Font selection"],
            badge: "On-brand",
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: Layers,
            title: "Multi-Slide Builder",
            description:
              "Visual builder with drag-and-drop slide ordering. Add, remove, and reorder slides. Preview how each slide will look on LinkedIn before publishing. See the full carousel flow at a glance in the slide overview panel.",
            highlights: ["Drag and drop", "Preview mode", "Slide overview"],
            badge: "Visual",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: FileText,
            title: "Optimized Slide Count",
            description:
              "The AI suggests the optimal number of slides based on your topic complexity. Research shows 8 to 12 slides perform best on LinkedIn - enough to build momentum without causing drop-off. The AI structures content accordingly.",
            highlights: ["8-12 slides optimal", "AI-suggested", "Data-backed"],
            badge: "Optimized",
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: Download,
            title: "PDF Export for LinkedIn",
            description:
              "Export your finished carousel as a PDF document optimized for LinkedIn's carousel format. Each slide becomes a page with correct dimensions and file size. Upload to LinkedIn as a document post for the swipeable carousel experience.",
            highlights: ["LinkedIn-ready PDF", "Correct dimensions", "One-click export"],
            badge: "Export",
            color: "from-pink-500 to-rose-500",
          },
          {
            icon: Sparkles,
            title: "Templates and Layouts",
            description:
              "Start from pre-designed carousel templates or build from scratch. Templates include proven structures for educational content, how-to guides, listicles, and storytelling formats. Customize any template with your brand elements.",
            highlights: ["Pre-designed templates", "Multiple layouts", "Fully customizable"],
            badge: "Templates",
            color: "from-teal-500 to-cyan-600",
          },
        ]}
        ctaText="Start Creating Carousels"
        ctaHref="/sign-up"
      />

      <LandingHowItWorks
        headline={{
          text: "From topic to published carousel in",
          gradient: "under 10 minutes",
        }}
        description="What used to take hours now takes minutes with AI-powered carousel creation."
        steps={[
          {
            number: "01",
            title: "Enter your topic",
            description:
              "Provide your topic or key points for the carousel. The AI analyzes the content and suggests an optimal slide structure with the right number of slides for your topic complexity.",
            icon: PenTool,
            color: "from-cyan-500 to-blue-500",
            time: "1 min",
          },
          {
            number: "02",
            title: "AI generates slide content",
            description:
              "The AI creates compelling content for each slide including headlines, body text, and a strong call-to-action on the final slide. Review each slide and edit or regenerate any that need adjusting.",
            icon: Wand2,
            color: "from-violet-500 to-purple-500",
            time: "2 min",
          },
          {
            number: "03",
            title: "Customize with your brand",
            description:
              "Apply your brand colors, logo, and fonts. Rearrange slides with drag-and-drop. Preview how the carousel will look on LinkedIn. Fine-tune individual slides until the whole flow feels right.",
            icon: Palette,
            color: "from-emerald-500 to-green-500",
            time: "5 min",
          },
          {
            number: "04",
            title: "Export and publish",
            description:
              "Export as a LinkedIn-ready PDF. Publish directly to your profile or company page, or schedule for the optimal posting time. Your branded AI carousel is ready to drive 2x more clicks.",
            icon: Zap,
            color: "from-amber-500 to-yellow-500",
            time: "1 min",
          },
        ]}
        totalTime="Under 10 minutes total"
      />

      <LandingBYOK
        badge={{ icon: Key, text: "Smart Economics" }}
        headline={{
          text: "Why pay for a separate carousel tool",
          gradient: "when everything is included?",
        }}
        description="Standalone carousel tools charge $20 to $40 per month on top of your other LinkedIn tools. LinkedGrow includes carousel creation alongside post generation, images, scheduling, and analytics in one subscription."
        competitor={{
          name: "Separate Carousel + Content Tools",
          price: "$60-130/month total",
          issues: [
            { text: "Carousel tool ($20-40) separate from content generator ($49-199)" },
            { text: "No AI content generation - you write every slide manually" },
            { text: "Basic templates with limited brand customization" },
            { text: "Export to LinkedIn requires manual upload and formatting" },
            { text: "No integration with your post generation or scheduling workflow" },
          ],
        }}
        linkedgrow={{
          price: "$79/month",
          apiCost: "$2-4/month",
          benefits: [
            { text: "AI carousel generator with full content assist and brand customization" },
            { text: "Plus AI post generator, image creator, scheduling, analytics, A/B testing" },
            { text: "AI costs average $2 to $4 per month with BYOK - zero markup" },
            { text: "Everything in one platform with shared brand settings and workflow" },
            { text: "Team collaboration and API access included on Business plan" },
          ],
        }}
        savingsText="One platform replaces your entire LinkedIn tool stack"
      />

      <LandingTestimonials
        badge={{ icon: Users, text: "Carousel Results" }}
        headline={{
          text: "AI carousels are driving",
          gradient: "record engagement",
        }}
        description="LinkedIn creators are using AI-generated carousels to achieve engagement rates they never hit with standard posts."
        stats={[
          { value: "2x", label: "More clicks than standard posts", color: "text-cyan-600 dark:text-cyan-400" },
          { value: "< 10 min", label: "To create a full carousel", color: "text-emerald-600 dark:text-emerald-400" },
          { value: "3x", label: "Higher dwell time on content", color: "text-violet-600 dark:text-violet-400" },
          { value: "10-12", label: "Optimal slides per carousel", color: "text-amber-600 dark:text-amber-400" },
        ]}
        testimonials={[
          {
            quote:
              "My carousels consistently get 3x to 5x more engagement than my regular posts. Before LinkedGrow, I published maybe one carousel per month because they took so long. Now I publish 2 per week with the AI generator. My reach has exploded.",
            author: "Sophie M.",
            role: "Marketing Consultant, 28K Followers",
          },
          {
            quote:
              "The AI content generation for each slide is incredibly helpful. I enter my topic and get a structured 10-slide carousel with compelling headlines and clear messaging. I just tweak the wording, apply my brand, and publish. Takes 10 minutes tops.",
            author: "Daniel K.",
            role: "SaaS CEO, 35K Followers",
          },
          {
            quote:
              "Brand consistency across slides was always my biggest challenge. With LinkedGrow, I set my colors, fonts, and logo once, and every carousel looks professional and on-brand automatically. My team creates carousels without a designer now.",
            author: "Rachel P.",
            role: "Brand Director, 15K Followers",
          },
        ]}
      />

      <LandingFAQ
        headline={{
          text: "AI Carousel Generator",
          gradient: "FAQ",
        }}
        description="Everything about creating AI-powered LinkedIn carousels"
        faqs={[
          {
            question: "How does the AI carousel generator work?",
            answer:
              "Enter your topic, AI generates content for each slide (headlines, body, CTA). Customize with your brand, export as PDF, publish to LinkedIn. Under 10 minutes total.",
          },
          {
            question: "Do carousels actually get more engagement?",
            answer:
              "Yes. LinkedIn carousels get approximately 2x more clicks than standard image posts and significantly higher dwell time. The swipeable format drives curiosity and engagement.",
          },
          {
            question: "Can I customize with my brand?",
            answer:
              "Yes. Upload logo, set brand colors, choose fonts, customize layouts. Settings are saved so every carousel maintains consistent branding automatically.",
          },
          {
            question: "How many slides should a carousel have?",
            answer:
              "8 to 12 slides is optimal. Fewer than 6 underperform, more than 15 see higher drop-off. The AI suggests the right count based on your topic.",
          },
          {
            question: "Which plan includes carousels?",
            answer:
              "Business plan at $79 per month. Includes carousel generator plus A/B testing, team collaboration, advanced analytics, API access, and priority support.",
          },
          {
            question: "Can I schedule carousels?",
            answer:
              "Yes. Create your carousel, schedule it through the content calendar, and LinkedGrow publishes it at the specified time. Unlimited scheduling on Business plan.",
          },
          {
            question: "What format are exported carousels?",
            answer:
              "PDF format, which is what LinkedIn uses for carousel posts. Each slide becomes a page optimized for LinkedIn's dimensions and file size limits.",
          },
          {
            question: "Do I need design skills?",
            answer:
              "No. The AI generates content, templates provide the structure, and brand settings handle the visual consistency. Just enter your topic and customize.",
          },
        ]}
      />

      <LandingRelatedContent
        headline="Related Resources"
        links={[
          { title: "Carousel Generator", href: "/features/carousel-generator" },
          { title: "LinkedIn Carousel Guide", href: "/blog/linkedin-carousel-guide" },
          { title: "LinkedIn Image Sizes", href: "/free-tools/linkedin-image-sizes" },
        ]}
      />

      <LandingCTA
        badge="Start Creating AI LinkedIn Carousels"
        headline={{
          line1: "Ready to create carousels that get",
          gradient: "2x more clicks?",
        }}
        description="Stop spending hours building carousels manually. Let AI generate the content while you focus on your message and brand. Publish professional carousels in under 10 minutes."
        primaryCta={{ text: "Start creating carousels", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={[
          "Business plan feature",
          "AI content generation",
          "Brand customization",
          "Cancel anytime",
        ]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
