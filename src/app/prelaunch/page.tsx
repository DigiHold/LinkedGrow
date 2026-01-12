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
  Flame,
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
  MessageSquare,
  X,
  Star,
  Calendar,
  FileText,
  Globe,
  Key,
  Mic,
  Shield,
  RefreshCw,
} from "lucide-react";
import { PrelaunchHeader } from "@/components/prelaunch/prelaunch-header";

// Slower typewriter effect - always on second line
function TypewriterText({ texts }: { texts: string[] }) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentFullText = texts[currentTextIndex];
    const typeSpeed = isDeleting ? 40 : 100; // Slower typing
    const pauseTime = 3000; // Longer pause to read

    if (!isDeleting && displayText === currentFullText) {
      setTimeout(() => setIsDeleting(true), pauseTime);
      return;
    }

    if (isDeleting && displayText === "") {
      setIsDeleting(false);
      setCurrentTextIndex((prev) => (prev + 1) % texts.length);
      return;
    }

    const timeout = setTimeout(() => {
      setDisplayText((prev) =>
        isDeleting ? prev.slice(0, -1) : currentFullText.slice(0, prev.length + 1)
      );
    }, typeSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentTextIndex, texts]);

  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500">
      {displayText}
      <span className="animate-pulse text-cyan-500">|</span>
    </span>
  );
}

