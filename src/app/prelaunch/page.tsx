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
  Quote,
  Zap,
  Target,
  Brain,
  Sparkles,
  TrendingUp,
  BarChart3,
  MessageSquare,
  X,
} from "lucide-react";
import { PrelaunchHeader } from "@/components/prelaunch/prelaunch-header";

// Animated typing effect for hero
function TypewriterText({ texts, className }: { texts: string[]; className?: string }) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentFullText = texts[currentTextIndex];
    const typeSpeed = isDeleting ? 30 : 80;
    const pauseTime = 2000;

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
    <span className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
}

// Pain point card with hover effect
function PainCard({ pain, index }: { pain: { title: string; description: string; stat: string }; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100" />
      <div className="relative bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 hover:border-red-300 dark:hover:border-red-700 transition-all">
        <div className="text-4xl font-black text-red-500/20 dark:text-red-400/20 mb-2">{pain.stat}</div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{pain.title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">{pain.description}</p>
      </div>
    </motion.div>
  );
}

// Solution card with icon
function SolutionCard({ solution, index }: { solution: { icon: React.ElementType; title: string; description: string; highlight: string }; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all" />
      <div className="relative h-full bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 hover:border-cyan-300 dark:hover:border-cyan-700 transition-all">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <solution.icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{solution.title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{solution.description}</p>
        <div className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 px-2 py-1 rounded-full">
          <Sparkles className="w-3 h-3" />
          {solution.highlight}
        </div>
      </div>
    </motion.div>
  );
}

// Interactive demo mockup
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
    }, 3000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const demos = {
    write: {
      title: "AI Writing Assistant",
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Brain className="w-4 h-4" />
            <span>Generating hook...</span>
          </div>
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg p-4 border-l-4 border-cyan-500">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="font-semibold">Stop scrolling.</span><br /><br />
              I spent 6 months posting daily on LinkedIn.<br />
              Zero engagement. Zero leads.<br /><br />
              Then I discovered something that changed everything...
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">Hook Score: 94</span>
            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">Engagement: High</span>
          </div>
        </div>
      ),
    },
    analyze: {
      title: "Viral Post Analyzer",
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <TrendingUp className="w-4 h-4" />
            <span>Analyzing top posts...</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Avg. Engagement", value: "12.4K", change: "+340%" },
              { label: "Best Time", value: "9:00 AM", change: "Tue" },
              { label: "Hook Type", value: "Story", change: "Top 5%" },
              { label: "CTA Style", value: "Question", change: "+89%" },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{stat.change}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    schedule: {
      title: "Smart Scheduler",
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <BarChart3 className="w-4 h-4" />
            <span>Optimal times calculated</span>
          </div>
          <div className="relative h-32 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-1">
              {[40, 65, 85, 95, 70, 50, 30].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t transition-all ${i === 3 ? "bg-gradient-to-t from-cyan-500 to-blue-500" : "bg-slate-200 dark:bg-slate-700"}`}
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[10px] text-slate-400">{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Best day: <span className="font-semibold text-cyan-600 dark:text-cyan-400">Thursday 9AM</span></span>
            <span className="text-emerald-600 dark:text-emerald-400">+47% reach</span>
          </div>
        </div>
      ),
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
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
                className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
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
              className="bg-white dark:bg-slate-800 rounded-xl p-4 min-h-[200px]"
            >
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                {demos[activeTab].title}
              </h4>
              {demos[activeTab].content}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// Testimonial with video-like appearance
function TestimonialCard({ testimonial, index }: { testimonial: { quote: string; author: string; role: string; company: string; metric: string; avatar: string }; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all" />
      <div className="relative bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 h-full">
        <Quote className="w-8 h-8 text-cyan-500/20 mb-4" />
        <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
              {testimonial.avatar}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{testimonial.author}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{testimonial.role}, {testimonial.company}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{testimonial.metric}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">growth</p>
          </div>
        </div>
      </div>
    </motion.div>
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
              transition={{ delay: i * 0.05 }}
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

export default function PreLaunchPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
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
        body: JSON.stringify({ email, name }),
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

  const pains = [
    { title: "Hours wasted writing", description: "Staring at a blank screen, trying to write something that doesn't sound generic.", stat: "3h+" },
    { title: "No engagement", description: "You post consistently but the algorithm ignores you. Zero likes, zero comments.", stat: "0%" },
    { title: "Expensive tools", description: "AI writing tools cost $50+/month with strict limits. You pay even when you don't use it.", stat: "$600/yr" },
  ];

  const solutions = [
    { icon: Brain, title: "AI That Knows Your Voice", description: "Train the AI on your style. Every post sounds authentically you, not like a robot.", highlight: "Zero generic content" },
    { icon: Target, title: "Viral Post DNA", description: "Analyze what makes top posts go viral. Copy proven frameworks, not guesswork.", highlight: "Data-driven hooks" },
    { icon: Zap, title: "10x Faster Creation", description: "From idea to published post in under 5 minutes. Batch create a week's content in one session.", highlight: "15 min vs 3 hours" },
    { icon: MessageSquare, title: "BYOK = Unlimited", description: "Bring your own AI key. No monthly limits, no per-post fees. Pay only what you use.", highlight: "~$3/month average" },
  ];

  const testimonials = [
    { quote: "I went from 200 to 15K followers in 3 months. The viral analysis feature is insane - it's like having a growth strategist on demand.", author: "Sarah Mitchell", role: "Marketing Director", company: "TechCorp", metric: "+7,400%", avatar: "SM" },
    { quote: "Finally, an AI tool that doesn't break the bank. I'm spending $4/month on API calls instead of $99 on other tools. Game changer.", author: "Marcus Chen", role: "Founder", company: "StartupX", metric: "96% savings", avatar: "MC" },
    { quote: "The carousel generator alone is worth it. I went from struggling with Canva to creating professional carousels in minutes.", author: "Elena Rodriguez", role: "Content Creator", company: "Self-employed", metric: "+340%", avatar: "ER" },
  ];

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
        className="relative z-10 pt-8 pb-20 px-4"
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
                  <svg key={i} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Headline */}
          <div className="text-center max-w-4xl mx-auto mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-6"
            >
              Stop struggling to{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500">
                  {isMounted ? (
                    <TypewriterText texts={["write posts", "get engagement", "go viral", "grow your brand"]} />
                  ) : (
                    "write posts"
                  )}
                </span>
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
              No subscriptions limits. Just results.
            </motion.p>

            {/* CTA inline form */}
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
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 h-14 px-6 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-lg"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-14 px-8 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-lg shadow-lg shadow-cyan-500/30"
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
            {pains.map((pain, i) => (
              <PainCard key={pain.title} pain={pain} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
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
              There&apos;s a better way
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              An AI-powered content engine that writes like you, costs almost nothing, and actually gets results.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {solutions.map((solution, i) => (
              <SolutionCard key={solution.title} solution={solution} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="relative z-10 py-24 px-4">
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

      {/* Testimonials */}
      <section className="relative z-10 py-24 px-4 bg-gradient-to-b from-transparent via-slate-100/50 dark:via-slate-900/50 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Real results from real founders
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Beta testers are already seeing incredible growth
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <TestimonialCard key={testimonial.author} testimonial={testimonial} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-violet-500/30 rounded-3xl blur-2xl" />

            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 md:p-12 text-center overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                  backgroundSize: "32px 32px",
                }} />
              </div>

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium mb-6">
                  <Users className="w-4 h-4" />
                  Only 153 spots left at this price
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
                  Ready to 10x your LinkedIn?
                </h2>
                <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto">
                  Join now and lock in 30% off for your entire first year. This deal disappears at launch.
                </p>

                {/* Countdown */}
                <div className="flex justify-center gap-4 mb-8">
                  {[
                    { value: timeLeft.days, label: "Days" },
                    { value: timeLeft.hours, label: "Hours" },
                    { value: timeLeft.minutes, label: "Min" },
                    { value: timeLeft.seconds, label: "Sec" },
                  ].map((item, i) => (
                    <div key={i} className="text-center">
                      <div className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-2xl font-bold text-white font-mono">
                        {String(item.value).padStart(2, "0")}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>

                {/* Form */}
                {!isSuccess ? (
                  <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="flex-1 h-14 px-6 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-slate-400 text-lg"
                    />
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="h-14 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold text-lg"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Claim 30% Off <ArrowRight className="w-5 h-5 ml-1" /></>}
                    </Button>
                  </form>
                ) : (
                  <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-6 max-w-md mx-auto">
                    <Check className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <p className="text-white font-semibold">You&apos;re in! Check your inbox.</p>
                  </div>
                )}
                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

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
