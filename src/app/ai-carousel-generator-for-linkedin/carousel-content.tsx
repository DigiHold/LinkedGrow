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
  Eye,
  Clock,
  Target,
  Key,
  AlertTriangle,
  Users,
  Wand2,
  Layers,
  Type,
  MousePointerClick,
  PenTool,
  ListChecks,
  Bot,
  ArrowRight,
} from "lucide-react";

export function CarouselGeneratorContent() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <AnimatedBackground />
      <Header />

      <LandingHero
        badge={{ icon: Bot, text: "AI Builds the Carousel for You" }}
        headline={{
          line1: "LinkedIn carousel maker",
          gradient: "where AI writes every slide",
        }}
        descriptionBold="Paste a topic. The AI structures it, writes every slide, and hands you the finished draft."
        description="Most carousel tools give you a blank canvas and call it a day. The AI carousel maker does the work before you ever touch the editor. It picks the slide count for your topic, drafts a hook for slide 1, writes the middle slides, and lands a call-to-action on the last. You review the draft, tweak what you want, and export to LinkedIn."
        valuePropBadges={[
          { icon: Wand2, text: "AI writes every slide" },
          { icon: ListChecks, text: "AI picks slide count" },
          { icon: MousePointerClick, text: "2x more clicks" },
        ]}
        primaryCta={{ text: "Start creating carousels", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={["Business plan feature", "AI writes every slide", "Cancel anytime"]}
        video={{
          videoId: "5cE1BRvxfiQ",
          thumbnailUrl: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/video-thumbnail-promo.avif",
          duration: "0:10",
          ctaText: "See Pricing",
          ctaHref: "/pricing",
        }}
      />

      <LandingPainPoints
        badge={{ icon: AlertTriangle, text: "Why Carousel Editors Stall You" }}
        badgeColor="red"
        headline={{
          text: "Most carousel tools hand you",
          gradient: "a blank canvas and a deadline.",
        }}
        descriptionBold="The hard part of a LinkedIn carousel is not the design. It is the structure."
        description="You can pick a template in two seconds. But deciding how to break your idea into 10 slides, what each slide should say, where the hook goes, where the CTA lands - that is where most carousels die before they get published. AI assist is supposed to solve this. Most tools only assist with one slide at a time."
        problems={[
          {
            icon: Type,
            stat: "Blank",
            title: "Editor with no AI structuring",
            description:
              "Standard carousel editors open to an empty canvas. You decide how many slides, what each slide says, what order they go in. The AI - if any - just writes one slide when asked. The structural decisions are still all yours.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: ListChecks,
            stat: "Manual",
            title: "Slide count guessing for every topic",
            description:
              "8 slides or 12? Where does the hook go and where does the CTA land? Most editors leave that up to you. If you guess wrong, the carousel drops off mid-swipe and the algorithm punishes the post.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: Clock,
            stat: "2-3 hrs",
            title: "From idea to draft in standard editors",
            description:
              "Even with templates and AI image assist, manually writing copy for 10 slides and arranging them in the right order takes most creators 2 to 3 hours per carousel. That is why most LinkedIn creators publish one carousel a month at best.",
            color: "from-red-500 to-orange-600",
          },
          {
            icon: Eye,
            stat: "2x",
            title: "More clicks left on the table without carousels",
            description:
              "LinkedIn carousels get roughly 2x the clicks of single-image posts. But the creation effort is the bottleneck. The format wins. The friction loses. Most creators give up on carousels because building one feels disproportionate to building a regular post.",
            color: "from-rose-500 to-red-600",
          },
        ]}
        bottomQuote="I want to publish carousels weekly, but every time I open the editor I spend an hour staring at a blank slide 1..."
      />

      <LandingFeatures
        badge={{ icon: Bot, text: "What the AI Maker Does Before You Edit" }}
        headline={{
          text: "AI carousel automation",
          gradient: "before the editor opens",
        }}
        description="The maker runs a structuring pass on your topic before you see the first slide. By the time the editor loads, the whole carousel is drafted - hook on slide 1, payload through the middle, CTA on the last."
        features={[
          {
            icon: ListChecks,
            title: "AI structures your topic into slides",
            description:
              "Paste a topic, paste a Reddit post, paste a thread - the AI breaks it into slides automatically. It picks the slide count (8 to 12 typical), decides what each slide carries, and lays out the arc. You start with a finished structure, not a blank canvas.",
            highlights: ["8 to 12 slide range", "Auto slide count", "Arc detection"],
            badge: "Automation",
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: Wand2,
            title: "Every slide written by AI",
            description:
              "Hook on slide 1 designed to stop the scroll. Body slides break your topic into single-idea units. Final slide carries the call-to-action. You can regenerate any slide individually or rewrite all of them in one pass.",
            highlights: ["Hook slide 1", "Single-idea body", "CTA slide last"],
            badge: "AI copy",
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: ArrowRight,
            title: "Reddit-to-carousel converter",
            description:
              "Paste a viral Reddit thread URL. The AI extracts the key beats, structures them into a swipeable carousel, and writes the slides. Same trick works for blog posts, articles, or any URL with extractable text.",
            highlights: ["URL input supported", "Auto beat extraction", "One-click conversion"],
            badge: "Workflow",
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: Sparkles,
            title: "AI picks the model that writes best",
            description:
              "Carousels lean narrative. The maker defaults to models that handle pacing well - Claude Opus 4.7, Gemini 3 Pro - but you can switch to any of the 26 supported models if you want a different voice across slides.",
            highlights: ["Narrative-tuned default", "26 models switchable", "Per-slide override"],
            badge: "Model choice",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: Layers,
            title: "Visual editor opens with your draft loaded",
            description:
              "When the AI is done structuring and writing, the visual editor opens with the carousel already populated. Your brand colors, logo, and fonts apply automatically. Refine, regenerate, or just export.",
            highlights: ["Auto-populated draft", "Brand auto-applied", "Refine optional"],
            badge: "Handoff",
            color: "from-pink-500 to-rose-500",
          },
          {
            icon: Key,
            title: "BYOK keeps AI generation affordable",
            description:
              "The structuring pass plus 10 slide drafts costs cents on BYOK pricing. Most users spend $2 to $4 per month on AI even when they publish carousels weekly. LinkedGrow takes zero markup.",
            highlights: ["Zero markup", "$2 to $4 typical", "Pay providers directly"],
            badge: "Pricing",
            color: "from-teal-500 to-cyan-600",
          },
        ]}
        ctaText="Try the AI maker free"
        ctaHref="/sign-up"
      />

      <LandingHowItWorks
        headline={{
          text: "Topic in. Carousel out.",
          gradient: "Under 10 minutes.",
        }}
        description="The AI handles structure and copy. You handle taste."
        steps={[
          {
            number: "01",
            title: "Paste a topic or a URL",
            description:
              "Drop in a topic, a key insight, a Reddit thread URL, or a blog post link. The AI analyzes the source, decides the optimal slide count for the topic complexity, and plans the arc - hook, payload, CTA.",
            icon: PenTool,
            color: "from-cyan-500 to-blue-500",
            time: "30 sec",
          },
          {
            number: "02",
            title: "AI writes every slide",
            description:
              "The maker drafts each slide in sequence. Hook slide pulls the swipe. Body slides break your idea into single thoughts. CTA slide closes. By the time you open the editor, the whole carousel is written.",
            icon: Bot,
            color: "from-violet-500 to-purple-500",
            time: "1 to 2 min",
          },
          {
            number: "03",
            title: "Tweak and export",
            description:
              "Open the editor with the draft loaded and your branding applied. Regenerate any slide that does not land, edit wording inline, swap the hook if you have a stronger one. Export as PDF and publish or schedule to LinkedIn.",
            icon: Zap,
            color: "from-emerald-500 to-green-500",
            time: "5 to 8 min",
          },
        ]}
        totalTime="Under 10 minutes per carousel"
      />

      <LandingBYOK
        badge={{ icon: Key, text: "Why an AI Maker Beats a Manual Editor" }}
        headline={{
          text: "Manual editors give you the canvas.",
          gradient: "The AI maker gives you the draft.",
        }}
        description="Standalone carousel editors stop at the editor. You still write every slide. LinkedGrow's AI maker drafts the entire carousel from your topic before you ever open the canvas - structure, copy, and CTA all written."
        competitor={{
          name: "Standalone Carousel Editors",
          price: "$20 to $40/month",
          issues: [
            { text: "Empty canvas - you write every slide manually" },
            { text: "No structural AI - you decide slide count and arc" },
            { text: "AI assist limited to one slide at a time when present" },
            { text: "No URL or thread-to-carousel conversion" },
            { text: "No integrated scheduling - manual upload to LinkedIn" },
          ],
        }}
        linkedgrow={{
          price: "$79/month (Business)",
          apiCost: "$2 to $4/month BYOK",
          benefits: [
            { text: "AI drafts the entire carousel before you open the editor" },
            { text: "Topic, Reddit URL, blog post - all valid inputs" },
            { text: "26 AI models to switch between for different writing styles" },
            { text: "Brand colors and logo auto-applied on every slide" },
            { text: "Schedule and publish to LinkedIn from the same dashboard" },
          ],
        }}
        savingsText="Most carousels go from topic to published in under 10 minutes"
      />

      <LandingTestimonials
        badge={{ icon: Users, text: "Carousels That Actually Get Built" }}
        headline={{
          text: "The carousels you stopped publishing,",
          gradient: "back in your weekly mix",
        }}
        description="LinkedIn creators describe what changes when the AI does the structural work and writes the slides for them."
        stats={[
          { value: "2x", label: "More clicks than standard posts", color: "text-cyan-600 dark:text-cyan-400" },
          { value: "< 10 min", label: "From topic to published", color: "text-emerald-600 dark:text-emerald-400" },
          { value: "26", label: "AI models switchable", color: "text-violet-600 dark:text-violet-400" },
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
          text: "AI Carousel Maker",
          gradient: "FAQ",
        }}
        description="Common questions about AI-driven carousel generation"
        faqs={[
          {
            question: "How is the AI carousel maker different from a regular carousel editor?",
            answer:
              "A regular editor gives you a canvas and waits for you to write the slides. The AI maker drafts the entire carousel first - it picks the slide count, writes the hook, writes the body slides, and lands the CTA. You only see the editor after the draft is built. If you prefer manual control, our visual carousel editor page is the right starting point.",
          },
          {
            question: "What can I paste as a starting input?",
            answer:
              "A topic, a key insight, a Reddit thread URL, a blog post link, or a rough outline. The AI extracts what is useful and structures it into slides. URL-based conversion works for any page with extractable text content.",
          },
          {
            question: "Do LinkedIn carousels actually get more engagement?",
            answer:
              "Yes. LinkedIn carousels (document posts) receive approximately 2x more clicks than standard image posts and significantly higher dwell time. The swipeable format encourages users to spend more time with your content, which signals high quality to the algorithm and increases your reach.",
          },
          {
            question: "How does the AI decide the slide count?",
            answer:
              "The AI analyzes the complexity and breadth of your topic. Simple topics get 8 slides. Wider topics get 10 to 12. The 8-to-12 range is what generally performs best on LinkedIn carousels - fewer than 6 underperforms and over 15 drops off mid-swipe. You can override the AI count manually.",
          },
          {
            question: "Can I customize the carousel design with my brand?",
            answer:
              "Yes. Upload your logo, set your brand colors (primary and secondary), choose fonts, and customize the layout of each slide. Your brand settings are saved to your profile so every carousel you create maintains a consistent visual identity automatically.",
          },
          {
            question: "What AI features does the carousel builder include?",
            answer:
              "The AI structures your topic into slides, writes a hook for slide 1, drafts each body slide, and writes a call-to-action on the final slide. It also picks the optimal slide count, suggests model choice, and applies your brand automatically. You provide the topic and the AI does the rest.",
          },
          {
            question: "How many slides should a LinkedIn carousel have?",
            answer:
              "The optimal length is 8 to 12 slides. Research shows that carousels with fewer than 6 slides underperform because there is not enough content to build momentum, while carousels over 15 slides see higher drop-off rates. The AI suggests an optimal slide count based on your topic complexity.",
          },
          {
            question: "Which plan includes the AI carousel maker?",
            answer:
              "The carousel maker is available on the Business plan at $79 per month. This plan also includes A/B testing, team collaboration, advanced analytics, API access, and priority support. The Pro plan at $39 per month includes post generation and image generation but not carousel creation.",
          },
          {
            question: "Can I schedule carousels to publish to LinkedIn?",
            answer:
              "Yes. After the AI generates your carousel, you can publish it directly to your LinkedIn profile or company page, or schedule it for a specific date and time using the content calendar. The Business plan includes unlimited scheduling.",
          },
          {
            question: "What format are the exported carousels?",
            answer:
              "Carousels are exported as PDF documents, which is the format LinkedIn uses for carousel posts. Each slide becomes a page in the PDF. The export is optimized for LinkedIn's recommended dimensions and file size limits.",
          },
        ]}
      />

      <LandingRelatedContent
        headline="Related Resources"
        links={[
          { title: "Visual Carousel Editor", href: "/features/carousel-generator" },
          { title: "LinkedIn Carousel Guide", href: "/blog/linkedin-carousel-templates" },
          { title: "LinkedIn Image Sizes", href: "/free-tools/linkedin-image-sizes" },
        ]}
      />

      <LandingCTA
        badge="Start Building Carousels with AI"
        headline={{
          line1: "Ready to skip the blank canvas and",
          gradient: "let AI draft the carousel?",
        }}
        description="Paste your topic, watch the AI structure it into slides, and tweak the draft until you are happy. Most carousels are published in under 10 minutes."
        primaryCta={{ text: "Start creating carousels", href: "/sign-up" }}
        secondaryCta={{ text: "LinkedIn post generator", href: "/" }}
        trustIndicators={[
          "Business plan feature",
          "AI writes every slide",
          "26 AI models",
          "Cancel anytime",
        ]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