// Logo marquee component
function LogoMarquee() {
  const logos = [
    { name: "TechCrunch", icon: "TC" },
    { name: "Forbes", icon: "F" },
    { name: "Entrepreneur", icon: "E" },
    { name: "Inc.", icon: "Inc" },
    { name: "Fast Company", icon: "FC" },
    { name: "Wired", icon: "W" },
    { name: "Bloomberg", icon: "B" },
    { name: "Business Insider", icon: "BI" },
  ];

  return (
    <div className="relative overflow-hidden py-8">
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent z-10" />
      <motion.div
        animate={{ x: [0, -1920] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="flex gap-16 items-center"
      >
        {[...logos, ...logos, ...logos, ...logos].map((logo, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-slate-400 dark:text-slate-600 whitespace-nowrap"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-sm">
              {logo.icon}
            </div>
            <span className="text-lg font-semibold">{logo.name}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// Interactive demo mockup - improved content
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
    }, 5000); // Slower to let users absorb
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
              <p className="text-sm text-slate-600 dark:text-slate-400">
                The 5 lessons that changed everything 🧵
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
              { label: "Hook Score", value: "94", max: "100", color: "emerald" },
              { label: "Readability", value: "A+", max: "", color: "cyan" },
              { label: "Engagement Prediction", value: "High", max: "", color: "violet" },
              { label: "Best Time to Post", value: "9 AM", max: "Tue", color: "blue" },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.value}</span>
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
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-violet-500/20 rounded-3xl blur-2xl" />

      {/* Browser frame */}
      <div className="relative bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
        {/* Browser header */}
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

        {/* App content */}
        <div className="p-4 bg-slate-900">
          {/* Tabs */}
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

          {/* Content */}
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

// Bento grid for features
function BentoFeatures() {
  const features = [
    {
      icon: Key,
      title: "Bring Your Own AI",
      description: "Use OpenAI, Claude, or Gemini. No markup fees - pay only what you use.",
      stat: "~$3/mo",
      statLabel: "avg cost",
      size: "large",
      gradient: "from-amber-500 to-orange-500",
    },
    {
      icon: Brain,
      title: "AI That Learns You",
      description: "Train on your voice. Every post sounds like you wrote it.",
      stat: "95%",
      statLabel: "voice match",
      size: "medium",
      gradient: "from-cyan-500 to-blue-500",
    },
    {
      icon: TrendingUp,
      title: "Viral Analytics",
      description: "Real-time scoring predicts post performance before you publish.",
      stat: "91%",
      statLabel: "accuracy",
      size: "medium",
      gradient: "from-emerald-500 to-green-500",
    },
    {
      icon: FileText,
      title: "Carousel Generator",
      description: "Turn ideas into beautiful PDF carousels in minutes.",
      size: "small",
      gradient: "from-violet-500 to-purple-500",
    },
    {
      icon: Globe,
      title: "40+ Languages",
      description: "Create content in any language with native quality.",
      size: "small",
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      icon: Mic,
      title: "Voice to Post",
      description: "Record a memo, get a polished post.",
      size: "small",
      gradient: "from-pink-500 to-rose-500",
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "AI finds your audience's peak hours. Auto-schedule weeks ahead.",
      stat: "+47%",
      statLabel: "more reach",
      size: "medium",
      gradient: "from-cyan-500 to-teal-500",
    },
    {
      icon: MessageSquare,
      title: "First Comment Magic",
      description: "Auto-post strategic first comments with CTAs.",
      stat: "+50%",
      statLabel: "engagement",
      size: "medium",
      gradient: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {features.map((feature, i) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          className={`group relative rounded-2xl overflow-hidden ${
            feature.size === "large" ? "col-span-2 row-span-2" : feature.size === "medium" ? "col-span-2 md:col-span-1" : ""
          }`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
          <div className="relative h-full bg-white dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-2xl p-5 hover:border-cyan-300 dark:hover:border-cyan-700 transition-all">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <feature.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">{feature.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{feature.description}</p>
            {feature.stat && (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{feature.stat}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{feature.statLabel}</span>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Auto-scrolling testimonials
function TestimonialsCarousel() {
  const testimonials = [
    { quote: "I went from 200 to 15K followers in 3 months. The viral analysis feature is insane.", author: "Sarah M.", role: "Marketing Director", metric: "+7,400%", avatar: "SM" },
    { quote: "Spending $4/month on API calls instead of $99 on other tools. Game changer.", author: "Marcus C.", role: "Startup Founder", metric: "96% savings", avatar: "MC" },
    { quote: "The carousel generator alone is worth it. Professional slides in minutes.", author: "Elena R.", role: "Content Creator", metric: "+340%", avatar: "ER" },
    { quote: "Finally an AI that writes in MY voice. My audience can't tell the difference.", author: "James L.", role: "Tech CEO", metric: "+520%", avatar: "JL" },
    { quote: "Went from posting weekly to daily. Engagement through the roof.", author: "Priya S.", role: "SaaS Founder", metric: "+890%", avatar: "PS" },
    { quote: "The scheduling AI is scary accurate. My posts now always hit peak engagement.", author: "David K.", role: "Consultant", metric: "+210%", avatar: "DK" },
  ];

  return (
    <div className="relative overflow-hidden py-4">
      {/* Gradient masks */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent z-10" />

      {/* First row - scrolling left */}
      <motion.div
        animate={{ x: [0, -1500] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="flex gap-4 mb-4"
      >
        {[...testimonials, ...testimonials].map((t, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[350px] bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50"
          >
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">&ldquo;{t.quote}&rdquo;</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">{t.author}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{t.metric}</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Second row - scrolling right */}
      <motion.div
        animate={{ x: [-1500, 0] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="flex gap-4"
      >
        {[...testimonials.slice(3), ...testimonials.slice(0, 3), ...testimonials.slice(3), ...testimonials.slice(0, 3)].map((t, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[350px] bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50"
          >
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">&ldquo;{t.quote}&rdquo;</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">{t.author}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{t.metric}</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// How it works section
function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Connect Your AI",
      description: "Add your OpenAI, Claude, or Gemini API key. Takes 30 seconds.",
      icon: Key,
    },
    {
      number: "02",
      title: "Tell Us About You",
      description: "Share your niche, audience, and writing style. AI learns your voice.",
      icon: Target,
    },
    {
      number: "03",
      title: "Generate & Schedule",
      description: "Create weeks of content in minutes. AI schedules at optimal times.",
      icon: Calendar,
    },
    {
      number: "04",
      title: "Watch It Grow",
      description: "Track analytics, iterate on what works, and scale your presence.",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="relative">
      {/* Connection line */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 hidden lg:block" style={{ transform: "translateY(-50%)" }} />

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((step, i) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-4xl font-black text-slate-200 dark:text-slate-700">{step.number}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Comparison table
function ComparisonSection() {
  const comparisons = [
    { feature: "AI Content Generation", linkedgrow: "Unlimited", others: "50-100/mo" },
    { feature: "Monthly AI Cost", linkedgrow: "~$3 (your API)", others: "$49-199" },
    { feature: "AI Models Available", linkedgrow: "GPT-4, Claude, Gemini...", others: "1-2 locked models" },
    { feature: "Viral Post Analysis", linkedgrow: true, others: false },
    { feature: "Carousel Generator", linkedgrow: true, others: "Extra $29/mo" },
    { feature: "Smart Scheduling", linkedgrow: true, others: true },
    { feature: "Voice to Post", linkedgrow: true, others: false },
    { feature: "Your Data Privacy", linkedgrow: "100% yours", others: "Used for training" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-3xl" />
      <div className="relative bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">Feature</div>
          <div className="text-center">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-cyan-600 dark:text-cyan-400">
              <Sparkles className="w-4 h-4" />
              LinkedGrow
            </span>
          </div>
          <div className="text-center text-sm font-semibold text-slate-400">Other Tools</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {comparisons.map((row, i) => (
            <motion.div
              key={row.feature}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className="grid grid-cols-3 gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="text-sm text-slate-700 dark:text-slate-300">{row.feature}</div>
              <div className="text-center">
                {typeof row.linkedgrow === "boolean" ? (
                  row.linkedgrow ? (
                    <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-red-500 mx-auto" />
                  )
                ) : (
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{row.linkedgrow}</span>
                )}
              </div>
              <div className="text-center">
                {typeof row.others === "boolean" ? (
                  row.others ? (
                    <Check className="w-5 h-5 text-slate-400 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-red-400 mx-auto" />
                  )
                ) : (
                  <span className="text-sm text-slate-500 dark:text-slate-400">{row.others}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// FAQ Section
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "What does \"Bring Your Own AI Key\" mean?",
      a: "Instead of paying us $50+/month for AI, you use your own API key from OpenAI, Anthropic (Claude), or Google (Gemini). You pay the AI provider directly - usually $3-5/month for typical usage. No middleman markup.",
    },
    {
      q: "How is this different from other LinkedIn tools?",
      a: "Most tools lock you into expensive subscriptions with limited generations. We charge a flat platform fee, and you pay only what you use for AI. Plus, we analyze viral content to help you write posts that actually perform.",
    },
    {
      q: "Will posts sound like me or like AI?",
      a: "Like you. Our AI learns your writing style, tone, and vocabulary. We analyze your best-performing content to understand what makes YOUR voice unique. The result? Posts that sound authentically you.",
    },
    {
      q: "What's included in the founder's discount?",
      a: "Early supporters get 30% off for their entire first year. This includes all features: AI writing, carousel generator, scheduling, analytics, and unlimited content generation (you just pay your API costs).",
    },
    {
      q: "When does LinkedGrow launch?",
      a: "We're launching January 26, 2026. Join the waitlist now to lock in your founder's discount and get early access before the public launch.",
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
            transition={{ delay: i * 0.05 }}
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full text-left bg-white dark:bg-slate-800/80 rounded-xl p-5 border border-slate-200/50 dark:border-slate-700/50 hover:border-cyan-300 dark:hover:border-cyan-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white pr-4">{faq.q}</h3>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openIndex === i ? "rotate-180" : ""}`} />
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

// Final CTA Section
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
    <section className="relative z-10 py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Multi-layer glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-violet-500/30 rounded-[2.5rem] blur-2xl" />
          <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-violet-500/20 rounded-[2rem] blur-xl" />

          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                  backgroundSize: "40px 40px",
                }} />
              </div>
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 p-8 md:p-16">
              {/* Badge */}
              <div className="flex justify-center mb-8">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className="flex items-center gap-1">
                    <Flame className="w-5 h-5 text-orange-400" />
                    <span className="font-bold text-orange-400">FOUNDER&apos;S DEAL</span>
                  </div>
                  <div className="w-px h-4 bg-white/20" />
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-white/60" />
                    <span className="text-white/80 text-sm">Only 153 spots left</span>
                  </div>
                </div>
              </div>

              {/* Headline */}
              <div className="text-center max-w-2xl mx-auto mb-10">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4">
                  Ready to 10x your
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400">
                    LinkedIn growth?
                  </span>
                </h2>
                <p className="text-lg text-slate-300">
                  Join now and lock in <span className="font-bold text-white">30% off</span> for your entire first year.
                  <br />
                  This deal disappears at launch.
                </p>
              </div>

              {/* Countdown */}
              <div className="flex justify-center gap-3 sm:gap-4 mb-10">
                {[
                  { value: timeLeft.days, label: "Days" },
                  { value: timeLeft.hours, label: "Hours" },
                  { value: timeLeft.minutes, label: "Min" },
                  { value: timeLeft.seconds, label: "Sec" },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                      <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
                        {String(item.value).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Form */}
              <div className="max-w-lg mx-auto">
                {!isSuccess ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="flex-1 h-14 px-5 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-slate-400 text-base focus:bg-white/20"
                      />
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="h-14 px-8 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base shadow-lg shadow-cyan-500/30 whitespace-nowrap"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            Claim 30% Off
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <p className="text-center text-sm text-slate-400">
                      Join 179 founders • No spam, ever • Unsubscribe anytime
                    </p>
                  </form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-8 text-center"
                  >
                    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500 flex items-center justify-center mb-4">
                      <Check className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">You&apos;re on the list!</h3>
                    <p className="text-slate-300">Your 30% founder discount is locked in. Check your inbox!</p>
                  </motion.div>
                )}
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap justify-center gap-6 mt-10 pt-10 border-t border-white/10">
                {[
                  { icon: Shield, text: "Bank-level security" },
                  { icon: Key, text: "Your API, your data" },
                  { icon: RefreshCw, text: "Cancel anytime" },
                ].map((badge) => (
                  <div key={badge.text} className="flex items-center gap-2 text-slate-400 text-sm">
                    <badge.icon className="w-4 h-4" />
                    <span>{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function PreLaunchPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  // Fixed launch date
  const LAUNCH_DATE = new Date("2026-01-26T00:00:00Z");
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

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
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
            <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
            <span className="font-bold text-orange-400">FOUNDER&apos;S DEAL</span>
          </div>
          <span className="text-slate-300">
            Join now → <span className="font-bold text-white">30% OFF</span> for your first year
          </span>
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-slate-400">|</span>
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 font-mono">{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m</span>
          </div>
        </div>
      </div>

      <PrelaunchHeader showCountdown timeLeft={timeLeft} />

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative z-10 pt-8 pb-16 px-4"
      >
        <div className="max-w-6xl mx-auto">
          {/* Social proof badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50">
              <div className="flex -space-x-2">
                {["A", "B", "C", "D"].map((letter) => (
                  <div key={letter} className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 border-2 border-white dark:border-slate-800 flex items-center justify-center text-white text-xs font-bold">
                    {letter}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <span className="font-bold text-slate-900 dark:text-white">179 founders</span>
                <span className="text-slate-500 dark:text-slate-400"> already joined</span>
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Headline - fixed structure */}
          <div className="text-center max-w-4xl mx-auto mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-6"
            >
              Stop struggling to
              <br />
              <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
                {isMounted ? (
                  <TypewriterText texts={["write LinkedIn posts", "get real engagement", "go viral consistently", "grow your audience"]} />
                ) : (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500">write LinkedIn posts</span>
                )}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8"
            >
              LinkedGrow analyzes viral content, generates posts in your voice, and costs{" "}
              <span className="font-bold text-slate-900 dark:text-white">96% less</span> than other AI tools.
              No subscription limits. Just results.
            </motion.p>

            {/* CTA inline form - fixed sizing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-xl mx-auto"
            >
              {!isSuccess ? (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 px-5 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-base sm:flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-14 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-base shadow-lg shadow-cyan-500/30 whitespace-nowrap"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Get Early Access <ChevronRight className="w-5 h-5 ml-1" /></>}
                  </Button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 text-center"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500 flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">You&apos;re on the list!</h3>
                  <p className="text-slate-600 dark:text-slate-400">Your 30% founder discount is locked in. Check your inbox!</p>
                </motion.div>
              )}
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                Join 179 founders • 30% off locked in • No spam, ever
              </p>
            </motion.div>
          </div>

          {/* Interactive Demo */}
          <div className="max-w-3xl mx-auto">
            <DemoPreview />
          </div>
        </div>
      </motion.section>

      {/* Logo Marquee */}
      <section className="relative z-10 py-8 border-y border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-4">Trusted by creators featured in</p>
          <LogoMarquee />
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium mb-4">
              <X className="w-4 h-4" />
              The LinkedIn Content Struggle
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Sound familiar?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              You know LinkedIn is a goldmine for your business. But creating content feels like pulling teeth.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Hours wasted writing", description: "Staring at a blank screen, trying to write something that doesn't sound generic.", stat: "3h+" },
              { title: "No engagement", description: "You post consistently but the algorithm ignores you. Zero likes, zero comments.", stat: "0%" },
              { title: "Expensive tools", description: "AI writing tools cost $50+/month with strict limits. You pay even when you don't use it.", stat: "$600/yr" },
            ].map((pain, i) => (
              <motion.div
                key={pain.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100" />
                <div className="relative bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 hover:border-red-300 dark:hover:border-red-700 transition-all">
                  <div className="text-4xl font-black text-red-500/20 dark:text-red-400/20 mb-2">{pain.stat}</div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{pain.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{pain.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="relative z-10 py-24 px-4 bg-gradient-to-b from-transparent via-cyan-50/50 dark:via-cyan-950/20 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Introducing LinkedGrow
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Everything you need to dominate LinkedIn
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              An AI-powered content engine that writes like you, costs almost nothing, and actually gets results.
            </p>
          </motion.div>

          <BentoFeatures />
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-24 px-4">
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
            <p className="text-lg text-slate-600 dark:text-slate-400">
              From zero to viral in 4 simple steps
            </p>
          </motion.div>

          <HowItWorks />
        </div>
      </section>

      {/* Comparison Section */}
      <section className="relative z-10 py-24 px-4 bg-gradient-to-b from-transparent via-slate-100/50 dark:via-slate-900/50 to-transparent">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Why founders choose us
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              The honest comparison they don&apos;t want you to see
            </p>
          </motion.div>

          <ComparisonSection />
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Real results from real founders
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Beta testers are already seeing incredible growth
            </p>
          </motion.div>

          <TestimonialsCarousel />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-24 px-4 bg-gradient-to-b from-transparent via-slate-100/50 dark:via-slate-900/50 to-transparent">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Frequently asked questions
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
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
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
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
