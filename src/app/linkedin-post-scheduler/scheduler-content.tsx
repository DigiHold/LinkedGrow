"use client";

import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";
import { AnimatedBackground } from "@/components/marketing/animated-background";
import { LandingCTA } from "@/components/landing/landing-cta";
import { LandingRelatedContent } from "@/components/landing/landing-related-content";
import { MarketingExitIntentPopup } from "@/components/marketing/exit-intent-popup";
import { FAQAccordion } from "@/components/blog/faq-accordion";
import {
  Award,
  Check,
  X,
  ArrowRight,
  Calendar,
  Zap,
  Building2,
  CircleDollarSign,
  Sparkles,
} from "lucide-react";

const R2 =
  "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/blog/best-ai-linkedin-post-generator";

type ToolReview = {
  rank: number;
  name: string;
  tagline: string;
  pricing: string;
  freeTrial: string;
  bestFor: string;
  imageSlug: string;
  imageAlt: string;
  overview: string[];
  pros: string[];
  cons: string[];
  accent: string;
  ctaLabel: string;
  ctaHref: string;
};

const tools: ToolReview[] = [
  {
    rank: 1,
    name: "LinkedGrow",
    tagline: "Best for AI-powered scheduling with BYOK",
    pricing: "$13/mo Starter, $27/mo Pro, $55/mo Business (yearly)",
    freeTrial: "7-day Pro trial, no card required",
    bestFor:
      "Founders and creators who want to write with AI and schedule from the same dashboard at the lowest total cost.",
    imageSlug: "linkedgrow-card",
    imageAlt:
      "LinkedGrow dashboard with content calendar, AI post composer, and direct publishing to LinkedIn profiles and company pages",
    overview: [
      "LinkedGrow is the only LinkedIn scheduling tool with BYOK AI generation built in across 26+ models. You write or generate a post, schedule it from the same editor, and the tool publishes directly to your profile or any company page you manage. Total monthly cost lands at $15 to $30 all-in including AI fees.",
      "Scheduling is powered by QStash for exact-time delivery, so posts fire even if you are offline. The visual content calendar shows a week or month view with drag-and-drop rescheduling, and color coding distinguishes drafts, scheduled, and published posts.",
      "Starter unlocks scheduling for 10 posts at a time. Pro and Business plans ship unlimited scheduling plus carousel scheduling, A/B test scheduling, and team workflows on Business.",
    ],
    pros: [
      "AI post generation + scheduling in one dashboard, no copy-paste between tools",
      "BYOK across 26+ AI models keeps total cost at $15 to $30/mo all-in",
      "Direct publishing to personal profiles AND company pages on every plan",
      "Visual content calendar with drag-and-drop rescheduling",
      "Exact-time delivery via QStash, fires even if you are offline",
    ],
    cons: [
      "10-post scheduling cap on Starter (Pro and Business are unlimited)",
      "BYOK setup adds 2 minutes for the API key",
      "Smaller community than legacy schedulers like Hootsuite or Buffer",
    ],
    accent: "from-cyan-500 to-blue-600",
    ctaLabel: "Start free 7-day Pro trial",
    ctaHref: "/sign-up",
  },
  {
    rank: 2,
    name: "Taplio",
    tagline: "Best for scheduling + outreach in one tool",
    pricing: "Starter $39, Standard $52, Pro $149/mo (yearly)",
    freeTrial: "7-day free trial, card required",
    bestFor:
      "Salespeople who want LinkedIn content scheduling plus automated DMs and a lead database in a single subscription.",
    imageSlug: "taplio-card",
    imageAlt:
      "Taplio scheduling interface with viral posts library, AI composer, and lead database outreach module",
    overview: [
      "Taplio combines scheduling with the largest viral LinkedIn posts library on the market plus outreach automation (auto-DMs, auto-connect, comment-at-scale). The scheduler itself is solid - calendar view, queue, recurring posts - but the lock-in is the outreach side.",
      "AI generation is bundled in the $52 Standard plan and above. The $39 Starter ships scheduling and the hooks library but zero AI credits.",
    ],
    pros: [
      "Best-in-class viral hooks library for ideation before scheduling",
      "3M+ lead database on the Pro plan",
      "Outreach automation built in - DMs, connection requests, comments",
    ],
    cons: [
      "Starter at $39/mo includes zero AI credits",
      "Single bundled AI model, no choice or BYOK",
      "Pro plan needed for the features that justify the price ($149/mo yearly)",
    ],
    accent: "from-violet-500 to-purple-600",
    ctaLabel: "See LinkedGrow vs Taplio",
    ctaHref: "/compare/taplio-alternative",
  },
  {
    rank: 3,
    name: "Buffer",
    tagline: "Best for multi-platform scheduling",
    pricing: "Free, Essentials $20/mo, Team $40/mo",
    freeTrial: "Free plan available",
    bestFor:
      "Creators and small teams who post to LinkedIn alongside X, Instagram, TikTok, Facebook, Pinterest, and YouTube from one dashboard.",
    imageSlug: "buffer-card",
    imageAlt:
      "Buffer multi-platform composer with channel selector for LinkedIn, X, Instagram, Facebook, TikTok, and Pinterest",
    overview: [
      "Buffer is the established multi-platform scheduler. The free plan covers 3 channels with 10 scheduled posts per channel - enough for a solo LinkedIn-only creator. Paid plans add unlimited posts and the AI Assistant for content suggestions.",
      "LinkedIn is supported alongside every major social network, but it is treated as one of many - you will not find LinkedIn-specific features like hook libraries, voice training, or 360Brew algorithm optimization. If LinkedIn is your only channel, a LinkedIn-first scheduler will serve you better.",
    ],
    pros: [
      "Generous free plan with 3 channels",
      "Clean, reliable UI with a long track record",
      "Multi-platform - X, Instagram, TikTok, Facebook, LinkedIn, Pinterest, YouTube",
    ],
    cons: [
      "LinkedIn-specific features (hooks, analytics, voice) are thin",
      "AI assist is generic, not LinkedIn-trained",
      "Per-channel pricing gets expensive at scale",
    ],
    accent: "from-sky-500 to-blue-500",
    ctaLabel: "See LinkedGrow vs Buffer",
    ctaHref: "/compare/buffer-alternative",
  },
  {
    rank: 4,
    name: "Supergrow",
    tagline: "Best budget scheduling all-in-one",
    pricing: "Free plan, Starter $19/mo, Pro $39/mo",
    freeTrial: "Free plan with 3 posts/mo",
    bestFor:
      "Solo LinkedIn creators who want bundled AI + scheduling at the lowest sticker price with no API key setup.",
    imageSlug: "supergrow-card",
    imageAlt:
      "Supergrow weekly calendar view alongside the Voice-to-Post microphone feature and Swipe File content inspiration feed",
    overview: [
      "Supergrow's $19/mo Starter is the cheapest paid plan that ships AI content generation alongside scheduling. The Pro plan at $39/mo adds the carousel scheduler, advanced analytics, and team features.",
      "Voice-to-Post is a standout - dictate a half-formed thought and schedule a polished post within a minute. Supergrow also avoids the aggressive automation features that risk LinkedIn account restrictions.",
    ],
    pros: [
      "AI included on the $19/mo Starter (no gating)",
      "Voice-to-Post for capturing scheduling ideas on the go",
      "Conservative on risky automation - protects your account",
    ],
    cons: [
      "Single bundled AI model, no BYOK choice",
      "Carousel scheduling locked behind the $39 Pro plan",
      "Voice training less mature than LinkedGrow's",
    ],
    accent: "from-emerald-500 to-green-600",
    ctaLabel: "See LinkedGrow vs Supergrow",
    ctaHref: "/compare/supergrow-alternative",
  },
  {
    rank: 5,
    name: "AuthoredUp",
    tagline: "Best for in-LinkedIn writers + analytics",
    pricing: "Individual $19.95/mo, Business $14.95/user/mo (3+ seats)",
    freeTrial: "14-day free trial",
    bestFor:
      "Solo writers who draft posts inside LinkedIn and want a lightweight scheduler plus deep per-post analytics.",
    imageSlug: "authoredup-card",
    imageAlt:
      "AuthoredUp Chrome extension formatting toolbar over the native LinkedIn composer with bold, italic, Unicode controls",
    overview: [
      "AuthoredUp lives as a Chrome extension on top of LinkedIn. The scheduler is functional but lightweight compared to dedicated platforms - it queues posts and publishes them from your browser session. Where AuthoredUp wins is the editor (bold, italic, Unicode, line-break controls) and the per-post analytics.",
      "If you write all your posts yourself and just need a way to queue them with formatting intact, AuthoredUp is hard to beat. If you want AI generation, carousel scheduling, or company-page publishing, look elsewhere.",
    ],
    pros: [
      "Best in-LinkedIn formatting tools on the market",
      "Excellent per-post analytics with cohort comparisons",
      "Predictable flat pricing with no AI credit gymnastics",
    ],
    cons: [
      "No AI post generation",
      "Scheduling is lightweight vs dedicated tools",
      "No carousel scheduling or AI image generation",
    ],
    accent: "from-rose-500 to-red-600",
    ctaLabel: "See LinkedGrow vs AuthoredUp",
    ctaHref: "/compare/authoredup-alternative",
  },
  {
    rank: 6,
    name: "Hootsuite",
    tagline: "Best for enterprise teams + approvals",
    pricing: "Professional $99/mo, Team $249/mo, Enterprise custom",
    freeTrial: "30-day free trial",
    bestFor:
      "Marketing departments and agencies managing 5+ team members and 10+ social profiles across multiple networks.",
    imageSlug: "hootsuite-card",
    imageAlt:
      "Hootsuite enterprise dashboard with multi-stream feed, team approval workflow, and social listening panels",
    overview: [
      "Hootsuite is the enterprise-grade option. It ships team workflows, approval chains, role-based permissions, social listening, and unified reporting across every major social network. For a single creator or small team, it is overkill at $99/mo. For an agency or marketing department, the workflow tooling justifies the price.",
      "AI generation is included in most plans but treated as a generic content assist, not a LinkedIn-trained model. The scheduling itself is rock-solid across networks.",
    ],
    pros: [
      "Enterprise-grade workflows, approvals, and permissions",
      "Wide platform coverage and team scaling",
      "Social listening and unified reporting built in",
    ],
    cons: [
      "Expensive for solo creators or small teams",
      "LinkedIn-specific features are basic",
      "AI generation is generic, not LinkedIn-trained",
    ],
    accent: "from-amber-500 to-yellow-600",
    ctaLabel: "See LinkedGrow vs Hootsuite",
    ctaHref: "/compare/hootsuite-alternative",
  },
  {
    rank: 7,
    name: "Later",
    tagline: "Best visual content calendar",
    pricing: "Starter $25/mo, Growth $45/mo, Advanced $80/mo",
    freeTrial: "14-day free trial",
    bestFor:
      "Visual creators who think in grid layouts and want the same Instagram-style preview workflow on LinkedIn.",
    imageSlug: "later-card",
    imageAlt:
      "Later visual content calendar grid with thumbnail-based weekly scheduling and platform indicator badges",
    overview: [
      "Later originated as the Instagram visual planner and added LinkedIn (plus TikTok, Pinterest, X, YouTube) over the past few years. The standout is the visual content calendar - you see scheduled posts as image thumbnails arranged in a grid, which makes it easy to plan a cohesive content week.",
      "If LinkedIn is your primary channel and you do not need the Instagram-grid heritage, Later is a costly choice vs LinkedIn-first tools. If you cross-post visually across networks, the unified preview is genuinely useful.",
    ],
    pros: [
      "Best visual calendar UI on the market",
      "Multi-platform with strong Instagram + LinkedIn parity",
      "Hashtag suggestions and bio-link tools",
    ],
    cons: [
      "Pricing starts higher than LinkedIn-first tools at $25/mo",
      "LinkedIn-specific features (hooks, algorithm signals) are thin",
      "AI assist is generic across platforms",
    ],
    accent: "from-pink-500 to-rose-500",
    ctaLabel: "Compare LinkedIn schedulers",
    ctaHref: "/compare",
  },
  {
    rank: 8,
    name: "Sprout Social",
    tagline: "Best for large social media teams",
    pricing: "Standard $249/seat/mo, Professional $399/seat/mo",
    freeTrial: "30-day free trial",
    bestFor:
      "Large marketing departments and agencies that need unified scheduling, social listening, CRM integration, and team workflows across every major network.",
    imageSlug: "sprout-social-card",
    imageAlt:
      "Sprout Social enterprise dashboard with Smart Inbox, publishing calendar, and team member workspace assignments",
    overview: [
      "Sprout Social is the premium end of the enterprise scheduling market. It ships unified scheduling, a Smart Inbox for cross-network engagement, social listening, CRM-style audience profiles, and unified analytics. The per-seat pricing reflects the depth.",
      "For a solo creator or small team, this is wildly overkill. For an enterprise that needs LinkedIn alongside Twitter, Facebook, Instagram, TikTok, and YouTube with team workflows, Sprout's depth is unmatched.",
    ],
    pros: [
      "Most comprehensive enterprise feature set in this comparison",
      "Smart Inbox unifies social mentions across networks",
      "Strong reporting, CRM, and listening integrations",
    ],
    cons: [
      "Per-seat pricing starts at $249/mo - prohibitive for solo or small teams",
      "LinkedIn-specific tooling is thin relative to the price",
      "Steep learning curve",
    ],
    accent: "from-green-600 to-emerald-700",
    ctaLabel: "Compare LinkedIn schedulers",
    ctaHref: "/compare",
  },
];

