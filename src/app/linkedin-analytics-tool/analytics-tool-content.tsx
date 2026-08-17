"use client";

import Image from "next/image";
import Link from "next/link";
import { V3_ROOT } from "@/components/v3/root";
import {
  CARVE_BASE, EB_DOT_LT, EB_LT, HERO_FIELD, HERO_ORB_A, HERO_ORB_B, HERO_RINGS, VPROP,
} from "@/components/v3/kit";
import { LandingFAQ } from "@/components/landing/landing-faq";
import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";
import { LandingCTA } from "@/components/landing/landing-cta";
import { LandingRelatedContent } from "@/components/landing/landing-related-content";
import { MarketingExitIntentPopup } from "@/components/marketing/exit-intent-popup";
import {
  Award,
  Check,
  X,
  ArrowRight,
  BarChart3,
  TrendingUp,
  Users,
  CircleDollarSign,
  FileBarChart,
} from "lucide-react";

const R2_TOOLS =
  "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/blog/best-ai-linkedin-post-generator";
const R2_PAGE =
  "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/blog/linkedin-analytics-tool";

type ToolReview = {
  rank: number;
  name: string;
  tagline: string;
  pricing: string;
  freeTrial: string;
  bestFor: string;
  imageSrc: string;
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
    tagline: "Best for AI content + analytics with BYOK",
    pricing: "$99/mo Pro, $179/mo Business",
    freeTrial: "7-day Pro trial",
    bestFor:
      "Creators and founders who want AI post generation, scheduling, and analytics in one dashboard in one price.",
    imageSrc: `${R2_TOOLS}/linkedgrow-card.avif`,
    imageAlt:
      "LinkedGrow analytics dashboard showing post performance metrics, engagement rate trends, and content calendar",
    overview: [
      "LinkedGrow is the only LinkedIn analytics tool that pairs post-level performance tracking with AI content generation across 26+ models via BYOK. You write or generate a post, publish it, and track impressions, engagement rate, likes, comments, and shares from the same dashboard. Total monthly cost stays at $15 to $30 all-in.",
      "The analytics dashboard shows per-post metrics alongside trend lines so you can spot which content formats, topics, and posting times perform best. Pro and Business plans add advanced analytics with engagement breakdowns by format, best time analysis, and exportable reports.",
      "Where LinkedGrow stands out for analytics is the closed feedback loop: you see which posts performed well, then use that data to generate better content with AI. The voice training feature learns from your top-performing posts, so the AI improves as your analytics data grows.",
    ],
    pros: [
      "AI content generation + analytics + scheduling in one dashboard",
      "BYOK across 26+ models keeps total cost at $15 to $30/mo all-in",
      "Closed feedback loop: analytics data improves AI-generated content",
      "Per-post and trend-level metrics with format breakdowns",
      "Export to CSV and PDF on Business plan",
    ],
    cons: [
      "Advanced analytics require Pro plan ($99/mo yearly)",
      "No competitive benchmarking against other LinkedIn accounts",
      "Smaller user base than legacy tools like Hootsuite or Buffer",
    ],
    accent: "from-cyan-500 to-blue-600",
    ctaLabel: "Start free 7-day Pro trial",
    ctaHref: "/sign-up",
  },
  {
    rank: 2,
    name: "AuthoredUp",
    tagline: "Best for per-post analytics and hook tracking",
    pricing: "Individual $19.95/mo, Business $14.95/user/mo (3+ seats)",
    freeTrial: "14-day free trial",
    bestFor:
      "Solo writers who draft posts inside LinkedIn and want the deepest per-post analytics available, including hook performance and format effectiveness.",
    imageSrc: `${R2_TOOLS}/authoredup-card.avif`,
    imageAlt:
      "AuthoredUp analytics showing per-post engagement breakdown with hook performance scoring and content format analysis",
    overview: [
      "AuthoredUp is a Chrome extension that lives on top of LinkedIn, and its analytics are the best per-post metrics on the market. Every post you publish gets a detailed breakdown: impressions over time, engagement by type, hook click-through (how many people expanded the \"see more\"), and cohort comparisons against your previous posts.",
      "The hook performance tracking is unique. AuthoredUp measures how effective your opening lines are at getting people to expand the full post, so you can A/B test different hook styles with real data instead of guesswork. Format-level analytics show whether your carousels, text posts, or image posts perform best over rolling periods.",
    ],
    pros: [
      "Deepest per-post analytics on the market",
      "Hook performance tracking shows which opening lines drive the most expansion clicks",
      "Cohort comparisons let you benchmark each post against your own history",
      "Format-level analytics reveal your best-performing content types",
    ],
    cons: [
      "Chrome extension only, no standalone web dashboard",
      "No AI post generation or scheduling",
      "No team analytics or multi-account support on Individual plan",
    ],
    accent: "from-rose-500 to-red-600",
    ctaLabel: "See LinkedGrow vs AuthoredUp",
    ctaHref: "/compare/authoredup-alternative",
  },
  {
    rank: 3,
    name: "Taplio",
    tagline: "Best for growth analytics + lead tracking",
    pricing: "Starter $39, Standard $52, Pro $149/mo (yearly)",
    freeTrial: "7-day free trial, card required",
    bestFor:
      "Salespeople and growth marketers who want LinkedIn analytics alongside a viral content library and lead database.",
    imageSrc: `${R2_TOOLS}/taplio-card.avif`,
    imageAlt:
      "Taplio analytics dashboard with follower growth chart, impression metrics, and engagement rate timeline",
    overview: [
      "Taplio pairs analytics with the largest viral LinkedIn posts library on the market plus outreach automation. The analytics dashboard tracks follower growth, impressions, engagement rate, and profile views over custom time windows. You can drill into each metric and compare performance across periods.",
      "The $52 Standard plan adds AI generation, and Pro at $149/mo adds the 3M+ lead database. Analytics are available on all plans, but the depth increases on higher tiers. If your primary goal is analytics plus outreach (not content generation), Taplio bundles both well - at a premium price.",
    ],
    pros: [
      "Follower growth tracking with custom date ranges",
      "Viral posts library helps reverse-engineer what works in your niche",
      "Outreach automation (DMs, connection requests) on higher plans",
    ],
    cons: [
      "Starter at $39/mo includes zero AI credits",
      "Single bundled AI model, no BYOK choice",
      "Analytics depth is basic on the $39 Starter plan",
    ],
    accent: "from-violet-500 to-purple-600",
    ctaLabel: "See LinkedGrow vs Taplio",
    ctaHref: "/compare/taplio-alternative",
  },
  {
    rank: 4,
    name: "Shield",
    tagline: "Shut down in May 2026",
    pricing: "Discontinued",
    freeTrial: "No longer available",
    bestFor:
      "Nobody anymore: Shield announced its shutdown and closed in May 2026. It stays on this list so you know not to look for it, and because its former users need a replacement.",
    imageSrc: `${R2_PAGE}/shield-analytics-dashboard.avif`,
    imageAlt:
      "Shield analytics dashboard with LinkedIn post metrics, audience demographics, and period comparison charts",
    overview: [
      "Shield was a LinkedIn-only analytics tool built for creators who took their data seriously: post-level and profile-level metrics, audience demographics, and period comparisons. It shut down in May 2026, and its former users are the reason analytics-focused alternatives get so many searches today.",
      "If you relied on Shield, the practical question is where to move: LinkedGrow reads your real post and profile numbers alongside content and agents, and AuthoredUp covers formatting-plus-analytics. Export nothing from Shield now, the service is gone; start from your LinkedIn data on whichever tool you pick.",
    ],
    pros: [
      "Deepest LinkedIn-specific analytics with period comparisons and audience demographics",
      "AI co-pilot generates reports and answers data questions in natural language",
      "Team dashboards with role management and volume discounts",
    ],
    cons: [
      "No content creation, scheduling, or AI post generation",
      "LinkedIn only, no cross-platform analytics",
      "$25/mo for analytics alone is expensive next to all-in-one tools",
    ],
    accent: "from-orange-500 to-amber-600",
    ctaLabel: "Compare LinkedIn analytics tools",
    ctaHref: "/compare",
  },
  {
    rank: 5,
    name: "Supergrow",
    tagline: "Best budget all-in-one with analytics",
    pricing: "Free plan, Starter $19/mo, Pro $39/mo",
    freeTrial: "Free plan with 3 posts/mo",
    bestFor:
      "Solo LinkedIn creators who want bundled AI generation plus basic analytics at the lowest sticker price with no API key setup.",
    imageSrc: `${R2_TOOLS}/supergrow-card.avif`,
    imageAlt:
      "Supergrow analytics showing post performance metrics alongside the AI post composer and content calendar",
    overview: [
      "Supergrow bundles AI content generation with basic analytics on every plan, including the free tier. The analytics dashboard shows impressions, engagement rate, and top-performing posts. The Pro plan at $39/mo adds carousel analytics and format-level breakdowns.",
      "Analytics depth is a notch below AuthoredUp and LinkedGrow. You get the essentials (per-post metrics, trend charts) but not hook performance, cohort comparisons, or custom export. For a creator who wants analytics alongside content creation at a budget price, Supergrow covers the basics.",
    ],
    pros: [
      "AI generation included on the $19/mo Starter with no API key",
      "Basic analytics available on every plan including free",
      "Voice-to-Post for quick content creation",
    ],
    cons: [
      "Analytics depth is shallow compared to AuthoredUp or LinkedGrow Pro",
      "Single bundled AI model, no BYOK",
      "Carousel analytics locked behind the $99 Pro plan",
    ],
    accent: "from-emerald-500 to-green-600",
    ctaLabel: "See LinkedGrow vs Supergrow",
    ctaHref: "/compare/supergrow-alternative",
  },
  {
    rank: 6,
    name: "Hootsuite",
    tagline: "Best for enterprise cross-network analytics",
    pricing: "Professional $99/mo, Team $249/mo, Enterprise custom",
    freeTrial: "30-day free trial",
    bestFor:
      "Marketing departments managing 5+ team members and 10+ social profiles who need unified analytics reporting across LinkedIn, X, Instagram, Facebook, and more.",
    imageSrc: `${R2_TOOLS}/hootsuite-card.avif`,
    imageAlt:
      "Hootsuite enterprise analytics dashboard with cross-network performance charts, team reporting, and social listening panels",
    overview: [
      "Hootsuite is the enterprise option. Its analytics cover every major social network from a single reporting interface - LinkedIn performance sits alongside X, Instagram, Facebook, and TikTok metrics. Custom reports, team-level dashboards, and scheduled report delivery make it the right fit for large marketing operations.",
      "For LinkedIn-specific insights, Hootsuite is solid but generic. You get impressions, engagement, follower growth, and audience demographics, but nothing LinkedIn-specific like hook performance or carousel analytics. If your team manages multiple networks and needs unified reporting, Hootsuite earns its price. If LinkedIn is your primary channel, a LinkedIn-first tool gives you better signal for less money.",
    ],
    pros: [
      "Unified analytics across every major social network",
      "Custom report builder with scheduled delivery",
      "Team dashboards with role-based access",
    ],
    cons: [
      "$99/mo minimum is expensive for solo creators",
      "LinkedIn-specific analytics depth is basic",
      "AI generation is generic, not LinkedIn-trained",
    ],
    accent: "from-amber-500 to-yellow-600",
    ctaLabel: "See LinkedGrow vs Hootsuite",
    ctaHref: "/compare/hootsuite-alternative",
  },
  {
    rank: 7,
    name: "Buffer",
    tagline: "Best for simple multi-platform analytics",
    pricing: "Free, Essentials $20/mo, Team $40/mo",
    freeTrial: "Free plan available",
    bestFor:
      "Creators and small teams who post to LinkedIn alongside X, Instagram, and TikTok and want clean, simple post-level analytics.",
    imageSrc: `${R2_TOOLS}/buffer-card.avif`,
    imageAlt:
      "Buffer analytics showing post performance across LinkedIn, X, and Instagram with engagement trends",
    overview: [
      "Buffer provides straightforward post-level analytics across multiple social networks. The free plan includes basic metrics for up to 3 channels, which is enough for a solo creator tracking LinkedIn alongside one or two other networks. Paid plans add the AI Assistant and more detailed engagement breakdowns.",
      "Analytics are clean but not deep. You see impressions, likes, comments, shares, and engagement rate per post, plus simple trend charts over time. There is no hook performance, format-level analysis, or competitive benchmarking. If you want simple analytics alongside reliable multi-platform scheduling, Buffer does the job without the complexity or price tag of Hootsuite.",
    ],
    pros: [
      "Free plan with basic analytics for 3 channels",
      "Clean, intuitive interface with a long track record",
      "Multi-platform: LinkedIn, X, Instagram, TikTok, Facebook, Pinterest",
    ],
    cons: [
      "LinkedIn-specific analytics depth is minimal",
      "No hook tracking, carousel analytics, or format breakdowns",
      "AI assist is generic across platforms",
    ],
    accent: "from-sky-500 to-blue-500",
    ctaLabel: "See LinkedGrow vs Buffer",
    ctaHref: "/compare/buffer-alternative",
  },
  {
    rank: 8,
    name: "Sprout Social",
    tagline: "Best for premium team analytics and listening",
    pricing: "Standard $249/seat/mo, Professional $399/seat/mo",
    freeTrial: "30-day free trial",
    bestFor:
      "Large marketing departments and agencies that need unified analytics, social listening, CRM integration, and enterprise-grade reporting across every network.",
    imageSrc: `${R2_TOOLS}/sprout-social-card.avif`,
    imageAlt:
      "Sprout Social enterprise analytics with cross-network performance reports, social listening trends, and team workspace",
    overview: [
      "Sprout Social is the premium end of the social analytics market. It combines post-level and network-level analytics with social listening, CRM-style audience profiles, competitive benchmarking, and enterprise reporting. The per-seat pricing reflects the depth - this is a tool for teams of 5+ managing serious social media operations.",
      "For LinkedIn analytics specifically, Sprout tracks all the standard metrics (impressions, engagement, demographics) alongside advanced features like optimal send time analysis and paid vs organic performance splitting. The social listening module picks up brand mentions across LinkedIn and other networks in real time. For a solo creator, this is wildly overkill. For an enterprise social team, the depth is unmatched.",
    ],
    pros: [
      "Deepest analytics and reporting feature set in this comparison",
      "Social listening catches brand mentions across networks in real time",
      "CRM integration ties social engagement to sales pipeline",
    ],
    cons: [
      "$249/seat/mo minimum is prohibitive for solo creators and small teams",
      "Steep learning curve before the analytics become actionable",
      "LinkedIn-specific depth is the same as its other network coverage",
    ],
    accent: "from-green-600 to-emerald-700",
    ctaLabel: "Compare LinkedIn analytics tools",
    ctaHref: "/compare",
  },
];

