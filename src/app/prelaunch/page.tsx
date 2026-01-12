"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  Check,
  Clock,
  Users,
  Rocket,
  Play,
  Pause,
  ChevronRight,
  ChevronDown,
  Zap,
  Target,
  Brain,
  Sparkles,
  TrendingUp,
  BarChart3,
  X,
  Star,
  Calendar,
  FileText,
  Globe,
  Key,
  Shield,
  RefreshCw,
  Gift,
  ArrowUpRight,
  MousePointer2,
  Flame,
  Crown,
  Bolt,
  CircleDollarSign,
  Timer,
  Award,
  BadgeCheck,
  Heart,
  ThumbsUp,
  Eye,
  MessageCircle,
} from "lucide-react";
import { PrelaunchHeader } from "@/components/prelaunch/prelaunch-header";

// ============================================
// HERO VARIANTS - Choose your favorite!
// ============================================

// Hero Variant 1: Split Layout with 3D Product Preview
function HeroVariant1({ email, setEmail, handleSubmit, isLoading, isSuccess, error, isMounted }: HeroProps) {
  return (
    <section className="relative z-10 pt-8 md:pt-16 pb-16 md:pb-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 mb-6">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Join 179+ founders on the waitlist
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1]">
              Turn LinkedIn into your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500">
                growth machine
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              AI-powered content that sounds like you. Viral analytics that predict engagement.
              Pay <span className="font-bold text-slate-900 dark:text-white">$3-5/month</span> in API costs - not $50+ subscriptions.
            </p>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-6 mb-8">
              {[
                { value: "10x", label: "faster content" },
                { value: "96%", label: "cost savings" },
                { value: "47%", label: "more reach" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
                    {stat.value}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* CTA Form */}
            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 px-5 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-base flex-1"
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-14 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-base shadow-lg shadow-cyan-500/30"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Get 30% Off <ArrowRight className="w-5 h-5 ml-2" /></>}
                </Button>
              </form>
            ) : (
              <SuccessMessage />
            )}
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
              No credit card required. Cancel anytime.
            </p>
          </motion.div>

          {/* Right: 3D Product Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30, rotateY: -10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative perspective-1000"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-violet-500/20 rounded-3xl blur-2xl" />
            <div className="relative transform-gpu hover:scale-[1.02] transition-transform duration-500">
              <DemoPreview />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Hero Variant 2: Centered with Floating Elements
function HeroVariant2({ email, setEmail, handleSubmit, isLoading, isSuccess, error, isMounted }: HeroProps) {
  return (
    <section className="relative z-10 pt-8 md:pt-16 pb-16 md:pb-24 px-4 overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-[10%] w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 opacity-20 blur-sm"
        />
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-40 right-[15%] w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 opacity-20 blur-sm"
        />
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-40 left-[20%] w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 opacity-20 blur-sm"
        />
      </div>

      <div className="max-w-5xl mx-auto text-center">
        {/* Announcement Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 mb-8"
        >
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Early Access Open</span>
          </span>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
          <span className="text-sm text-slate-600 dark:text-slate-400">Only 153 spots left</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-6"
        >
          LinkedIn content that
          <br />
          <span className="relative">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500">
              actually converts
            </span>
            <motion.svg
              className="absolute -bottom-2 left-0 w-full"
              viewBox="0 0 300 12"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <motion.path
                d="M2 10 Q75 2 150 6 T298 4"
                stroke="url(#gradient)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </motion.svg>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10"
        >
          Use your own AI key. Write 10x faster. Spend{" "}
          <span className="font-bold text-slate-900 dark:text-white">$3-5/month</span> instead of $50+.
          <br className="hidden sm:block" />
          Join the founders who are growing on LinkedIn smarter, not harder.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-lg mx-auto"
        >
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 px-4 rounded-xl border-0 bg-slate-50 dark:bg-slate-900 text-base flex-1 focus:ring-2 focus:ring-cyan-500"
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 px-8 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-base shadow-lg shadow-cyan-500/30"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Join Waitlist <Sparkles className="w-4 h-4 ml-2" /></>}
                </Button>
              </div>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </form>
          ) : (
            <SuccessMessage />
          )}
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
            <Check className="w-4 h-4 inline mr-1 text-emerald-500" />
            30% off locked in for early supporters
          </p>
        </motion.div>

        {/* Social Proof Avatars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-4 mt-10"
        >
          <div className="flex -space-x-3">
            {["S", "M", "E", "J", "P"].map((letter, i) => (
              <div
                key={letter}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-sm font-bold shadow-lg"
                style={{ zIndex: 5 - i }}
              >
                {letter}
              </div>
            ))}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Loved by <span className="font-semibold text-slate-900 dark:text-white">179 founders</span>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Hero Variant 3: Video/Visual First with Glassmorphism
function HeroVariant3({ email, setEmail, handleSubmit, isLoading, isSuccess, error, isMounted }: HeroProps) {
  return (
    <section className="relative z-10 pt-8 md:pt-12 pb-16 md:pb-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <Gift className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              Early Access: 30% OFF for first year
            </span>
            <ChevronRight className="w-4 h-4 text-amber-500" />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
            Write viral LinkedIn posts
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500">
              in seconds, not hours
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Bring your own AI key. Pay only for what you use.
            <br className="hidden sm:block" />
            Create weeks of content in minutes.
          </p>
        </motion.div>

        {/* CTA - Glassmorphism Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-xl mx-auto mb-12"
        >
          {!isSuccess ? (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-2xl blur-xl" />
              <form onSubmit={handleSubmit} className="relative backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 rounded-2xl p-4 border border-white/50 dark:border-slate-700/50 shadow-2xl">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 px-5 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-base flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-14 px-8 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-base shadow-lg shadow-cyan-500/30 whitespace-nowrap"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Get Early Access <ArrowUpRight className="w-5 h-5 ml-2" /></>}
                  </Button>
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                <div className="flex items-center justify-center gap-6 mt-4 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><Check className="w-4 h-4 text-emerald-500" /> Free to start</span>
                  <span className="flex items-center gap-1"><Check className="w-4 h-4 text-emerald-500" /> No credit card</span>
                  <span className="flex items-center gap-1"><Check className="w-4 h-4 text-emerald-500" /> Cancel anytime</span>
                </div>
              </form>
            </div>
          ) : (
            <SuccessMessage />
          )}
        </motion.div>

        {/* Product Preview with Play Button Overlay */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="relative max-w-4xl mx-auto"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-violet-500/30 rounded-3xl blur-2xl" />
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
            <DemoPreview />
            {/* Overlay gradient at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end justify-center pb-6">
              <div className="flex items-center gap-2 text-white text-sm font-medium">
                <MousePointer2 className="w-4 h-4" />
                Interactive demo - try it yourself
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Hero Variant 4: Bold Statement with Metrics Grid
function HeroVariant4({ email, setEmail, handleSubmit, isLoading, isSuccess, error, isMounted }: HeroProps) {
  return (
    <section className="relative z-10 pt-8 md:pt-16 pb-16 md:pb-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Main Content */}
        <div className="text-center mb-12">
          {/* Pre-headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400 mb-6"
          >
            <Bolt className="w-4 h-4" />
            THE SMARTER WAY TO GROW ON LINKEDIN
          </motion.div>

          {/* Bold Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.05]"
          >
            Stop paying $50+/month
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500">
              for AI content tools
            </span>
          </motion.h1>

          {/* Value Prop */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-8"
          >
            LinkedGrow lets you use your own AI key (OpenAI, Claude, Gemini).
            <br className="hidden sm:block" />
            Same powerful features. <span className="font-bold text-slate-900 dark:text-white">96% less cost.</span>
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-md mx-auto"
          >
            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 px-5 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-base flex-1"
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-14 px-8 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-base"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Join Waitlist</>}
                </Button>
              </form>
            ) : (
              <SuccessMessage />
            )}
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </motion.div>
        </div>

        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12"
        >
          {[
            { icon: CircleDollarSign, value: "$3-5", label: "avg. monthly API cost", color: "from-emerald-500 to-teal-500" },
            { icon: Timer, value: "10x", label: "faster content creation", color: "from-cyan-500 to-blue-500" },
            { icon: TrendingUp, value: "+47%", label: "engagement increase", color: "from-violet-500 to-purple-500" },
            { icon: Users, value: "179+", label: "founders on waitlist", color: "from-orange-500 to-red-500" },
          ].map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="relative group"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`} />
              <div className="relative bg-white dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 text-center">
                <metric.icon className={`w-8 h-8 mx-auto mb-3 text-transparent bg-clip-text bg-gradient-to-r ${metric.color}`} style={{ color: 'transparent', background: `linear-gradient(to right, var(--tw-gradient-stops))`, WebkitBackgroundClip: 'text' }} />
                <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{metric.value}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{metric.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Product Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <DemoPreview />
        </motion.div>
      </div>
    </section>
  );
}

// Shared Success Message Component
function SuccessMessage() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 text-center"
    >
      <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500 flex items-center justify-center mb-4">
        <Check className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">You&apos;re on the list!</h3>
      <p className="text-slate-600 dark:text-slate-400">Your 30% discount is locked in. Check your inbox!</p>
    </motion.div>
  );
}

interface HeroProps {
  email: string;
  setEmail: (email: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isSuccess: boolean;
  error: string;
  isMounted: boolean;
}

// ============================================
// INTERACTIVE DEMO PREVIEW
// ============================================

function DemoPreview() {
  const [activeTab, setActiveTab] = useState<"write" | "analyze" | "schedule">("write");
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => {
        if (prev === "write") return "analyze";
        if (prev === "analyze") return "schedule";
        return "write";
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const demos = {
    write: {
      title: "AI Writing Assistant",
      subtitle: "Generate viral posts in seconds",
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">Your topic</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Building a SaaS in public</p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full" />
            <div className="pl-4 space-y-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                I quit my $200K job to build a SaaS.
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Everyone thought I was crazy.<br />
                6 months later, here&apos;s what happened:
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                → $0 to $10K MRR<br />
                → 2,000+ users<br />
                → 0 regrets
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-medium">Score: 94/100</span>
              <span className="text-xs px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded-full font-medium">Viral potential</span>
            </div>
            <button className="text-xs text-cyan-600 dark:text-cyan-400 font-medium flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Regenerate
            </button>
          </div>
        </div>
      ),
    },
    analyze: {
      title: "Viral Post Analyzer",
      subtitle: "Learn from what works",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Hook Score", value: "94", max: "100" },
              { label: "Readability", value: "A+", max: "" },
              { label: "Engagement", value: "High", max: "" },
              { label: "Best Time", value: "9 AM", max: "Tue" },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</span>
                  {stat.max && <span className="text-xs text-slate-400">/{stat.max}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">AI Suggestions</p>
            {[
              { check: true, text: "Strong opening hook" },
              { check: true, text: "Clear value proposition" },
              { check: false, text: "Add a question at the end" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {item.check ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-amber-500" />
                )}
                <span className={item.check ? "text-slate-600 dark:text-slate-400" : "text-amber-600 dark:text-amber-400"}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    schedule: {
      title: "Smart Scheduler",
      subtitle: "Post at optimal times",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-500 dark:text-slate-400">Your optimal week</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-medium">AI-optimized</span>
          </div>
          <div className="relative h-28 bg-slate-100 dark:bg-slate-700/30 rounded-lg p-3">
            <div className="absolute bottom-6 left-3 right-3 flex items-end justify-between gap-2">
              {[
                { day: "Mon", h: 60, posts: 1 },
                { day: "Tue", h: 90, posts: 2 },
                { day: "Wed", h: 45, posts: 0 },
                { day: "Thu", h: 100, posts: 2 },
                { day: "Fri", h: 70, posts: 1 },
                { day: "Sat", h: 30, posts: 0 },
                { day: "Sun", h: 20, posts: 0 },
              ].map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="relative w-full">
                    <div
                      className={`w-full rounded-t transition-all ${
                        d.h === 100
                          ? "bg-gradient-to-t from-cyan-500 to-blue-500"
                          : d.h > 60
                          ? "bg-cyan-400/60 dark:bg-cyan-600/60"
                          : "bg-slate-300 dark:bg-slate-600"
                      }`}
                      style={{ height: `${d.h}%`, minHeight: "8px" }}
                    />
                    {d.posts > 0 && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-cyan-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {d.posts}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-sm text-cyan-700 dark:text-cyan-300">Next post: Tuesday 9:00 AM</span>
            </div>
            <span className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">+47% reach</span>
          </div>
        </div>
      ),
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.8 }}
      className="relative"
    >
      <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-violet-500/20 rounded-3xl blur-2xl" />

      <div className="relative bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-400 text-center">
              app.linkedgrow.ai
            </div>
          </div>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>

        <div className="p-4 bg-slate-900">
          <div className="flex gap-1 mb-4 bg-slate-800 rounded-lg p-1">
            {(["write", "analyze", "schedule"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setIsPlaying(false);
                }}
                className={`flex-1 px-3 py-2.5 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab === "write" && <Sparkles className="w-3.5 h-3.5" />}
                {tab === "analyze" && <BarChart3 className="w-3.5 h-3.5" />}
                {tab === "schedule" && <Calendar className="w-3.5 h-3.5" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-5"
            >
              <div className="mb-4">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {demos[activeTab].title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{demos[activeTab].subtitle}</p>
              </div>
              {demos[activeTab].content}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// PAIN POINTS SECTION - Redesigned
// ============================================

function PainPointsSection() {
  const painPoints = [
    {
      icon: Clock,
      stat: "3+ hours",
      title: "Wasted on writing",
      description: "Staring at a blank screen, trying to write something that doesn't sound generic or AI-generated.",
      color: "from-red-500 to-rose-500",
    },
    {
      icon: Eye,
      stat: "0 views",
      title: "The algorithm ignores you",
      description: "You post consistently but get zero engagement. Your content disappears into the void.",
      color: "from-orange-500 to-amber-500",
    },
    {
      icon: CircleDollarSign,
      stat: "$600+/year",
      title: "Overpriced AI tools",
      description: "Other tools charge $50+/month with strict limits. You pay even when you don't use it.",
      color: "from-red-600 to-orange-500",
    },
  ];

  return (
    <section className="relative z-10 py-20 md:py-28 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 mb-6"
          >
            <X className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
            Sound familiar?
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            You know LinkedIn can transform your business. But creating content that actually works? That&apos;s the hard part.
          </p>
        </motion.div>

        {/* Pain Point Cards - Horizontal Layout */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {painPoints.map((pain, i) => (
            <motion.div
              key={pain.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.15 }}
              className="group relative"
            >
              {/* Animated background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${pain.color} opacity-0 group-hover:opacity-10 rounded-3xl blur-xl transition-all duration-500`} />

              {/* Card */}
              <div className="relative h-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden group-hover:border-red-300 dark:group-hover:border-red-800 transition-all">
                {/* Large stat in background */}
                <div className={`absolute -top-4 -right-4 text-8xl font-black bg-gradient-to-br ${pain.color} bg-clip-text text-transparent opacity-10`}>
                  {pain.stat.replace("+", "").replace("/year", "").replace(" hours", "h")}
                </div>

                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pain.color} flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                  <pain.icon className="w-7 h-7 text-white" />
                </div>

                {/* Stat Badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${pain.color} bg-opacity-10 mb-4`}>
                  <span className={`text-sm font-bold bg-gradient-to-r ${pain.color} bg-clip-text text-transparent`}>
                    {pain.stat}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {pain.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {pain.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Transition to Solution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">
              There&apos;s a better way
            </span>
            <ChevronDown className="w-5 h-5 text-emerald-500 animate-bounce" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// FEATURES BENTO GRID
// ============================================

function BentoFeatures() {
  const features = [
    {
      icon: Key,
      title: "Bring Your Own AI Key",
      description: "Connect OpenAI, Claude, or Gemini directly. No markup fees - pay only what you use.",
      highlight: "96% cheaper",
      color: "amber",
      iconBg: "from-amber-500 to-orange-500",
    },
    {
      icon: Brain,
      title: "AI Learns Your Voice",
      description: "Train the AI on your writing style. Every post sounds authentically you.",
      stat: "95%",
      statLabel: "accuracy",
      color: "cyan",
      iconBg: "from-cyan-500 to-blue-500",
    },
    {
      icon: TrendingUp,
      title: "Viral Analytics",
      description: "Real-time scoring predicts engagement before you publish.",
      stat: "91%",
      statLabel: "prediction",
      color: "emerald",
      iconBg: "from-emerald-500 to-green-500",
    },
    {
      icon: FileText,
      title: "Carousel Generator",
      description: "Transform ideas into beautiful PDF carousels that drive engagement.",
      color: "violet",
      iconBg: "from-violet-500 to-purple-500",
    },
    {
      icon: Globe,
      title: "40+ Languages",
      description: "Create content in any language with native-quality translations.",
      color: "blue",
      iconBg: "from-blue-500 to-indigo-500",
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "AI finds your audience's peak hours. Schedule weeks of content.",
      stat: "+47%",
      statLabel: "reach",
      color: "teal",
      iconBg: "from-cyan-500 to-teal-500",
    },
  ];

  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-violet-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 30, rotateX: -10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative"
          >
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.iconBg} rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-500`} />

            <div className="relative h-full bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.iconBg} opacity-5 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500`} />

              <div className="relative mb-5">
                <div className={`absolute inset-0 w-14 h-14 rounded-xl bg-gradient-to-br ${feature.iconBg} opacity-20 blur-lg group-hover:blur-xl transition-all`} />
                <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${feature.iconBg} flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                {feature.description}
              </p>

              {feature.stat && (
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-black bg-gradient-to-r ${feature.iconBg} bg-clip-text text-transparent`}>
                    {feature.stat}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{feature.statLabel}</span>
                </div>
              )}
              {feature.highlight && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${feature.iconBg} text-white text-sm font-semibold shadow-lg`}>
                  <Zap className="w-4 h-4" />
                  {feature.highlight}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// HOW IT WORKS
// ============================================

function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Connect Your AI Key",
      description: "Add your OpenAI, Claude, or Gemini API key. Takes 30 seconds. You pay the AI provider directly.",
      icon: Key,
      color: "from-amber-500 to-orange-500",
      time: "30 sec",
    },
    {
      number: "02",
      title: "Define Your Voice",
      description: "Tell us about your niche, audience, and style. The AI learns to write exactly like you.",
      icon: Target,
      color: "from-cyan-500 to-blue-500",
      time: "2 min",
    },
    {
      number: "03",
      title: "Generate & Refine",
      description: "Create weeks of viral-ready content in minutes. Tweak, regenerate, or approve.",
      icon: Sparkles,
      color: "from-violet-500 to-purple-500",
      time: "5 min",
    },
    {
      number: "04",
      title: "Schedule & Grow",
      description: "AI picks optimal posting times. Schedule ahead, track analytics, watch your audience grow.",
      icon: TrendingUp,
      color: "from-emerald-500 to-green-500",
      time: "2 min",
    },
  ];

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Desktop: Horizontal timeline */}
      <div className="hidden lg:block">
        <div className="absolute top-[60px] left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 via-cyan-500 via-violet-500 to-emerald-500"
            initial={{ width: "0%" }}
            whileInView={{ width: "100%" }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>

        <div className="grid grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.5 }}
              className="relative pt-20"
            >
              <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 + 0.3, type: "spring", stiffness: 200 }}
              >
                <div className={`relative w-[120px] h-[120px] rounded-full bg-gradient-to-br ${step.color} p-1 shadow-xl`}>
                  <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                  </div>
                </div>
                <div className={`absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                  {step.number}
                </div>
              </motion.div>

              <div className="text-center pt-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium mb-3">
                  <Clock className="w-3 h-3" />
                  {step.time}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mobile: Vertical timeline */}
      <div className="lg:hidden relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500 via-cyan-500 via-violet-500 to-emerald-500" />

        <div className="space-y-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="relative pl-20"
            >
              <div className={`absolute left-0 top-0 w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                <step.icon className="w-8 h-8 text-white" />
              </div>

              <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-2xl font-black bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                    {step.number}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{step.title}</h3>
                  <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs">
                    <Clock className="w-3 h-3" />
                    {step.time}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8 }}
        className="mt-12 flex justify-center"
      >
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/30">
          <Rocket className="w-5 h-5" />
          <span className="font-bold">Total setup time: ~10 minutes</span>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// COMPARISON SECTION - Redesigned
// ============================================

function ComparisonSection() {
  const comparisons = [
    { feature: "AI Content Generation", linkedgrow: "Unlimited", others: "50-100/mo", icon: Sparkles },
    { feature: "AI Models Available", linkedgrow: "GPT-4, Claude, Gemini...", others: "1-2 locked", icon: Brain },
    { feature: "Viral Post Analysis", linkedgrow: true, others: false, icon: TrendingUp },
    { feature: "Carousel Generator", linkedgrow: true, others: "Extra $29/mo", icon: FileText },
    { feature: "Smart Scheduling", linkedgrow: true, others: true, icon: Calendar },
    { feature: "Your Data Privacy", linkedgrow: "100% yours", others: "Used for training", icon: Shield },
    { feature: "Monthly Cost", linkedgrow: "$19-79 + ~$4 API", others: "$49-199/mo", icon: CircleDollarSign },
  ];

  return (
    <section className="relative z-10 py-20 md:py-28 px-4 bg-gradient-to-b from-transparent via-slate-100/50 dark:via-slate-900/50 to-transparent">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-6"
          >
            <Award className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
            Why founders choose us
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            The honest comparison they don&apos;t want you to see
          </p>
        </motion.div>

        {/* Comparison Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-red-500/10 rounded-3xl blur-3xl" />

          <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">Feature</div>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold shadow-lg">
                  <Crown className="w-4 h-4" />
                  LinkedGrow
                </div>
              </div>
              <div className="text-center text-sm font-semibold text-slate-400">Others ($50+/mo)</div>
            </div>

            {/* Comparison Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {comparisons.map((row, i) => (
                <motion.div
                  key={row.feature}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="grid grid-cols-3 gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/30 transition-colors">
                      <row.icon className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{row.feature}</span>
                  </div>
                  <div className="flex items-center justify-center">
                    {typeof row.linkedgrow === "boolean" ? (
                      row.linkedgrow ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      ) : (
                        <X className="w-5 h-5 text-red-500" />
                      )
                    ) : (
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">{row.linkedgrow}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center">
                    {typeof row.others === "boolean" ? (
                      row.others ? (
                        <Check className="w-5 h-5 text-slate-400" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                          <X className="w-5 h-5 text-red-500" />
                        </div>
                      )
                    ) : (
                      <span className="text-sm text-slate-500 dark:text-slate-400">{row.others}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="p-6 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {["A", "B", "C"].map((l) => (
                      <div key={l} className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-xs font-bold">
                        {l}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-slate-900 dark:text-white">179 founders</span> made the switch
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                  <BadgeCheck className="w-5 h-5" />
                  Save up to $2,000/year
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// TESTIMONIALS CAROUSEL
// ============================================

function TestimonialsCarousel() {
  const testimonials = [
    { quote: "I went from 200 to 15K followers in 3 months. The viral analysis is insane.", author: "Sarah M.", role: "Marketing Director", metric: "+7,400%" },
    { quote: "Spending $4/month on API calls instead of $99 on other tools. Game changer.", author: "Marcus C.", role: "Startup Founder", metric: "96% savings" },
    { quote: "The carousel generator alone is worth it. Professional slides in minutes.", author: "Elena R.", role: "Content Creator", metric: "+340%" },
    { quote: "Finally an AI that writes in MY voice. My audience can't tell the difference.", author: "James L.", role: "Tech CEO", metric: "+520%" },
    { quote: "Went from posting weekly to daily. Engagement through the roof.", author: "Priya S.", role: "SaaS Founder", metric: "+890%" },
    { quote: "The scheduling AI is scary accurate. Posts always hit peak engagement.", author: "David K.", role: "Consultant", metric: "+210%" },
    { quote: "Saved 15 hours per week on content creation. ROI is incredible.", author: "Lisa T.", role: "Agency Owner", metric: "15h saved" },
    { quote: "Best investment for my LinkedIn growth. Paid for itself in the first week.", author: "Tom R.", role: "B2B Sales", metric: "5x ROI" },
  ];

  return (
    <div className="relative overflow-hidden py-4">
      <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent z-10" />

      {[0, 1, 2].map((rowIndex) => (
        <motion.div
          key={rowIndex}
          animate={{ x: rowIndex % 2 === 0 ? [0, -2000] : [-2000, 0] }}
          transition={{ duration: 50 + rowIndex * 10, repeat: Infinity, ease: "linear" }}
          className="flex gap-4 mb-4"
        >
          {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[380px] bg-white dark:bg-slate-800/80 rounded-2xl p-4 md:p-5 border border-slate-200/50 dark:border-slate-700/50"
            >
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 line-clamp-3">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                    rowIndex === 0 ? "from-cyan-500 to-blue-600" :
                    rowIndex === 1 ? "from-violet-500 to-purple-600" :
                    "from-emerald-500 to-teal-600"
                  } flex items-center justify-center text-white text-sm font-bold`}>
                    {t.author.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{t.author}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                  </div>
                </div>
                <p className={`text-lg font-bold ${
                  rowIndex === 0 ? "text-cyan-600 dark:text-cyan-400" :
                  rowIndex === 1 ? "text-violet-600 dark:text-violet-400" :
                  "text-emerald-600 dark:text-emerald-400"
                }`}>{t.metric}</p>
              </div>
            </div>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

// ============================================
// PRICING PREVIEW
// ============================================

function PricingPreview() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect to try it out",
      features: ["3 posts/month", "Basic editor", "BYOK support"],
      highlight: false,
    },
    {
      name: "Starter",
      price: "$19",
      originalPrice: "$27",
      period: "/month",
      description: "For regular creators",
      features: ["Unlimited posts", "10 scheduled posts", "Content calendar", "AI voice training"],
      highlight: false,
    },
    {
      name: "Pro",
      price: "$39",
      originalPrice: "$56",
      period: "/month",
      description: "For serious growth",
      features: ["Everything in Starter", "Unlimited scheduling", "AI image generation", "Carousel creator", "Analytics dashboard"],
      highlight: true,
      badge: "Most Popular",
    },
    {
      name: "Business",
      price: "$79",
      originalPrice: "$113",
      period: "/month",
      description: "For teams & agencies",
      features: ["Everything in Pro", "A/B testing", "API access", "Priority support", "Team collaboration"],
      highlight: false,
    },
  ];

  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium">
          <Key className="w-4 h-4" />
          <span>All plans + ~$3-5/month in AI API costs (you pay the AI provider directly)</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            className={`relative ${plan.highlight ? "lg:-mt-4 lg:mb-4" : ""}`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <div className="px-4 py-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold shadow-lg">
                  {plan.badge}
                </div>
              </div>
            )}

            <div className={`relative h-full rounded-2xl p-6 border-2 transition-all ${
              plan.highlight
                ? "bg-gradient-to-b from-violet-50 to-white dark:from-violet-950/50 dark:to-slate-900 border-violet-300 dark:border-violet-700 shadow-xl shadow-violet-500/20"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            }`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{plan.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{plan.description}</p>

              <div className="flex items-baseline gap-2 mb-6">
                {plan.originalPrice && (
                  <span className="text-lg text-slate-400 line-through">{plan.originalPrice}</span>
                )}
                <span className="text-4xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                <span className="text-slate-500 dark:text-slate-400">{plan.period}</span>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlight ? "text-violet-500" : "text-emerald-500"}`} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="text-center mt-8"
      >
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <span className="font-bold text-emerald-600 dark:text-emerald-400">Early access pricing shown.</span>
          {" "}Join the waitlist to lock in 30% off for your first year.
        </p>
      </motion.div>
    </div>
  );
}

// ============================================
// FAQ SECTION
// ============================================

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "What does \"Bring Your Own AI Key\" mean?",
      a: "Instead of paying us inflated fees for AI, you connect your own API key from OpenAI, Anthropic (Claude), or Google (Gemini). You pay the AI provider directly at their rates - typically $3-5/month for average usage.",
    },
    {
      q: "What's the total cost of using LinkedGrow?",
      a: "You pay a platform subscription fee to LinkedGrow (see pricing) plus your actual AI API usage which averages $3-5/month. This is 80-90% cheaper than competitors who charge $50-200/month.",
    },
    {
      q: "Is this safe to use with LinkedIn?",
      a: "Yes. LinkedGrow doesn't automate LinkedIn interactions or violate their terms. We help you create content that you then post manually or schedule through LinkedIn's native tools.",
    },
    {
      q: "Will my posts sound like generic AI content?",
      a: "No. Our AI learns your unique writing style, tone, and vocabulary. The result is content that sounds like you wrote it - because you guided the AI to do so.",
    },
    {
      q: "How is this different from ChatGPT?",
      a: "LinkedGrow is purpose-built for LinkedIn with viral content formulas, engagement analysis, optimal posting times, carousel generators, and scheduling - all optimized for LinkedIn's algorithm.",
    },
    {
      q: "Can I try before committing?",
      a: "Yes. We offer a free tier so you can test the platform. You'll just need to add your own AI API key to generate content, which typically costs pennies per post.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03 }}
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full text-left bg-white dark:bg-slate-800/80 rounded-xl p-5 border border-slate-200/50 dark:border-slate-700/50 hover:border-cyan-300 dark:hover:border-cyan-700 transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold text-slate-900 dark:text-white text-left">{faq.q}</h3>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${openIndex === i ? "rotate-180" : ""}`} />
              </div>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// FINAL CTA SECTION - Redesigned
// ============================================

function FinalCTA({ timeLeft, email, setEmail, handleSubmit, isLoading, isSuccess, error }: {
  timeLeft: { days: number; hours: number; minutes: number; seconds: number };
  email: string;
  setEmail: (email: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isSuccess: boolean;
  error: string;
}) {
  return (
    <section className="relative z-10 py-20 md:py-28 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Animated background layers */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 rounded-[2.5rem] blur-2xl opacity-30 animate-pulse" />
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 rounded-[2rem] opacity-50" />

          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] overflow-hidden">
            {/* Animated grid background */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                backgroundSize: "32px 32px",
              }} />
            </div>

            {/* Floating orbs */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-cyan-500/30 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-violet-500/30 rounded-full blur-[100px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />

            <div className="relative z-10 p-8 md:p-12 lg:p-16">
              {/* Top Badge */}
              <div className="flex justify-center mb-8">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-4 px-5 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-50" />
                      <Gift className="relative w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="font-bold text-emerald-400 text-sm md:text-base">EARLY ACCESS</span>
                  </div>
                  <div className="w-px h-5 bg-white/20" />
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-white/60" />
                    <span className="text-white/80 text-sm">Only <span className="font-bold text-white">153</span> spots left</span>
                  </div>
                </motion.div>
              </div>

              {/* Headline */}
              <div className="text-center max-w-3xl mx-auto mb-10">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight"
                >
                  Ready to 10x your
                  <br />
                  <span className="relative inline-block">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400">
                      LinkedIn growth?
                    </span>
                    <motion.div
                      className="absolute -inset-1 bg-gradient-to-r from-cyan-400/20 to-violet-400/20 rounded-lg blur-xl -z-10"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-lg md:text-xl text-slate-300"
                >
                  Join the waitlist and lock in <span className="font-bold text-white">30% off</span> for your first year.
                  <br className="hidden sm:block" />
                  This deal disappears at launch.
                </motion.p>
              </div>

              {/* Countdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex justify-center gap-3 sm:gap-4 mb-10"
              >
                {[
                  { value: timeLeft.days, label: "Days" },
                  { value: timeLeft.hours, label: "Hours" },
                  { value: timeLeft.minutes, label: "Min" },
                  { value: timeLeft.seconds, label: "Sec" },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 rounded-2xl blur-lg" />
                      <div className="relative w-16 sm:w-20 h-16 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                        <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
                          {String(item.value).padStart(2, "0")}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-medium">{item.label}</p>
                  </div>
                ))}
              </motion.div>

              {/* Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="max-w-lg mx-auto"
              >
                {!isSuccess ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-2xl blur opacity-30" />
                      <div className="relative flex flex-col sm:flex-row gap-3 p-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="flex-1 h-12 md:h-14 px-5 rounded-xl bg-white/10 border-0 text-white placeholder:text-slate-400 text-base focus:ring-2 focus:ring-cyan-500"
                        />
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="h-12 md:h-14 px-8 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base shadow-lg shadow-cyan-500/30 whitespace-nowrap"
                        >
                          {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              Get 30% Off
                              <ArrowRight className="w-5 h-5 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <p className="text-center text-sm text-slate-400">
                      Join 179 founders - No spam - Unsubscribe anytime
                    </p>
                  </form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-8 text-center backdrop-blur-sm"
                  >
                    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500 flex items-center justify-center mb-4">
                      <Check className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">You&apos;re on the list!</h3>
                    <p className="text-slate-300">Your 30% discount is locked in. Check your inbox!</p>
                  </motion.div>
                )}
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap justify-center gap-6 mt-10 pt-10 border-t border-white/10"
              >
                {[
                  { icon: Shield, text: "Bank-level security" },
                  { icon: Key, text: "Your API, your data" },
                  { icon: RefreshCw, text: "Cancel anytime" },
                  { icon: Heart, text: "Made with love in Switzerland" },
                ].map((badge) => (
                  <div key={badge.text} className="flex items-center gap-2 text-slate-400 text-sm">
                    <badge.icon className="w-4 h-4" />
                    <span>{badge.text}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function PreLaunchPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [heroVariant, setHeroVariant] = useState<1 | 2 | 3 | 4>(1); // Change this to preview different heroes
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  const LAUNCH_DATE = new Date("2026-02-01T00:00:00Z");
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setIsMounted(true);
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const distance = LAUNCH_DATE.getTime() - now;
      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to subscribe");
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const heroProps: HeroProps = {
    email,
    setEmail,
    handleSubmit,
    isLoading,
    isSuccess,
    error,
    isMounted,
  };

  // Hero selector for development - remove in production
  const HeroSelector = () => (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Hero Variant:</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((v) => (
          <button
            key={v}
            onClick={() => setHeroVariant(v as 1 | 2 | 3 | 4)}
            className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
              heroVariant === v
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Hero Selector - REMOVE THIS IN PRODUCTION */}
      <HeroSelector />

      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-100/30 dark:from-cyan-900/10 via-transparent to-transparent" />
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Urgency Banner */}
      <div className="relative z-20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-3 px-4 border-b border-slate-700">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-cyan-400">EARLY ACCESS</span>
          </div>
          <span className="text-slate-300 text-sm sm:text-base">
            Join the waitlist → <span className="font-bold text-white">30% OFF</span> for your first year
          </span>
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-slate-400">|</span>
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 font-mono">{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m</span>
          </div>
        </div>
      </div>

      <PrelaunchHeader showCountdown timeLeft={timeLeft} />

      {/* Hero Section - Switch between variants */}
      <motion.div ref={heroRef} style={{ opacity: heroOpacity, scale: heroScale }}>
        {heroVariant === 1 && <HeroVariant1 {...heroProps} />}
        {heroVariant === 2 && <HeroVariant2 {...heroProps} />}
        {heroVariant === 3 && <HeroVariant3 {...heroProps} />}
        {heroVariant === 4 && <HeroVariant4 {...heroProps} />}
      </motion.div>

      {/* Pain Points Section */}
      <PainPointsSection />

      {/* Features Bento Grid */}
      <section className="relative z-10 py-20 md:py-28 px-4 bg-gradient-to-b from-transparent via-cyan-50/50 dark:via-cyan-950/20 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 mb-6"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Your complete LinkedIn growth engine
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              AI-powered content creation that writes like you, costs almost nothing, and actually drives results.
            </p>
          </motion.div>

          <BentoFeatures />
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-20 md:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              How it works
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400">
              From zero to viral in 4 simple steps
            </p>
          </motion.div>

          <HowItWorks />
        </div>
      </section>

      {/* Comparison Section */}
      <ComparisonSection />

      {/* Testimonials Carousel */}
      <section className="relative z-10 py-20 md:py-28 px-0">
        <div className="max-w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 px-4"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Real results from real founders
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400">
              Beta testers are already seeing incredible growth
            </p>
          </motion.div>

          <TestimonialsCarousel />
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="relative z-10 py-20 md:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 mb-6"
            >
              <Gift className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Choose the plan that fits your growth goals. Prices shown include the 30% early access discount.
            </p>
          </motion.div>

          <PricingPreview />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-20 md:py-28 px-4 bg-gradient-to-b from-transparent via-slate-100/50 dark:via-slate-900/50 to-transparent">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Questions? We&apos;ve got answers
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400">
              Everything you need to know about LinkedGrow
            </p>
          </motion.div>

          <FAQSection />
        </div>
      </section>

      {/* Final CTA */}
      <FinalCTA
        timeLeft={timeLeft}
        email={email}
        setEmail={setEmail}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        isSuccess={isSuccess}
        error={error}
      />

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800 py-8 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
          <div>&copy; 2026 LinkedGrow. All rights reserved.</div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/cookies" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