type GlanceRow = {
  rank: number;
  tool: string;
  bestFor: string;
  pricing: string;
  freeTrial: string;
  companyPages: boolean;
  aiBuiltIn: boolean;
  highlight?: boolean;
};

const glanceTools: GlanceRow[] = [
  { rank: 1, tool: "LinkedGrow", bestFor: "AI scheduling with BYOK", pricing: "$13/mo (+$2-4 AI)", freeTrial: "7-day Pro", companyPages: true, aiBuiltIn: true, highlight: true },
  { rank: 2, tool: "Taplio", bestFor: "Scheduling + outreach", pricing: "$39-$149/mo", freeTrial: "7-day", companyPages: true, aiBuiltIn: true },
  { rank: 3, tool: "Buffer", bestFor: "Multi-platform scheduling", pricing: "Free, $20/mo", freeTrial: "Free plan", companyPages: true, aiBuiltIn: true },
  { rank: 4, tool: "Supergrow", bestFor: "Budget all-in-one", pricing: "$19-$39/mo", freeTrial: "Free plan", companyPages: true, aiBuiltIn: true },
  { rank: 5, tool: "AuthoredUp", bestFor: "In-LinkedIn writers", pricing: "$19.95/mo", freeTrial: "14-day", companyPages: false, aiBuiltIn: false },
  { rank: 6, tool: "Hootsuite", bestFor: "Enterprise teams", pricing: "$99-$249/mo", freeTrial: "30-day", companyPages: true, aiBuiltIn: true },
  { rank: 7, tool: "Later", bestFor: "Visual content calendar", pricing: "$25-$80/mo", freeTrial: "14-day", companyPages: true, aiBuiltIn: true },
  { rank: 8, tool: "Sprout Social", bestFor: "Large social teams", pricing: "$249+/seat/mo", freeTrial: "30-day", companyPages: true, aiBuiltIn: true },
];