type GlanceRow = {
  rank: number;
  tool: string;
  bestFor: string;
  pricing: string;
  freeTrial: string;
  postAnalytics: boolean;
  growthTracking: boolean;
  highlight?: boolean;
};

const glanceTools: GlanceRow[] = [
  { rank: 1, tool: "LinkedGrow", bestFor: "AI content + analytics", pricing: "$99/mo (+$2-4 AI)", freeTrial: "7-day Pro", postAnalytics: true, growthTracking: true, highlight: true },
  { rank: 2, tool: "AuthoredUp", bestFor: "Per-post analytics", pricing: "$19.95/mo", freeTrial: "14-day", postAnalytics: true, growthTracking: false },
  { rank: 3, tool: "Taplio", bestFor: "Growth + lead tracking", pricing: "$39-$149/mo", freeTrial: "7-day", postAnalytics: true, growthTracking: true },
  { rank: 4, tool: "Shield", bestFor: "Shut down in May 2026", pricing: "Discontinued", freeTrial: "None", postAnalytics: true, growthTracking: true },
  { rank: 5, tool: "Supergrow", bestFor: "Budget all-in-one", pricing: "$19-$39/mo", freeTrial: "Free plan", postAnalytics: true, growthTracking: true },
  { rank: 6, tool: "Hootsuite", bestFor: "Enterprise multi-network", pricing: "$99-$249/mo", freeTrial: "30-day", postAnalytics: true, growthTracking: true },
  { rank: 7, tool: "Buffer", bestFor: "Simple multi-platform", pricing: "Free, $20/mo", freeTrial: "Free plan", postAnalytics: true, growthTracking: false },
  { rank: 8, tool: "Sprout Social", bestFor: "Premium team analytics", pricing: "$249+/seat/mo", freeTrial: "30-day", postAnalytics: true, growthTracking: true },
];

