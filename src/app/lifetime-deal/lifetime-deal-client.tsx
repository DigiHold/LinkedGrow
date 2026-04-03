"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Shield,
  Zap,
  Sparkles,
  Crown,
  Loader2,
  Infinity,
  TrendingUp,
  Calendar,
  BarChart3,
  Image as ImageIcon,
  Layers,
  FlaskConical,
  Users,
  Code,
  Headphones,
  RefreshCw,
  Key,
  Brain,
  ChevronDown,
  Clock,
  Star,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { redirectToLtdCheckout } from "@/lib/checkout";
import { BreadcrumbJsonLd, FAQJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";

// ============================================
// TYPES
// ============================================

interface LtdStatus {
  counter: number;
  currentTier: "early-bird" | "regular" | "final-call";
  tierSpotsLeft: number;
}

const TIERS = [
  {
    id: "early-bird" as const,
    name: "Early Bird",
    price: 99,
    label: "Best Value",
    description: "First 100 founders get this price",
  },
  {
    id: "regular" as const,
    name: "Lifetime Deal",
    price: 149,
    label: "Popular",
    description: "Standard lifetime price",
  },
  {
    id: "final-call" as const,
    name: "Final Call",
    price: 199,
    label: "Last Chance",
    description: "Before we close forever",
  },
];

const FEATURES = [
  { icon: Sparkles, name: "Unlimited AI Post Generation", description: "Generate as many posts as you want with your own AI key" },
  { icon: TrendingUp, name: "Advanced Post Editor", description: "Rich text editor with formatting and LinkedIn preview" },
  { icon: Calendar, name: "Content Calendar + Scheduling", description: "Plan and schedule posts with visual calendar" },
  { icon: ImageIcon, name: "AI Image Generation", description: "Create stunning images for your posts with AI" },
  { icon: Layers, name: "Carousel Generator", description: "Create multi-slide carousels that get 3x engagement" },
  { icon: Brain, name: "Hooks Generator", description: "Generate viral opening lines that stop the scroll" },
  { icon: FlaskConical, name: "A/B Testing", description: "Test different post versions to find what works" },
  { icon: BarChart3, name: "Analytics Dashboard", description: "Track engagement, impressions, and growth" },
  { icon: Zap, name: "Engagement Tools", description: "Like, comment, and interact from your dashboard" },
  { icon: TrendingUp, name: "Algorithm Optimizer", description: "AI-powered suggestions to boost reach" },
  { icon: Users, name: "Team Collaboration", description: "Invite team members with role-based access" },
  { icon: Code, name: "API Access", description: "REST API for custom integrations" },
  { icon: Headphones, name: "Priority Support", description: "Fast, dedicated support from the founder" },
  { icon: RefreshCw, name: "All Future Updates", description: "Every new feature we ship is yours, forever" },
];

const FAQ_ITEMS = [
  {
    question: "What does \"lifetime\" mean?",
    answer: "You get access to LinkedGrow and every feature update we ship, forever. No expiration. No recurring charges. One payment, permanent access.",
  },
  {
    question: "What is BYOK (Bring Your Own Key)?",
    answer: "BYOK means you connect your own AI API key from providers like OpenAI, Anthropic, or Google. You pay them directly for AI usage - typically $2-4/month. We don't mark up AI costs.",
  },
  {
    question: "What AI providers are supported?",
    answer: "OpenAI (GPT-5, GPT-4), Anthropic (Claude), Google (Gemini), Grok (xAI), Perplexity, and Kimi (Moonshot AI) for text generation. Google, OpenAI, and Replicate for image generation. We add new providers regularly.",
  },
  {
    question: "How much does the AI API cost?",
    answer: "Most users spend $2-4/month on AI API costs. Light users under $2. Heavy users up to $8. You have full control and can set spending limits directly with your AI provider.",
  },
  {
    question: "What if I'm not satisfied?",
    answer: "Full refund within 14 days. No questions asked. Just email contact@linkedgrow.ai.",
  },
  {
    question: "Will the price increase?",
    answer: "Yes. The early bird price is $99. After 100 sales, it goes to $149. Then $199. The price only goes up, never down.",
  },
  {
    question: "Will you offer this deal again?",
    answer: "No. This is a one-time offer. When the licenses are sold, LinkedGrow goes subscription-only at $79/month.",
  },
  {
    question: "Do I need a LinkedIn account?",
    answer: "Yes. You connect your LinkedIn account to publish posts directly from LinkedGrow.",
  },
  {
    question: "What if LinkedGrow shuts down?",
    answer: "LinkedGrow is built by Nicolas Lecocq, who created OceanWP (used by millions of WordPress sites). The BYOK model means our per-user costs are near zero - the business is inherently sustainable.",
  },
  {
    question: "Can I upgrade later if I don't buy the LTD?",
    answer: "You can subscribe to any plan anytime. But the subscription is $79/month for Business. The lifetime price is only available during this launch.",
  },
];

const COMPETITORS = [
  { name: "Taplio", monthly: 49, yearly: 588, threeYear: 1764 },
  { name: "AuthoredUp", monthly: 24, yearly: 288, threeYear: 864 },
  { name: "Buffer AI", monthly: 36, yearly: 432, threeYear: 1296 },
];

// ============================================
// STICKY HEADER
// ============================================

function StickyHeader({
  counter,
  onCta,
  loading,
}: {
  counter: number;
  onCta: () => void;
  loading: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 shadow-sm"
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-900 dark:text-white">LinkedGrow</span>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Clock className="w-3 h-3" />
            {counter} licenses remaining
          </span>
        </div>
        <Button
          onClick={onCta}
          disabled={loading}
          className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
          Get Lifetime Access
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================
// HERO SECTION
// ============================================

function HeroSection({
  counter,
  currentPrice,
  onCta,
  loading,
}: {
  counter: number;
  currentPrice: number;
  onCta: () => void;
  loading: boolean;
}) {
  return (
    <section className="relative z-10 pt-20 md:pt-32 pb-16 md:pb-24 px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-sm font-semibold text-amber-700 dark:text-amber-400 mb-6"
        >
          <Gift className="w-4 h-4" />
          <span>Limited Offer - Only {counter} Lifetime Licenses</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white mb-6 leading-tight"
        >
          Get LinkedGrow Business.{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-blue-600">
            Forever.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto"
        >
          The AI-powered LinkedIn growth platform. One payment. Lifetime access.
          All features. All updates. Priority support.
        </motion.p>

        {/* Price */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-2xl text-slate-400 line-through">$948/year</span>
            <span className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white">${currentPrice}</span>
            <span className="text-lg text-slate-500">one-time</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            + your own AI API key ($2-4/month) - we don&apos;t mark up AI costs
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col items-center gap-4"
        >
          <Button
            size="lg"
            onClick={onCta}
            disabled={loading}
            className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-xl shadow-cyan-500/25 text-lg px-10 py-6 h-auto"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5 mr-2" />
            )}
            Get Lifetime Access - ${currentPrice}
          </Button>

          {/* Trust elements */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>14-day money-back guarantee</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <Infinity className="w-4 h-4 text-emerald-500" />
              <span>No recurring charges</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Secure checkout with Stripe</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// PRICE COMPARISON
// ============================================

function PriceComparison({ currentPrice }: { currentPrice: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const ltdThreeYear = currentPrice + 36 * 3; // $99 + ~$36/year API costs

  return (
    <section ref={ref} className="relative z-10 py-16 md:py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Stop paying{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-red-500 to-orange-500">
              $49+/month
            </span>{" "}
            for AI you own
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            The actual AI cost is $2-4/month. Why pay 10-20x markup?
          </p>
        </motion.div>

        <div className="grid gap-4">
          {/* Competitor rows */}
          {COMPETITORS.map((comp, i) => (
            <motion.div
              key={comp.name}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
              className="flex items-center justify-between p-4 rounded-xl bg-red-50/50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/30"
            >
              <span className="font-medium text-slate-700 dark:text-slate-300">{comp.name}</span>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-500">${comp.monthly}/mo</span>
                <span className="text-slate-400">=</span>
                <span className="text-red-600 dark:text-red-400 font-semibold">${comp.threeYear.toLocaleString()} over 3 years</span>
              </div>
            </motion.div>
          ))}

          {/* LinkedGrow row */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-400 dark:border-emerald-600"
          >
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-slate-900 dark:text-white">LinkedGrow LTD</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-500">${currentPrice} once + ~$3/mo API</span>
              <span className="text-slate-400">=</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">${ltdThreeYear} over 3 years</span>
            </div>
          </motion.div>
        </div>

        {/* Savings callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            Save ${(COMPETITORS[0].threeYear - ltdThreeYear).toLocaleString()} over 3 years vs {COMPETITORS[0].name}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// FEATURES GRID
// ============================================

function FeaturesGrid() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative z-10 py-16 md:py-24 px-4 bg-linear-to-b from-transparent via-cyan-50/50 dark:via-cyan-950/20 to-transparent">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800 text-sm font-medium text-cyan-700 dark:text-cyan-400 mb-4">
            <Crown className="w-4 h-4" />
            <span>Full Business Plan - Everything Included</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Every feature.{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-blue-600">
              Unlocked forever.
            </span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            The Business plan ($79/mo) includes everything LinkedGrow offers. You get it all, for life.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.05 * i }}
              className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{feature.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// BYOK SECTION
// ============================================

function ByokSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    {
      number: "1",
      title: "Get an API key",
      description: "Sign up at OpenAI, Anthropic, or Google and create an API key. Takes 2 minutes.",
      icon: Key,
    },
    {
      number: "2",
      title: "Paste it in settings",
      description: "Go to LinkedGrow Settings > AI API and paste your key. One field, done.",
      icon: Zap,
    },
    {
      number: "3",
      title: "Generate unlimited content",
      description: "Create as many posts as you want. You pay the AI provider directly - $2-4/month.",
      icon: Sparkles,
    },
  ];

  const providers = ["OpenAI", "Anthropic", "Google", "xAI (Grok)", "Perplexity", "Kimi"];

  return (
    <section ref={ref} className="relative z-10 py-16 md:py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            How{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-500 to-orange-500">
              BYOK
            </span>{" "}
            saves you 96%
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Every AI LinkedIn tool charges $30-80/month. The actual AI API cost is $2-4. We cut out the markup.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.15 }}
              className="relative p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mb-1">Step {step.number}</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{step.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Supported providers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center"
        >
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Supported AI providers</p>
          <div className="flex flex-wrap justify-center gap-3">
            {providers.map((provider) => (
              <span
                key={provider}
                className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                {provider}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// PRICING TIERS
// ============================================

function PricingTiers({
  status,
  onSelectTier,
  loading,
}: {
  status: LtdStatus;
  onSelectTier: (tier: string) => void;
  loading: string | null;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const tierOrder = ["early-bird", "regular", "final-call"];
  const currentTierIndex = tierOrder.indexOf(status.currentTier);

  // Each tier's total displayed spots
  // Early Bird: spots 0-99 (100 total)
  // Regular: spots 100-249 (150 total)
  // Final Call: spots 250-499 (250 total)
  const tierConfig: Record<string, { total: number }> = {
    "early-bird": { total: 100 },
    "regular": { total: 150 },
    "final-call": { total: 250 },
  };

  const getTierSpots = (tierId: string) => {
    const tierIndex = tierOrder.indexOf(tierId);
    const total = tierConfig[tierId].total;

    if (tierIndex < currentTierIndex) {
      // Past tier - fully sold out
      return { total, left: 0 };
    }
    if (tierIndex === currentTierIndex) {
      // Active tier - tierSpotsLeft from API is the remaining within this tier's range
      // API calculates: early-bird = 100 - displayed, regular = 250 - displayed, final = 500 - displayed
      // For regular, if displayed=120 -> tierSpotsLeft=130 -> left in this tier = 130, total = 150
      // We need to clamp it to the tier's total
      return { total, left: Math.min(total, status.tierSpotsLeft) };
    }
    // Future tier - all spots available
    return { total, left: total };
  };

  return (
    <section ref={ref} id="pricing" className="relative z-10 py-16 md:py-24 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Big 500 counter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400">
              Only {status.counter} lifetime licenses exist
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Price increases as{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-blue-600">
              spots fill up
            </span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            All tiers include the exact same Business plan. The only difference is when you buy.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map((tier, i) => {
            const tierIndex = tierOrder.indexOf(tier.id);
            const isSoldOut = tierIndex < currentTierIndex;
            const isActive = tier.id === status.currentTier;
            const isLocked = tierIndex > currentTierIndex;
            const spots = getTierSpots(tier.id);

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                className={`relative flex flex-col rounded-2xl border transition-all ${
                  isActive
                    ? "border-cyan-400 dark:border-cyan-600 shadow-xl shadow-cyan-500/10 scale-[1.02] md:scale-105 z-10"
                    : isSoldOut
                      ? "border-slate-200 dark:border-slate-700 opacity-50 grayscale"
                      : "border-slate-200 dark:border-slate-700 opacity-40"
                } bg-white dark:bg-slate-800/80`}
              >
                {/* Badge */}
                {isActive && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="px-4 py-1.5 rounded-full bg-linear-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                      <Star className="w-3.5 h-3.5" />
                      Available Now
                    </div>
                  </div>
                )}
                {isSoldOut && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="px-4 py-1.5 rounded-full bg-slate-500 text-white text-sm font-semibold shadow-lg whitespace-nowrap">
                      Sold Out
                    </div>
                  </div>
                )}
                {isLocked && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="px-4 py-1.5 rounded-full bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-sm font-semibold shadow-lg whitespace-nowrap">
                      Unlocks later
                    </div>
                  </div>
                )}

                <div className={`p-6 pb-4 ${(isActive || isSoldOut || isLocked) ? "pt-8" : ""}`}>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{tier.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{tier.description}</p>
                </div>

                <div className="px-6 pb-6 flex-1 flex flex-col">
                  <div className="mb-4">
                    <div className="flex items-baseline">
                      <span className={`text-4xl font-bold ${isSoldOut ? "text-slate-400 line-through" : "text-slate-900 dark:text-white"}`}>
                        ${tier.price}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 ml-2">one-time</span>
                    </div>
                  </div>

                  {/* Spots counter - prominent for active tier */}
                  {isActive && (
                    <div className="mb-5">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="font-semibold text-amber-700 dark:text-amber-400">
                          Only {spots.left}/{spots.total} spots left
                        </span>
                        <span className="text-slate-400">{Math.round(((spots.total - spots.left) / spots.total) * 100)}% claimed</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-amber-400 to-red-500 transition-all duration-500"
                          style={{ width: `${((spots.total - spots.left) / spots.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {isSoldOut && (
                    <div className="mb-5">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="font-semibold text-slate-400">0/{spots.total} spots left</span>
                        <span className="text-slate-400">100% claimed</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div className="h-full rounded-full bg-slate-400 w-full" />
                      </div>
                    </div>
                  )}
                  {isLocked && (
                    <div className="mb-5">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="font-semibold text-slate-400">{spots.total}/{spots.total} spots available</span>
                        <span className="text-slate-400">Unlocks next</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div className="h-full rounded-full bg-slate-200 dark:bg-slate-600" style={{ width: "0%" }} />
                      </div>
                    </div>
                  )}

                  <ul className="space-y-3 mb-6 flex-1">
                    {["Full Business plan", "All features forever", "All future updates", "Priority support", "14-day guarantee"].map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${(isSoldOut || isLocked) ? "bg-slate-100 dark:bg-slate-700" : "bg-emerald-100 dark:bg-emerald-900/50"}`}>
                          <Check className={`w-3 h-3 ${(isSoldOut || isLocked) ? "text-slate-400" : "text-emerald-600 dark:text-emerald-400"}`} />
                        </div>
                        <span className={`text-sm ${(isSoldOut || isLocked) ? "text-slate-400" : "text-slate-700 dark:text-slate-300"}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    size="lg"
                    disabled={!isActive || loading === tier.id}
                    onClick={() => onSelectTier(tier.id)}
                    className={`w-full ${
                      isActive
                        ? "bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25"
                        : "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {loading === tier.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : isSoldOut ? (
                      "Sold Out"
                    ) : isLocked ? (
                      "Unlocks Later"
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Get Lifetime Access - ${tier.price}
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================
// FAQ SECTION
// ============================================

function FaqSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section ref={ref} className="relative z-10 py-16 md:py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Frequently asked questions
          </h2>
        </motion.div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.05 * i }}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-semibold text-slate-900 dark:text-white pr-4">{item.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  {item.answer}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// FINAL CTA
// ============================================

function FinalCta({
  counter,
  currentPrice,
  onCta,
  loading,
}: {
  counter: number;
  currentPrice: number;
  onCta: () => void;
  loading: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative z-10 py-20 md:py-28 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto rounded-3xl bg-linear-to-r from-cyan-600 to-blue-700 p-10 md:p-16 text-center relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-sm font-semibold text-white mb-6">
            <Clock className="w-4 h-4" />
            {counter} licenses remaining
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Don&apos;t miss this deal
          </h2>
          <p className="text-lg text-cyan-100 mb-2">
            <span className="line-through text-cyan-200/60">$948/year</span>{" "}
            <span className="text-white font-bold text-2xl">${currentPrice} once</span>
          </p>
          <p className="text-cyan-100 mb-8">
            Full Business plan. Forever. Every feature. Every update.
          </p>

          <Button
            size="lg"
            onClick={onCta}
            disabled={loading}
            className="bg-white text-cyan-700 hover:bg-cyan-50 shadow-xl text-lg px-10 py-6 h-auto font-bold"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5 mr-2" />
            )}
            Get Lifetime Access - ${currentPrice}
          </Button>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-cyan-100">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>14-day money-back guarantee</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/20" />
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>Secure Stripe checkout</span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ============================================
// FOOTER
// ============================================

function LtdFooter() {
  return (
    <footer className="relative z-10 py-8 px-4 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-4xl mx-auto text-center text-sm text-slate-500 dark:text-slate-400">
        <p className="mb-2">
          LinkedGrow - AI-Powered LinkedIn Growth Platform
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/privacy" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Terms of Service
          </Link>
          <a href="mailto:contact@linkedgrow.ai" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            contact@linkedgrow.ai
          </a>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function LifetimeDealClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const [status, setStatus] = useState<LtdStatus>({ counter: 500, currentTier: "early-bird", tierSpotsLeft: 100 });
  const [loading, setLoading] = useState<string | null>(null);

  // Fetch LTD status
  useEffect(() => {
    fetch("/api/ltd/status")
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() => {});
  }, []);

  const currentPrice = TIERS.find((t) => t.id === status.currentTier)?.price || 99;

  const handleSelectTier = (tier: string) => {
    if (session?.user?.email) {
      setLoading(tier);
      redirectToLtdCheckout(tier, session.user.email, () => setLoading(null));
    } else {
      router.push(`/sign-up?ltd=${tier}`);
    }
  };

  const handleCtaClick = () => {
    handleSelectTier(status.currentTier);
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-cyan-100/30 dark:from-cyan-900/10 via-transparent to-transparent" />
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-linear-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-linear-to-br from-violet-500/10 to-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Urgency Banner */}
      <div className="relative z-20 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-3 px-4 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-cyan-400">LIFETIME DEAL</span>
          </div>
          <span className="text-slate-300 text-sm sm:text-base">
            Full Business plan forever - <span className="font-bold text-white">${currentPrice} one-time</span>
          </span>
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-slate-400">|</span>
            <span className="text-amber-400 font-semibold">{status.counter} licenses remaining</span>
          </div>
        </div>
      </div>

      {/* Sticky Header (appears on scroll) */}
      <StickyHeader counter={status.counter} onCta={handleCtaClick} loading={loading === status.currentTier} />

      {/* Structured Data */}
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          { name: "Lifetime Deal", url: "https://linkedgrow.ai/lifetime-deal" },
        ]}
      />
      <SoftwareApplicationJsonLd
        name="LinkedGrow - Lifetime Deal"
        url="https://linkedgrow.ai/lifetime-deal"
        description="AI-powered LinkedIn content platform with BYOK. Get the full Business plan forever with a one-time payment."
        offers={{ price: currentPrice.toString(), priceCurrency: "USD" }}
      />
      <FAQJsonLd
        questions={FAQ_ITEMS.map((item) => ({
          question: item.question,
          answer: item.answer,
        }))}
      />

      {/* Sections */}
      <HeroSection counter={status.counter} currentPrice={currentPrice} onCta={handleCtaClick} loading={loading === status.currentTier} />
      <PriceComparison currentPrice={currentPrice} />
      <FeaturesGrid />
      <ByokSection />
      <PricingTiers status={status} onSelectTier={handleSelectTier} loading={loading} />
      <FaqSection />
      <FinalCta counter={status.counter} currentPrice={currentPrice} onCta={handleCtaClick} loading={loading === status.currentTier} />
      <LtdFooter />
    </main>
  );
}