const criteria = [
  {
    icon: Zap,
    title: "Auto-publish vs reminder-based",
    description:
      "Auto-publishing fires the post at the scheduled time without any action from you. Reminder-based scheduling pings you to publish manually - useful for Instagram's Stories quirks, mostly unnecessary for LinkedIn.",
  },
  {
    icon: Sparkles,
    title: "AI post generation built in",
    description:
      "Tools that pair scheduling with AI generation save the copy-paste tax. The best schedulers let you draft, edit, and queue from the same editor without leaving the page.",
  },
  {
    icon: Building2,
    title: "Company page support",
    description:
      "Not every scheduler can publish to LinkedIn company pages you manage. If you run a company page or post for clients, verify this before subscribing.",
  },
  {
    icon: CircleDollarSign,
    title: "Pricing model",
    description:
      "Flat per-account pricing scales linearly. Per-channel (Buffer) or per-seat (Hootsuite, Sprout) pricing scales fast for teams. BYOK pricing (LinkedGrow) strips AI markup so total cost stays low.",
  },
  {
    icon: Calendar,
    title: "Calendar UI quality",
    description:
      "Drag-and-drop rescheduling, color-coded status, and a quick week/month toggle are table stakes. Visual thumbnail calendars (Later) help cross-network creators plan cohesive content.",
  },
];