const criteria = [
  {
    icon: BarChart3,
    title: "Post-level metrics depth",
    description:
      "The baseline is impressions, likes, comments, and shares per post. The best LinkedIn analytics tools go deeper with engagement rate trends, format comparisons, and hook expansion tracking so you know which posts actually performed.",
  },
  {
    icon: TrendingUp,
    title: "Growth and trend tracking",
    description:
      "Follower growth, impression trends, and engagement rate over time tell you whether your content strategy is working at the macro level. The best tools show these as rolling charts with custom date ranges, not just isolated numbers.",
  },
  {
    icon: Users,
    title: "Team and multi-account support",
    description:
      "Agencies and teams need analytics across multiple LinkedIn profiles and company pages from one dashboard. Role-based access, client-level reporting, and shared workspaces separate team tools from solo ones.",
  },
  {
    icon: CircleDollarSign,
    title: "Total cost of ownership",
    description:
      "Sticker price is one number. Total cost includes AI generation, scheduling, and analytics together. BYOK pricing (LinkedGrow) strips AI markup so your total stays at $15 to $30/mo. Bundled tools charge $99 to $249/mo for the same workflow.",
  },
  {
    icon: FileBarChart,
    title: "Reporting and export",
    description:
      "Client reports, stakeholder updates, and personal tracking all require exportable data. CSV and PDF export, scheduled report delivery, and white-label options are the features that turn analytics from a screen into a deliverable.",
  },
];

