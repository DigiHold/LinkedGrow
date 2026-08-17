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
import { Award, Check, X, ArrowRight, Mic, Brain, CircleDollarSign, Sparkles, BarChart3 } from "lucide-react";

const R2 =
  "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/blog/best-ai-linkedin-post-generator";

type ToolReview = {
  rank: number;
  name: string;
  tagline: string;
  href: string;
  internalHref?: string;
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

type GlanceRow = {
  tool: string;
  bestFor: string;
  pricing: string;
  freeTrial: string;
  modelChoice: string;
  voiceTraining: boolean;
  highlight?: boolean;
};

const tools: ToolReview[] = [
  {
    rank: 1,
    name: "LinkedGrow",
    tagline: "Best overall - authentic voice and the agents included",
    href: "https://linkedgrow.ai",
    internalHref: "/",
    pricing: "$99/mo Pro, $179/mo Business",
    freeTrial: "7-day Pro trial",
    bestFor: "Founders, coaches, and consultants who post 2 to 5 times a week and care about sounding like themselves.",
    imageSlug: "linkedgrow-card",
    imageAlt: "LinkedGrow dashboard with BYOK API key setup and 26 model selector covering GPT, Claude, Gemini, Grok, Perplexity, and Kimi",
    overview: [
      "LinkedGrow is the only LinkedIn post generator built around BYOK (bring your own key) across 43 AI models from OpenAI, Anthropic, Google, xAI, Perplexity, and Kimi. You connect your own API key once and pay the AI provider directly at wholesale rates - typically $2 to $4 per month for regular posting.",
      "Voice training is the core differentiator. You paste 3 to 5 of your best posts, LinkedGrow builds a style profile, and every generation matches your sentence structure and tone. The hook generator, carousel builder, AI image generation, scheduling, content calendar, A/B testing, and analytics all sit in one dashboard.",
      "Publishing goes directly to personal profiles and company pages you manage. Reddit URLs can be turned into post drafts, scheduled posts fire at exact times via QStash, and the editor previews exactly how the post will look on LinkedIn before you publish.",
    ],
    pros: [
      "43 AI models with model freedom (use Claude for thought leadership, ChatGPT for storytelling, Gemini for speed)",
      "Voice training that audiences cannot distinguish from manual writing",
      "Unlimited generations on every paid plan (no credits, no caps, no overage)",
      "Total cost stays at $15 to $30/mo all-in including AI fees",
      "Built-in AI image + carousel generation - no second subscription needed",
    ],
    cons: [
      "BYOK setup adds 2 minutes (creating an API key with OpenAI or Anthropic)",
      "Smaller community than legacy tools like Taplio",
      "Native analytics still rolling out (affects every tool)",
    ],
    accent: "from-cyan-500 to-blue-600",
    ctaLabel: "Start free 7-day Pro trial",
    ctaHref: "/sign-up",
  },
  {
    rank: 2,
    name: "Taplio",
    tagline: "Best for outreach + viral hooks library",
    href: "https://taplio.com",
    internalHref: "/compare/taplio-alternative",
    pricing: "Starter $39, Standard $52, Pro $149/mo (yearly)",
    freeTrial: "7-day free trial, card required",
    bestFor: "Salespeople and growth marketers who want LinkedIn content + automated DMs + a lead database in one tool.",
    imageSlug: "taplio-card",
    imageAlt: "Taplio viral posts library panel paired with the AI composer and lead database outreach module",
    overview: [
      "Taplio is the most established name in the LinkedIn AI tool space. It pairs AI content generation with a 3+ million contact lead database, automated DMs, auto-connection requests, and a famous library of viral LinkedIn posts you can swipe ideas from.",
      "AI access is gated. The $39 Starter plan ships with zero AI credits - you only get scheduling and the hooks library. AI generation starts at the $52 Standard plan, and the lead database plus automation requires the $149 Pro plan (on annual billing).",
      "The viral hooks library is genuinely useful for ideation, and outreach automation is the real reason most users stay despite the price.",
    ],
    pros: [
      "Massive library of high-performing LinkedIn post inspiration",
      "Lead database with 3 million+ contacts (Pro plan)",
      "Strong outreach automation - DMs, connection requests, comment-at-scale",
    ],
    cons: [
      "Starter at $39/mo includes zero AI credits",
      "AI cost is bundled and marked up vs BYOK alternatives",
      "Pro plan needed for outreach features ($149/mo on yearly billing)",
      "Single AI model under the hood with no choice",
    ],
    accent: "from-violet-500 to-purple-600",
    ctaLabel: "See LinkedGrow vs Taplio",
    ctaHref: "/compare/taplio-alternative",
  },
  {
    rank: 3,
    name: "AuthoredUp",
    tagline: "Best post editor + formatter for pure writers",
    href: "https://authoredup.com",
    internalHref: "/compare/authoredup-alternative",
    pricing: "Individual $19.95/mo, Business $14.95/user/mo (3+ seats)",
    freeTrial: "14-day free trial",
    bestFor: "Writers who already know what to write and want a better editor inside LinkedIn, plus analytics on what works.",
    imageSlug: "authoredup-card",
    imageAlt: "AuthoredUp Chrome extension formatting toolbar over the native LinkedIn composer with bold, italic, Unicode controls",
    overview: [
      "AuthoredUp is not a content generator. It is a Chrome extension that upgrades the native LinkedIn composer with bold, italic, Unicode formatting, line break controls, post preview, snippets, and analytics on every post you publish.",
      "The analytics are the secret weapon. You see which hooks, lengths, and formats actually move the needle on your account specifically, not on some abstract benchmark.",
      "There is no AI writing, no scheduling, and no carousel builder. AuthoredUp pairs well with a separate AI generator or scheduler. Solo writers love it; full-funnel marketers usually need a second tool.",
    ],
    pros: [
      "Best in-LinkedIn text formatting tools on the market",
      "Excellent per-post analytics with cohort comparisons",
      "Predictable flat pricing, no AI credit gymnastics",
    ],
    cons: [
      "No AI post generation at all",
      "No native scheduling - you publish manually or pair with another tool",
      "No image or carousel generation",
    ],
    accent: "from-rose-500 to-red-600",
    ctaLabel: "See LinkedGrow vs AuthoredUp",
    ctaHref: "/compare/authoredup-alternative",
  },
  {
    rank: 4,
    name: "Supergrow",
    tagline: "Best budget all-in-one",
    href: "https://supergrow.ai",
    internalHref: "/compare/supergrow-alternative",
    pricing: "Starter $19/mo, Pro $39/mo",
    freeTrial: "Free plan with 3 posts/mo",
    bestFor: "Creators who want LinkedGrow-style features at a simpler interface with no BYOK setup.",
    imageSlug: "supergrow-card",
    imageAlt: "Supergrow weekly calendar view alongside the Voice-to-Post microphone feature and Swipe File content inspiration feed",
    overview: [
      "Supergrow is the cleanest all-in-one alternative to Taplio. The Starter plan at $19/mo already includes AI content generation, scheduling, and a content inspiration feed. The Pro plan at $39/mo adds a carousel maker, advanced analytics, and team features.",
      "Voice-to-Post is a standout: dictate a half-formed thought, get a polished post back. The tool also avoids the aggressive automation features (like auto-DMs) that can trigger LinkedIn account restrictions on other platforms.",
      "AI is bundled (not BYOK), so you cannot switch models or pay wholesale rates. For users who want simplicity over flexibility, that is a fair trade.",
    ],
    pros: [
      "AI included on the $19/mo Starter plan (no gating)",
      "Voice-to-Post for capturing ideas on the go",
      "Conservative on risky automation - protects your LinkedIn account",
    ],
    cons: [
      "Single bundled AI model, no BYOK option",
      "Voice training less mature than LinkedGrow's",
      "Carousel maker locked behind the $99 Pro plan",
    ],
    accent: "from-emerald-500 to-green-600",
    ctaLabel: "See LinkedGrow vs Supergrow",
    ctaHref: "/compare/supergrow-alternative",
  },
  {
    rank: 5,
    name: "EasyGen",
    tagline: "Best for one-click generation in-browser",
    href: "https://easygen.io",
    internalHref: "/compare/easygen-alternative",
    pricing: "Free tier, Starter $9/mo, Pro $29/mo",
    freeTrial: "Free plan available",
    bestFor: "Busy professionals who want a Chrome extension that drafts a post in 30 seconds from a topic.",
    imageSlug: "easygen-card",
    imageAlt: "EasyGen browser extension popup with topic input field and one-click format templates for story, how-to, and hot take",
    overview: [
      "EasyGen lives as a Chrome extension. Click the icon, type a topic, pick a format (story, listicle, contrarian take, how-to), and get a draft in a few seconds. It is the lowest-friction generator on this list.",
      "Generation is based on proven LinkedIn post patterns scraped from high-performing accounts. You will not get deeply original content, but you will get safe, structured drafts that you can edit and ship.",
      "No scheduling, no analytics, no carousel builder. EasyGen is a content-generation utility, not a full platform.",
    ],
    pros: [
      "Cheapest entry point ($9/mo Starter, free tier exists)",
      "Browser extension keeps you inside LinkedIn",
      "Template-driven outputs work well for non-writers",
    ],
    cons: [
      "Templates can feel formulaic over time",
      "No scheduling, calendar, or analytics",
      "Limited voice customization",
    ],
    accent: "from-sky-500 to-cyan-600",
    ctaLabel: "See LinkedGrow vs EasyGen",
    ctaHref: "/compare/easygen-alternative",
  },
  {
    rank: 6,
    name: "MagicPost",
    tagline: "Best for beginners + template-driven posts",
    href: "https://magicpost.in",
    internalHref: "/compare/magicpost-alternative",
    pricing: "Starter $39/mo, Pro $59/mo",
    freeTrial: "Free trial available",
    bestFor: "First-time LinkedIn creators who want hand-holding via templates and a simple workflow.",
    imageSlug: "magicpost-card",
    imageAlt: "MagicPost template grid with case study, hot take, tutorial, carousel, story, and listicle starter templates",
    overview: [
      "MagicPost leans into the template angle. Pick a template (case study, hot take, motivational story, tutorial), fill in the slots, generate, edit, post. The UI is friendly and the carousel maker is solid for beginners.",
      "Pricing starts at $39/mo, which feels high for what is essentially a thin template layer over a single AI model. Stronger fit for someone new to LinkedIn who needs structure than for an experienced creator who wants flexibility.",
    ],
    pros: [
      "Beginner-friendly UI with clear template paths",
      "Carousel maker included",
      "Simple onboarding with no API key setup",
    ],
    cons: [
      "Starts at $39/mo - same as Supergrow Pro for fewer features",
      "Template-locked - hard to escape the patterns",
      "No BYOK, single bundled model",
    ],
    accent: "from-pink-500 to-fuchsia-600",
    ctaLabel: "See LinkedGrow vs MagicPost",
    ctaHref: "/compare/magicpost-alternative",
  },
  {
    rank: 7,
    name: "ContentIn",
    tagline: "Best LinkedIn-only daily-posting workflow",
    href: "https://contentin.io",
    internalHref: "/compare/contentin-alternative",
    pricing: "Free plan, Pro $29/mo, Premium $39/mo",
    freeTrial: "Free plan available",
    bestFor: "Daily LinkedIn posters who want an idea bank + swipe file + scheduling in one place.",
    imageSlug: "contentin-card",
    imageAlt: "ContentIn idea bank with categorized post ideas next to a weekly scheduling calendar for daily LinkedIn cadence",
    overview: [
      "ContentIn is LinkedIn-only by design. The standout feature is the idea bank and swipe file - thousands of pre-categorized LinkedIn post ideas you can riff on when you cannot think of what to post.",
      "AI generation is present but not the headline feature. The strength is the daily-cadence workflow: open the app, pick an idea, edit it in your voice, schedule, done.",
      "Free plan exists with limited generations. Paid plans unlock the full swipe file, scheduling, and analytics.",
    ],
    pros: [
      "Excellent idea bank if you struggle with what to post",
      "Reasonable mid-tier pricing ($29-$39/mo)",
      "Clean workflow for daily LinkedIn posters",
    ],
    cons: [
      "No BYOK, no AI model choice",
      "Carousel and image generation are weaker than dedicated tools",
      "No voice training",
    ],
    accent: "from-amber-500 to-orange-600",
    ctaLabel: "See LinkedGrow vs ContentIn",
    ctaHref: "/compare/contentin-alternative",
  },
  {
    rank: 8,
    name: "Typefully",
    tagline: "Best for cross-posting to X, Threads, Bluesky + LinkedIn",
    href: "https://typefully.com",
    internalHref: "/compare/typefully-alternative",
    pricing: "Free, Pro from $12.50/mo, Team from $49/mo (yearly)",
    freeTrial: "Free plan available",
    bestFor: "Short-form writers who post primarily on X and want LinkedIn as a secondary distribution channel.",
    imageSlug: "typefully-card",
    imageAlt: "Typefully minimalist writing canvas with cross-platform badges for LinkedIn, X, Threads, and Bluesky in the top-right corner",
    overview: [
      "Typefully is a writer-first tool. The UI is minimal, distraction-free, and feels closer to Notion than a social scheduler. It started as an X-focused tool and added LinkedIn, Threads, and Bluesky.",
      "AI assist is present (rewrite, expand, generate) but LinkedIn is not the primary muscle here - it is a port of the X workflow with LinkedIn formatting layered on top.",
      "Great if you write threads + LinkedIn posts in tandem. Suboptimal if LinkedIn is your only or primary channel.",
    ],
    pros: [
      "Cheapest entry on this list ($12.50/mo on yearly billing)",
      "Clean, distraction-free writing experience",
      "True multi-platform - X, LinkedIn, Threads, Bluesky in one composer",
    ],
    cons: [
      "LinkedIn-specific features (hooks, voice training, carousels) are thin",
      "AI generation feels generic vs LinkedIn-trained alternatives",
      "Analytics are basic",
    ],
    accent: "from-slate-700 to-slate-900",
    ctaLabel: "See LinkedGrow vs Typefully",
    ctaHref: "/compare/typefully-alternative",
  },
];

const glanceTools: GlanceRow[] = [
  {
    tool: "LinkedGrow",
    bestFor: "Best overall - voice + cost",
    pricing: "$99/mo (BYOK +$2-4)",
    freeTrial: "7-day Pro trial",
    modelChoice: "26+ models",
    voiceTraining: true,
    highlight: true,
  },
  {
    tool: "Taplio",
    bestFor: "Outreach + viral hooks",
    pricing: "$39-$149/mo",
    freeTrial: "7-day trial",
    modelChoice: "1 bundled",
    voiceTraining: false,
  },
  {
    tool: "AuthoredUp",
    bestFor: "Editor + formatter",
    pricing: "$19.95/mo",
    freeTrial: "14-day trial",
    modelChoice: "No AI gen",
    voiceTraining: false,
  },
  {
    tool: "Supergrow",
    bestFor: "Budget all-in-one",
    pricing: "$19-$39/mo",
    freeTrial: "Free plan",
    modelChoice: "1 bundled",
    voiceTraining: true,
  },
  {
    tool: "EasyGen",
    bestFor: "One-click in-browser",
    pricing: "$9-$29/mo",
    freeTrial: "Free tier",
    modelChoice: "1 bundled",
    voiceTraining: false,
  },
  {
    tool: "MagicPost",
    bestFor: "Beginners + templates",
    pricing: "$39-$59/mo",
    freeTrial: "Free trial",
    modelChoice: "1 bundled",
    voiceTraining: false,
  },
  {
    tool: "ContentIn",
    bestFor: "Idea bank + daily posts",
    pricing: "$29-$39/mo",
    freeTrial: "Free plan",
    modelChoice: "1 bundled",
    voiceTraining: false,
  },
  {
    tool: "Typefully",
    bestFor: "Cross-post X + LinkedIn",
    pricing: "$12.50-$49/mo",
    freeTrial: "Free plan",
    modelChoice: "1 bundled",
    voiceTraining: false,
  },
];

const criteria = [
  {
    icon: Brain,
    title: "AI model choice",
    description:
      "Tools that lock you into one model age fast. The best generators let you pick from multiple frontier models so quality stays high as AI evolves.",
  },
  {
    icon: Mic,
    title: "Voice training",
    description:
      "If posts sound generic, audiences scroll past. Voice training analyzes your past writing so every generation sounds like you, not like ChatGPT.",
  },
  {
    icon: CircleDollarSign,
    title: "Total cost (subscription + AI)",
    description:
      "Bundled-AI tools mark up wholesale API calls. BYOK pricing reveals the true cost: a few dollars per month, not $69+ in bundled credits.",
  },
  {
    icon: Sparkles,
    title: "Integrated workflow",
    description:
      "Hook generation, carousels, scheduling, images, and analytics in one tool beat juggling 4 subscriptions. Look for breadth without losing depth.",
  },
  {
    icon: BarChart3,
    title: "Direct LinkedIn publishing",
    description:
      "Manual copy-paste burns time. Direct API publishing to personal profiles and company pages is table stakes in 2026.",
  },
];

export function BestPostGeneratorContent({
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
              Independent ranking · Updated May 2026
            </span>
          </div>
          <h1 className="m-0 text-center font-v3-display! text-[clamp(43px,6.8vw,88px)] font-semibold! leading-[.98]! tracking-[-.048em]! text-white">
            Best LinkedIn Post Generators in 2026:{" "}
            <span className="text-v3-sky">
              Ranked &amp; Reviewed
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-[62ch] text-center text-[clamp(16.5px,1.35vw,19px)] leading-[1.58]! text-[rgba(255,255,255,.76)]">
            We tested the 8 most popular LinkedIn post generators side by side on pricing, AI model choice,
            voice training, and integration depth. Here is the honest ranking, with pros and cons for each.
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
              src={`${R2}/best-linkedin-post-generators-ranked-2026-cover.avif`}
              alt="Best LinkedIn post generators 2026 - LinkedGrow, Taplio, AuthoredUp, Supergrow, EasyGen, MagicPost, ContentIn, Typefully"
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
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-grotesk font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
              The 8 best LinkedIn post generators{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-blue-600">
                at a glance
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              The fast version. Full reviews below.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tool</th>
                    <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Best for</th>
                    <th className="p-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pricing</th>
                    <th className="p-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Free trial</th>
                    <th className="p-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">AI models</th>
                    <th className="p-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Voice training</th>
                  </tr>
                </thead>
                <tbody>
                  {glanceTools.map((row, i) => (
                    <tr
                      key={row.tool}
                      className={`${i < glanceTools.length - 1 ? "border-b border-slate-100 dark:border-slate-800/60" : ""} ${row.highlight ? "bg-cyan-50/60 dark:bg-cyan-900/10" : ""}`}
                    >
                      <td className="p-4">
                        <div className={`font-bold ${row.highlight ? "text-cyan-600 dark:text-cyan-400" : "text-slate-900 dark:text-white"}`}>
                          {row.tool}
                        </div>
                        {row.highlight && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-linear-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-semibold">
                            #1 RANKED
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-700 dark:text-slate-300">{row.bestFor}</td>
                      <td className={`p-4 text-center text-sm font-semibold ${row.highlight ? "text-cyan-600 dark:text-cyan-400" : "text-slate-900 dark:text-white"}`}>
                        {row.pricing}
                      </td>
                      <td className="p-4 text-center text-sm text-slate-700 dark:text-slate-300">{row.freeTrial}</td>
                      <td className={`p-4 text-center text-sm ${row.highlight ? "font-bold text-cyan-600 dark:text-cyan-400" : "text-slate-700 dark:text-slate-300"}`}>
                        {row.modelChoice}
                      </td>
                      <td className="p-4 text-center">
                        {row.voiceTraining ? (
                          <Check className="w-5 h-5 text-emerald-500 inline-block" />
                        ) : (
                          <X className="w-5 h-5 text-slate-300 dark:text-slate-600 inline-block" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
              {glanceTools.map((row) => (
                <div
                  key={row.tool}
                  className={`p-4 ${row.highlight ? "bg-cyan-50/60 dark:bg-cyan-900/10" : ""}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className={`font-bold ${row.highlight ? "text-cyan-600 dark:text-cyan-400" : "text-slate-900 dark:text-white"}`}>
                        {row.tool}
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
                    <span>Free: {row.freeTrial}</span>
                    <span>Models: {row.modelChoice}</span>
                    <span className="inline-flex items-center gap-1">
                      Voice:{" "}
                      {row.voiceTraining ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Total cost matters more than sticker price. A $99/mo BYOK tool with $3 in AI fees beats a
            $52/mo bundled tool on capability per dollar.
          </p>
        </div>
      </section>

      {/* ===== HOW WE EVALUATED ===== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-grotesk font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
              How we evaluated these tools
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Five criteria that actually predict whether a tool will pay for itself.
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
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-grotesk font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
              The 8 best LinkedIn post generators in 2026
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Ranked from best overall to most specialized. Click any tool name to jump.
            </p>
          </div>

          <div className="space-y-20">
            {tools.map((tool) => (
              <article
                key={tool.name}
                id={tool.name.toLowerCase()}
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
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {tool.tagline}
                  </span>
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
            <h2 className="text-3xl sm:text-4xl font-grotesk font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
              How to choose the right LinkedIn post generator
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Match the tool to your actual workflow. Three real personas, three honest picks.
            </p>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                You are a founder, coach, or consultant posting 2 to 5 times a week
              </h3>
              <p className="text-[1.0625rem] text-slate-700 dark:text-slate-300 leading-relaxed">
                Pick <Link href="/" className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">LinkedGrow</Link>.
                You care about sounding like yourself (voice training), you want flexibility on AI models as new ones launch (BYOK), and
                you do not want to juggle subscriptions for images, scheduling, and analytics. Total monthly cost stays at $15 to $30 all-in.
                Runner-up: Supergrow if you prefer a single bundled model with no API key setup.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                You are a salesperson or growth marketer using LinkedIn for outbound
              </h3>
              <p className="text-[1.0625rem] text-slate-700 dark:text-slate-300 leading-relaxed">
                Pick Taplio if outreach automation (auto-DMs, lead database) is core to your workflow and you can justify $149/mo on the Pro
                plan. Otherwise pick LinkedGrow + manual outreach - you keep 65% of the cost in your pocket and the content quality is higher.
                Most growth marketers do not actually need Taplio Pro; they just need consistent content.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                You write all your posts yourself and want a better editor + analytics
              </h3>
              <p className="text-[1.0625rem] text-slate-700 dark:text-slate-300 leading-relaxed">
                Pick AuthoredUp. The Chrome extension format and detailed per-post analytics are unmatched if you do not need AI generation.
                Pair it with a separate scheduler if you ever start scheduling more than 2 weeks out.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                You post on X primarily and LinkedIn is secondary
              </h3>
              <p className="text-[1.0625rem] text-slate-700 dark:text-slate-300 leading-relaxed">
                Pick Typefully. The multi-platform composer was built for this. Just know that LinkedIn-specific features like hook libraries
                and voice training are thin compared to LinkedIn-only tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      <LandingFAQ
        headline={{ text: "LinkedIn post generator", gradient: "FAQ" }}
        description="The most common questions before picking a tool."
        faqs={faqs}
      />

      <LandingRelatedContent
        headline="Related Resources"
        links={[
          { title: "Best LinkedIn AI Tools 2026 (Blog)", href: "/blog/best-linkedin-ai-tools-2026" },
          { title: "Free LinkedIn Post Generator", href: "/free-linkedin-post-generator-ai" },
          { title: "AI API Cost Comparison", href: "/blog/ai-api-cost-comparison-linkedin-tools" },
          { title: "LinkedIn Content Creation Tools", href: "/linkedin-content-creation-tools" },
        ]}
      />

      <LandingCTA
        badge="Try the #1 ranked LinkedIn post generator"
        headline={{
          line1: "Start free with the best",
          gradient: "LinkedIn post generator in 2026",
        }}
        description="43 AI models via BYOK, voice training, unlimited generations. Total monthly cost $15 to $30 all-in. Join 179+ founders."
        primaryCta={{ text: "Start free 7-day Pro trial", href: "/sign-up" }}
        trustIndicators={[
          "Everything included",
          "Unlimited generations",
          "Voice training included",
          "Your own AI key",
        ]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