export function PostSchedulerContent({
  faqs,
}: {
  faqs: Array<{ question: string; answer: string }>;
}) {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <AnimatedBackground />
      <Header />

      {/* ===== HERO ===== */}
      <section className="relative pt-32 pb-12 sm:pt-40 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1.5 text-xs font-semibold text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-300">
              <Award className="w-3.5 h-3.5" />
              Independent ranking · Updated June 2026
            </span>
          </div>
          <h1 className="text-center text-4xl sm:text-5xl md:text-6xl font-black font-display tracking-tight text-slate-900 dark:text-white">
            8 Best LinkedIn Schedulers in 2026:{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-blue-600">
              Ranked by Use Case
            </span>
          </h1>
          <p className="mt-6 text-center text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
            We tested the 8 best LinkedIn schedulers for 2026 and ranked them by use case, with
            real pricing, pros and cons, and the best scheduler for each type of creator.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
            <span className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              8 tools compared
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              No affiliate links
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              Real pricing breakdowns
            </span>
          </div>

          <div className="relative aspect-video rounded-2xl overflow-hidden mt-12 bg-slate-100 dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
            <Image
              src={`${R2}/best-linkedin-scheduling-tools-2026-cover.avif`}
              alt="Best LinkedIn scheduling tools 2026 - LinkedGrow, Taplio, Buffer, Supergrow, AuthoredUp, Hootsuite, Later, Sprout Social"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 896px"
            />
          </div>
        </div>
      </section>

      {/* ===== AT A GLANCE COMPARISON ===== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-slate-900 dark:text-white">
              The 8 best LinkedIn schedulers{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-blue-600">
                at a glance
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              The fast version. Full reviews below.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">#</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tool</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Best for</th>
                    <th className="p-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pricing</th>
                    <th className="p-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Free trial</th>
                    <th className="p-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Company pages</th>
                    <th className="p-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">AI built in</th>
                  </tr>
                </thead>
                <tbody>
                  {glanceTools.map((row, i, arr) => (
                    <tr
                      key={row.tool}
                      className={`${i < arr.length - 1 ? "border-b border-slate-100 dark:border-slate-800/60" : ""} ${row.highlight ? "bg-cyan-50/60 dark:bg-cyan-900/10" : ""}`}
                    >
                      <td className="p-4 font-semibold text-slate-500 dark:text-slate-400">{row.rank}</td>
                      <td className="p-4">
                        <div className={`font-bold ${row.highlight ? "text-cyan-600 dark:text-cyan-400" : "text-slate-900 dark:text-white"}`}>
                          {row.tool}
                          {row.highlight && (
                            <span className="ml-2 inline-block px-1.5 py-0.5 rounded-full bg-linear-to-r from-cyan-500 to-blue-600 text-white text-[9px] font-bold">#1</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-300">{row.bestFor}</td>
                      <td className={`p-4 text-center font-semibold ${row.highlight ? "text-cyan-600 dark:text-cyan-400" : "text-slate-900 dark:text-white"}`}>{row.pricing}</td>
                      <td className="p-4 text-center text-slate-700 dark:text-slate-300">{row.freeTrial}</td>
                      <td className="p-4 text-center">
                        {row.companyPages ? <Check className="w-5 h-5 text-emerald-500 inline-block" /> : <X className="w-5 h-5 text-slate-300 dark:text-slate-600 inline-block" />}
                      </td>
                      <td className="p-4 text-center">
                        {row.aiBuiltIn ? <Check className="w-5 h-5 text-emerald-500 inline-block" /> : <X className="w-5 h-5 text-slate-300 dark:text-slate-600 inline-block" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
              {glanceTools.map((row) => (
                <div
                  key={row.tool}
                  className={`p-4 ${row.highlight ? "bg-cyan-50/60 dark:bg-cyan-900/10" : ""}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className={`font-bold ${row.highlight ? "text-cyan-600 dark:text-cyan-400" : "text-slate-900 dark:text-white"}`}>
                        #{row.rank} {row.tool}
                      </div>
                      {row.highlight && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-linear-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-semibold">
                          #1 RANKED
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{row.pricing}</div>
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300 mb-2">{row.bestFor}</div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <span>Trial: {row.freeTrial}</span>
                    <span className="inline-flex items-center gap-1">
                      Pages: {row.companyPages ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      AI: {row.aiBuiltIn ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Total monthly cost matters more than sticker price. LinkedGrow Starter at $13/mo plus $2-4 in AI
            fees beats $52-$249 bundled tools on capability per dollar.
          </p>
        </div>
      </section>

      {/* ===== HOW WE EVALUATED ===== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-slate-900 dark:text-white">
              What makes a great LinkedIn scheduling tool?
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Five criteria that decide whether the subscription pays for itself.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {criteria.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== THE 8 RANKED TOOLS ===== */}
      <section className="py-16 sm:py-20 bg-white dark:bg-slate-900/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-slate-900 dark:text-white">
              The 8 best LinkedIn scheduling tools in 2026
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Ranked from best overall to most specialized.
            </p>
          </div>

          <div className="space-y-20">
            {tools.map((tool) => (
              <article
                key={tool.name}
                id={tool.name.toLowerCase().replace(/\s+/g, "-")}
                className="scroll-mt-24"
              >
                <div className="flex flex-wrap items-baseline gap-3 mb-3">
                  <span
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br ${tool.accent} text-white font-black text-lg shrink-0`}
                  >
                    {tool.rank}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white">
                    {tool.name}
                  </h3>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{tool.tagline}</span>
                </div>

                <div className="relative aspect-video rounded-2xl overflow-hidden my-6 bg-slate-100 dark:bg-slate-800">
                  <Image
                    src={`${R2}/${tool.imageSlug}.avif`}
                    alt={tool.imageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-3 mb-6 text-sm">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <div className="font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">
                      Best for
                    </div>
                    <div className="text-slate-900 dark:text-white">{tool.bestFor}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <div className="font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">
                      Pricing
                    </div>
                    <div className="text-slate-900 dark:text-white">{tool.pricing}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <div className="font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">
                      Free trial
                    </div>
                    <div className="text-slate-900 dark:text-white">{tool.freeTrial}</div>
                  </div>
                </div>

                <div className="space-y-4 text-[1.0625rem] text-slate-700 dark:text-slate-300 leading-relaxed">
                  {tool.overview.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                    <div className="font-bold text-emerald-700 dark:text-emerald-300 text-sm uppercase tracking-wide mb-3">
                      Pros
                    </div>
                    <ul className="space-y-2">
                      {tool.pros.map((p, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-[15px] text-slate-700 dark:text-slate-300"
                        >
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-5 dark:border-rose-900/50 dark:bg-rose-950/20">
                    <div className="font-bold text-rose-700 dark:text-rose-300 text-sm uppercase tracking-wide mb-3">
                      Cons
                    </div>
                    <ul className="space-y-2">
                      {tool.cons.map((c, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-[15px] text-slate-700 dark:text-slate-300"
                        >
                          <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    href={tool.ctaHref}
                    className={`inline-flex items-center gap-2 rounded-xl bg-linear-to-r ${tool.accent} px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 hover:opacity-95 transition`}
                  >
                    {tool.ctaLabel}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW TO CHOOSE ===== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-slate-900 dark:text-white">
              How to choose the right LinkedIn scheduling tool
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Match the tool to your real workflow. Four personas, four honest picks.
            </p>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                For solo creators posting 2 to 5 times a week
              </h3>
              <p className="text-[1.0625rem] text-slate-700 dark:text-slate-300 leading-relaxed">
                Pick <Link href="/" className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">LinkedGrow</Link>.
                You get AI generation + scheduling in one dashboard for $13/mo (Starter) plus $2-4/mo in BYOK AI fees.
                The 10-post Starter cap covers most solo cadences; upgrade to Pro at $27/mo for unlimited if you batch-schedule a month ahead.
                Runner-up: Supergrow at $19/mo if you prefer bundled AI with no API key setup.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                For agencies and ghostwriters managing multiple LinkedIn accounts
              </h3>
              <p className="text-[1.0625rem] text-slate-700 dark:text-slate-300 leading-relaxed">
                Pick LinkedGrow Business at $55/mo - it ships team workflows, per-client content calendars, BYOK per client
                (so AI costs stay on the client side), and a public API. Hootsuite Team at $249/mo is the alternative if you also
                manage non-LinkedIn channels for the same clients. Sprout Social only makes sense at 5+ seats with cross-network listening needs.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                For teams and B2B companies posting from a company page
              </h3>
              <p className="text-[1.0625rem] text-slate-700 dark:text-slate-300 leading-relaxed">
                Pick LinkedGrow Business at $55/mo if LinkedIn is your primary B2B channel - you get unlimited company-page scheduling,
                team collaboration with role-based access, and AI generation tuned to your brand voice via voice training. Hootsuite Professional
                at $99/mo if your team manages 5+ social profiles across networks. Buffer Team at $40/mo if you cross-post heavily and just need clean scheduling.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                For multi-platform creators where LinkedIn is one of many
              </h3>
              <p className="text-[1.0625rem] text-slate-700 dark:text-slate-300 leading-relaxed">
                Pick Buffer if your stack is LinkedIn + X + Instagram + TikTok and you want one composer. Later is the pick if you think
                visually and want a thumbnail-grid calendar. Just know you trade LinkedIn-specific depth (hooks, voice, algorithm signals) for multi-platform convenience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-16 sm:py-20 bg-white dark:bg-slate-900/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-slate-900 dark:text-white">
              LinkedIn scheduling tools FAQ
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              The most common questions before picking a scheduler.
            </p>
          </div>
          <FAQAccordion faqs={faqs} />
        </div>
      </section>

      <LandingRelatedContent
        headline="Related Resources"
        links={[
          { title: "Best LinkedIn AI Tools 2026", href: "/blog/best-linkedin-ai-tools-2026" },
          { title: "Best LinkedIn Post Generators 2026", href: "/best-ai-linkedin-post-generator" },
          { title: "LinkedIn Content Calendar Guide", href: "/blog/linkedin-content-calendar-guide" },
          { title: "Compare LinkedIn Tools", href: "/compare" },
          { title: "Best Time to Post on LinkedIn", href: "/free-tools/linkedin-best-time-to-post" },
        ]}
      />

      <LandingCTA
        badge="Try the #1 ranked LinkedIn scheduler"
        headline={{
          line1: "Start free with the best",
          gradient: "LinkedIn scheduling tool in 2026",
        }}
        description="AI generation + auto-publishing + visual calendar in one dashboard. Total cost stays at $15 to $30/mo all-in. Join 179+ founders."
        primaryCta={{ text: "Start free 7-day Pro trial", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={[
          "No credit card required",
          "Unlimited generations on Pro+",
          "Auto-publish to profiles and pages",
          "Cancel anytime",
        ]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