export function AnalyticsToolContent({
  faqs,
}: {
  faqs: Array<{ question: string; answer: string }>;
}) {
  return (
    <main className={V3_ROOT}>
      <Header />

      {/* ===== HERO ===== */}
      <section className={`${HERO_FIELD} pb-[clamp(150px,17vw,240px)]`}>
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]">
          <span className={HERO_ORB_A}></span>
          <span className={HERO_ORB_B}></span>
          <div className={HERO_RINGS}><i></i><i></i><i></i></div>
        </div>
        <canvas
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
          id="net"
        ></canvas>
        <div className="relative z-[3] max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex justify-center mb-6">
            <span className={EB_LT}>
              <i className={EB_DOT_LT}></i>
              Independent ranking - Updated July 2026
            </span>
          </div>
          <h1 className="m-0 text-center font-v3-display! text-[clamp(43px,6.8vw,88px)] font-semibold! leading-[.98]! tracking-[-.048em]! text-white">
            Best LinkedIn Analytics Tools in 2026:{" "}
            <span className="text-v3-sky">
              Ranked &amp; Compared
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-[62ch] text-center text-[clamp(16.5px,1.35vw,19px)] leading-[1.58]! text-[rgba(255,255,255,.76)]">
            LinkedGrow is an AI-powered LinkedIn analytics tool for creators, agencies, and teams.
            We tested the top 8 LinkedIn analytics tools and ranked them by use case, with real
            pricing, honest pros and cons, and the right pick for each type of user.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
            <span className={VPROP}>
              8 tools compared
            </span>
            <span className={VPROP}>
              No affiliate links
            </span>
            <span className={VPROP}>
              Real pricing breakdowns
            </span>
          </div>
        </div>
        <div className={`${CARVE_BASE} bg-v3-bg dark:bg-v3-bg-d`}></div>
      </section>

      <section className="relative z-[5] pb-16 sm:pb-20">
        <div className="mx-auto -mt-[clamp(70px,9vw,130px)] max-w-4xl px-4 sm:px-6">
          <div className="relative aspect-video overflow-hidden rounded-[22px] border border-v3-line bg-slate-100 shadow-[0_30px_80px_-40px_rgba(6,9,17,.5)] dark:border-v3-line-d dark:bg-slate-800">
            <Image
              src={`${R2_PAGE}/linkedin-analytics-tool.avif`}
              alt="LinkedIn analytics tools 2026 comparison"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 896px"
            />
          </div>
        </div>
      </section>

      {/* ===== QUICK ANSWER ===== */}
      <section className="pb-8 sm:pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-6 sm:p-8 dark:border-cyan-900 dark:bg-cyan-950/30">
            <p className="text-[1.0625rem] text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-900 dark:text-white">The best LinkedIn analytics tool in 2026 is{" "}
              <Link href="/" className="text-cyan-600 dark:text-cyan-400 hover:underline">LinkedGrow</Link></strong>{" "}
              for creators and teams who also generate and schedule content from the same dashboard. It tracks impressions,
              engagement rate, follower growth, and format performance per post while keeping total costs at $15 to $30/mo
              thanks to BYOK pricing. For analytics-only users, AuthoredUp ($19.95/mo) is the strongest
              LinkedIn-specific alternatives.
            </p>
          </div>
        </div>
      </section>

      {/* ===== AT A GLANCE COMPARISON ===== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-grotesk font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
              The 8 best LinkedIn analytics tools{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-blue-600">
                at a glance
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              The fast version. Full reviews with pros and cons below.
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
                    <th className="p-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Post analytics</th>
                    <th className="p-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Growth tracking</th>
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
                        {row.postAnalytics ? <Check className="w-5 h-5 text-emerald-500 inline-block" /> : <X className="w-5 h-5 text-slate-300 dark:text-slate-600 inline-block" />}
                      </td>
                      <td className="p-4 text-center">
                        {row.growthTracking ? <Check className="w-5 h-5 text-emerald-500 inline-block" /> : <X className="w-5 h-5 text-slate-300 dark:text-slate-600 inline-block" />}
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
                      Post analytics: {row.postAnalytics ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      Growth: {row.growthTracking ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Total monthly cost matters more than sticker price. LinkedGrow at $99/mo plus $2-4 in AI
            fees gives you analytics, content generation, and scheduling together for less than most
            analytics-only subscriptions.
          </p>
        </div>
      </section>

      {/* ===== WHAT TO LOOK FOR ===== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-grotesk font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
              What makes a great LinkedIn analytics tool?
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Five criteria that separate the tools worth paying for from the ones you will cancel in a month.
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

      {/* ===== WHEN LINKEDIN NATIVE ANALYTICS ARE ENOUGH ===== */}
      <section className="py-16 sm:py-20 bg-white dark:bg-slate-900/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-grotesk font-semibold tracking-[-0.04em] text-slate-900 dark:text-white text-center mb-6">
            When are LinkedIn native analytics enough?
          </h2>
          <div className="space-y-4 text-[1.0625rem] text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
              LinkedIn ships free analytics for every account. On a personal profile, you can see impressions,
              engagement, and demographics for each post. On a company page, you get follower analytics,
              visitor demographics, and content performance breakdowns. For a creator posting once or twice a
              week who just wants to check which post did better, native analytics are genuinely enough.
            </p>
            <p>
              The pain points show up when you want to compare performance over time, track format-level
              trends (do your carousels beat your text posts over the last 90 days?), export data for a
              client report, or correlate posting time with engagement. LinkedIn native analytics cap
              historical data at 365 days, offer no export on personal profiles, and don't break down
              performance by content type automatically. Those are the gaps where a third-party{" "}
              <Link href="/features/analytics" className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">
                LinkedIn analytics tool like LinkedGrow
              </Link>{" "}
              earns its subscription.
            </p>
            <p>
              If you post 3+ times per week, manage content for clients, or need to prove ROI to a
              stakeholder, a dedicated LinkedIn analytics tool saves hours of manual tracking and gives you
              insights that native analytics simply cannot surface. Pairing analytics with a solid{" "}
              <Link href="/blog/linkedin-content-strategy-guide" className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">
                LinkedIn content strategy
              </Link>{" "}
              is how you turn data into growth.
            </p>
          </div>
        </div>
      </section>

      {/* ===== THE 8 RANKED TOOLS ===== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-grotesk font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
              The 8 best LinkedIn analytics tools in 2026
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
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br ${tool.accent} text-white font-grotesk font-semibold tracking-[-0.038em] text-lg shrink-0`}
                  >
                    {tool.rank}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-grotesk font-semibold tracking-[-0.038em] font-display text-slate-900 dark:text-white">
                    {tool.name}
                  </h3>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{tool.tagline}</span>
                </div>

                <div className="relative aspect-video rounded-2xl overflow-hidden my-6 bg-slate-100 dark:bg-slate-800">
                  <Image
                    src={tool.imageSrc}
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

      {/* ===== WHICH METRICS ACTUALLY MATTER ===== */}
      <section className="py-16 sm:py-20 bg-white dark:bg-slate-900/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-grotesk font-semibold tracking-[-0.04em] text-slate-900 dark:text-white text-center mb-6">
            Which LinkedIn metrics actually matter?
          </h2>
          <p className="text-center text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
            Most LinkedIn analytics tools throw 20 metrics at you. Here are the 5 that move the needle
            for each goal.
          </p>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Growing your audience
              </h3>
              <p className="text-[1.0625rem] text-slate-700 dark:text-slate-300 leading-relaxed">
                Track <strong>impressions</strong> (how many people see your posts), <strong>follower growth rate</strong> (net
                new followers per week), and <strong>profile views</strong> (signals that your content makes people curious
                about you). Ignore total followers as a vanity metric - the growth rate tells you whether your
                content strategy is working or stalling. LinkedGrow surfaces all three on the{" "}
                <Link href="/features/analytics" className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">
                  analytics dashboard
                </Link>{" "}
                so you can spot trends without building spreadsheets.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Maximizing engagement
              </h3>
              <p className="text-[1.0625rem] text-slate-700 dark:text-slate-300 leading-relaxed">
                Track <strong>engagement rate</strong> (interactions divided by impressions) as your primary signal. Break it
                down by content format (carousel vs text vs image) and by posting time to find your personal sweet
                spots. A post with 500 impressions and 5% engagement is more valuable than one with 5,000
                impressions and 0.3% engagement, because the first is converting attention into interaction. Our{" "}
                <Link href="/free-tools/linkedin-engagement-rate-calculator" className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">
                  free engagement rate calculator
                </Link>{" "}
                gives you this number instantly.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Generating leads and sales
              </h3>
              <p className="text-[1.0625rem] text-slate-700 dark:text-slate-300 leading-relaxed">
                Track <strong>click-through rate</strong> (clicks on your links divided by impressions), <strong>profile
                views from posts</strong>, and <strong>connection requests received after publishing</strong>. These are the
                metrics that tie content to pipeline. Most LinkedIn analytics tools track clicks but not the
                downstream conversion. Pair your{" "}
                <Link href="/use-cases/lead-generation" className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">
                  LinkedIn lead generation strategy
                </Link>{" "}
                with a CRM or UTM tracking to close the loop.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW TO CHOOSE ===== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-grotesk font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
              How to choose the right LinkedIn analytics tool
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Match the tool to your real workflow. Four personas, four honest picks.
            </p>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Solo creators posting 2 to 5 times a week
              </h3>
              <p className="text-[1.0625rem] text-slate-700 dark:text-slate-300 leading-relaxed">
                Pick <Link href="/" className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">LinkedGrow</Link>.
                You get analytics, AI content generation, and{" "}
                <Link href="/features/post-scheduling" className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">
                  post scheduling
                </Link>{" "}
                in one dashboard for $99/mo (Starter) plus $2-4/mo in BYOK AI fees.
                The closed loop between analytics and AI generation means your content improves as your data
                grows. Runner-up: AuthoredUp at $19.95/mo if you only need analytics with no AI generation.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Agencies and ghostwriters managing multiple accounts
              </h3>
              <p className="text-[1.0625rem] text-slate-700 dark:text-slate-300 leading-relaxed">
                Pick{" "}
                <Link href="/for/agencies" className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">
                  LinkedGrow Business at $179/mo
                </Link>
                . It ships{" "}
                <Link href="/features/team-collaboration" className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">
                  team collaboration
                </Link>
                , per-client content calendars, exportable analytics, and BYOK so AI costs stay on the client
                side. Hootsuite Team at $249/mo is the alternative if you also manage non-LinkedIn channels.
                Shield used to be the mid-tier pick for analytics-only agency teams, until it shut down in May 2026; AuthoredUp is the closest remaining option.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                B2B teams posting from a company page
              </h3>
              <p className="text-[1.0625rem] text-slate-700 dark:text-slate-300 leading-relaxed">
                Pick LinkedGrow Business for LinkedIn-first company page analytics with{" "}
                <Link href="/features/ab-testing" className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">
                  A/B testing
                </Link>{" "}
                and team workflows at $179/mo. Hootsuite Professional at $99/mo if the team also manages 5+ social
                profiles across networks. Sprout Social if you need social listening and CRM integration and have
                the $249+/seat/mo budget.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Data-driven writers who want analytics only
              </h3>
              <p className="text-[1.0625rem] text-slate-700 dark:text-slate-300 leading-relaxed">
                Pick AuthoredUp at $19.95/mo. Its per-post analytics are the deepest on the market - hook
                expansion tracking, format-level breakdowns, and cohort comparisons against your own history. No
                AI generation or scheduling, just pure analytics layered on top of your LinkedIn experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== DISCONTINUED TOOLS ===== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-grotesk font-semibold tracking-[-0.04em] text-slate-900 dark:text-white text-center mb-6">
            Which LinkedIn analytics tools have been discontinued?
          </h2>
          <p className="text-center text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-3xl mx-auto">
            Several tools that appeared on older &quot;best LinkedIn analytics&quot; lists no longer operate or have
            pivoted away from LinkedIn analytics. Avoid recommendations that still include these.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Inlytics</h3>
              <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Formerly a popular LinkedIn analytics dashboard for personal profiles. The service shut down and the
                domain is no longer active. Any article still recommending Inlytics is outdated.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Keyhole (pivoted)</h3>
              <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Keyhole was acquired by Muck Rack and pivoted to PR and media intelligence. It no longer operates as a
                standalone LinkedIn analytics tool. Older comparison articles may still list it at $179/mo, but that
                product no longer exists in the same form.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Kleo</h3>
              <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Kleo offered Chrome-based LinkedIn analytics and content formatting. The analytics features have been
                deprioritized and the tool is no longer a reliable choice for analytics-first users. LinkedGrow offers a{" "}
                <Link href="/compare/kleo-alternative" className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">
                  Kleo alternative comparison
                </Link>{" "}
                for users looking to switch.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">UseAware</h3>
              <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Previously offered LinkedIn profile and company page analytics. The service is no longer active.
                Recommendations from 2023 or 2024 that still include UseAware should be disregarded.
              </p>
            </div>
          </div>
        </div>
      </section>

      <LandingFAQ
        headline={{ text: "LinkedIn analytics tools", gradient: "FAQ" }}
        description="The most common questions before picking an analytics tool."
        faqs={faqs}
      />

      <LandingRelatedContent
        headline="Related Resources"
        links={[
          { title: "LinkedIn Analytics & Metrics Explained", href: "/blog/linkedin-analytics-metrics-guide" },
          { title: "Best LinkedIn AI Tools 2026", href: "/blog/best-linkedin-ai-tools-2026" },
          { title: "LinkedIn Impressions Explained", href: "/blog/linkedin-impressions-explained" },
          { title: "Free Engagement Rate Calculator", href: "/free-tools/linkedin-engagement-rate-calculator" },
          { title: "Compare LinkedIn Tools", href: "/compare" },
        ]}
      />

      <LandingCTA
        badge="Try the #1 ranked LinkedIn analytics tool"
        headline={{
          line1: "Track what works, create more of it",
          gradient: "with LinkedGrow analytics",
        }}
        description="AI content generation + post analytics + scheduling in one dashboard. Total cost stays at $15 to $30/mo all-in. Join 179+ founders."
        primaryCta={{ text: "Start free 7-day Pro trial", href: "/sign-up" }}
        trustIndicators={[
          "Everything included",
          "Full analytics on Pro+",
          "43 AI models via BYOK",
          "Your own AI key",
        ]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
