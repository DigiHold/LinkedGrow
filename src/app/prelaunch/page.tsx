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
  MessageSquare,
  X,
  Star,
  Calendar,
  FileText,
  Globe,
  Key,
  Shield,
  RefreshCw,
  Gift,
} from "lucide-react";
import { PrelaunchHeader } from "@/components/prelaunch/prelaunch-header";

// Smooth typewriter effect - types word by word for better readability
function TypewriterText({ texts }: { texts: string[] }) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const currentFullText = texts[currentTextIndex];
    const typeSpeed = isDeleting ? 20 : 50; // Faster typing for smoother effect
    const pauseTime = 3000; // Longer pause to read

    // Finished typing - pause then start deleting
    if (!isDeleting && charIndex === currentFullText.length) {
      const timeout = setTimeout(() => setIsDeleting(true), pauseTime);
      return () => clearTimeout(timeout);
    }

    // Finished deleting - move to next text
    if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setCurrentTextIndex((prev) => (prev + 1) % texts.length);
      return;
    }

    // Type or delete characters
    const timeout = setTimeout(() => {
      if (isDeleting) {
        // Delete faster - remove multiple chars at once
        const charsToRemove = Math.min(2, charIndex);
        setCharIndex((prev) => prev - charsToRemove);
        setDisplayText(currentFullText.slice(0, charIndex - charsToRemove));
      } else {
        // Type character by character
        setCharIndex((prev) => prev + 1);
        setDisplayText(currentFullText.slice(0, charIndex + 1));
      }
    }, typeSpeed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, currentTextIndex, texts]);

  // Reset charIndex when text changes
  useEffect(() => {
    setCharIndex(0);
    setDisplayText("");
  }, [currentTextIndex]);

  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500">
      {displayText}
      <span className="animate-blink text-cyan-500 font-light">|</span>
    </span>
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
              { label: "Engagement", value: "High", max: "", color: "violet" },
              { label: "Best Time", value: "9 AM", max: "Tue", color: "blue" },
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

// Modern animated features section with 3D cards
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
      {/* Animated background gradient */}
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
            {/* Card glow on hover */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.iconBg} rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-500`} />

            {/* Card content */}
            <div className="relative h-full bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden">
              {/* Animated corner accent */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.iconBg} opacity-5 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500`} />

              {/* Icon with animated ring */}
              <div className="relative mb-5">
                <div className={`absolute inset-0 w-14 h-14 rounded-xl bg-gradient-to-br ${feature.iconBg} opacity-20 blur-lg group-hover:blur-xl transition-all`} />
                <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${feature.iconBg} flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-600 dark:group-hover:from-white dark:group-hover:to-slate-300 transition-all">
                {feature.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                {feature.description}
              </p>

              {/* Stats or highlight badge */}
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

// Auto-scrolling testimonials - more rows, full width
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

      {/* Row 1 - scrolling left */}
      <motion.div
        animate={{ x: [0, -2000] }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
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
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                  {t.author.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">{t.author}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                </div>
              </div>
              <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{t.metric}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Row 2 - scrolling right */}
      <motion.div
        animate={{ x: [-2000, 0] }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className="flex gap-4 mb-4"
      >
        {[...testimonials.slice(4), ...testimonials.slice(0, 4), ...testimonials.slice(4), ...testimonials.slice(0, 4), ...testimonials].map((t, i) => (
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
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                  {t.author.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">{t.author}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                </div>
              </div>
              <p className="text-lg font-bold text-violet-600 dark:text-violet-400">{t.metric}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Row 3 - scrolling left slower */}
      <motion.div
        animate={{ x: [0, -2000] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="flex gap-4"
      >
        {[...testimonials.slice(2), ...testimonials.slice(0, 2), ...testimonials.slice(2), ...testimonials.slice(0, 2), ...testimonials].map((t, i) => (
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
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold">
                  {t.author.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">{t.author}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                </div>
              </div>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{t.metric}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// Modern "How it works" with animated vertical timeline
function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Connect Your AI Key",
      description: "Add your OpenAI, Claude, or Gemini API key. Takes 30 seconds. You pay the AI provider directly - no middleman markup.",
      icon: Key,
      color: "from-amber-500 to-orange-500",
      time: "30 sec",
    },
    {
      number: "02",
      title: "Define Your Voice",
      description: "Tell us about your niche, audience, and style. The AI learns to write exactly like you - not generic AI content.",
      icon: Target,
      color: "from-cyan-500 to-blue-500",
      time: "2 min",
    },
    {
      number: "03",
      title: "Generate & Refine",
      description: "Create weeks of viral-ready content in minutes. Tweak, regenerate, or approve. You're always in control.",
      icon: Sparkles,
      color: "from-violet-500 to-purple-500",
      time: "5 min",
    },
    {
      number: "04",
      title: "Schedule & Grow",
      description: "AI picks optimal posting times. Schedule ahead, track analytics, and watch your audience explode.",
      icon: TrendingUp,
      color: "from-emerald-500 to-green-500",
      time: "2 min",
    },
  ];

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Desktop: Horizontal timeline */}
      <div className="hidden lg:block">
        {/* Progress line */}
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
              {/* Step circle */}
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
                {/* Step number badge */}
                <div className={`absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                  {step.number}
                </div>
              </motion.div>

              {/* Content */}
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

      {/* Mobile/Tablet: Vertical timeline */}
      <div className="lg:hidden relative">
        {/* Vertical line */}
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
              {/* Step circle */}
              <div className={`absolute left-0 top-0 w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                <step.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content card */}
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

      {/* Total time badge */}
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

// Comparison table with clear pricing
function ComparisonSection() {
  const comparisons = [
    { feature: "AI Content Generation", linkedgrow: "Unlimited", others: "50-100/mo" },
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

// Pricing preview section
function PricingPreview() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect to try it out",
      features: ["3 posts/month", "Basic editor", "BYOK support"],
      highlight: false,
      color: "slate",
    },
    {
      name: "Starter",
      price: "$19",
      originalPrice: "$27",
      period: "/month",
      description: "For regular creators",
      features: ["Unlimited posts", "10 scheduled posts", "Content calendar", "AI voice training"],
      highlight: false,
      color: "cyan",
    },
    {
      name: "Pro",
      price: "$39",
      originalPrice: "$56",
      period: "/month",
      description: "For serious growth",
      features: ["Everything in Starter", "Unlimited scheduling", "AI image generation", "Carousel creator", "Analytics dashboard"],
      highlight: true,
      color: "violet",
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
      color: "emerald",
    },
  ];

  return (
    <div className="relative">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Pricing note */}
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
            {/* Popular badge */}
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
              {/* Plan name */}
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{plan.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{plan.description}</p>

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-6">
                {plan.originalPrice && (
                  <span className="text-lg text-slate-400 line-through">{plan.originalPrice}</span>
                )}
                <span className="text-4xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                <span className="text-slate-500 dark:text-slate-400">{plan.period}</span>
              </div>

              {/* Features */}
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

      {/* Early bird discount note */}
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

// FAQ Section - expanded
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "What does \"Bring Your Own AI Key\" mean?",
      a: "Instead of paying us inflated fees for AI, you connect your own API key from OpenAI, Anthropic (Claude), or Google (Gemini). You pay the AI provider directly at their rates - typically $3-5/month for average usage. No middleman markup, no content limits.",
    },
    {
      q: "What's the total cost of using LinkedGrow?",
      a: "You pay a platform subscription fee to LinkedGrow (see pricing page) plus your actual AI API usage which averages $3-5/month for most users. This is 80-90% cheaper than competitors who charge $50-200/month with strict generation limits.",
    },
    {
      q: "Is this safe to use with LinkedIn?",
      a: "Yes. LinkedGrow doesn't automate LinkedIn interactions or violate their terms of service. We help you create content that you then post manually or schedule through LinkedIn's native tools. Your account stays safe.",
    },
    {
      q: "Will my posts sound like generic AI content?",
      a: "No. Our AI learns your unique writing style, tone, and vocabulary by analyzing your inputs and preferences. We use advanced prompting to match your voice. The result is content that sounds like you wrote it - because you guided the AI to do so.",
    },
    {
      q: "How is this different from ChatGPT?",
      a: "LinkedGrow is purpose-built for LinkedIn. We have viral content formulas, engagement analysis, optimal posting times, carousel generators, and scheduling - all optimized for LinkedIn's algorithm. ChatGPT is a general tool; we're specialized.",
    },
    {
      q: "Can I try before committing?",
      a: "Yes. We offer a free tier so you can test the platform before subscribing. You'll just need to add your own AI API key to generate content, which typically costs pennies per post.",
    },
    {
      q: "What if I don't have an AI API key?",
      a: "Getting an API key takes 2 minutes. We have step-by-step guides for OpenAI, Claude, and Gemini. Most providers offer free credits to start, so you can try everything at no cost.",
    },
    {
      q: "Do you store or train on my content?",
      a: "Never. Your content is yours. We don't store your generated posts or use them to train AI models. Your API calls go directly to the AI provider. We only save your preferences and drafts that you choose to keep.",
    },
    {
      q: "What happens to my early access discount?",
      a: "Early supporters get 30% off their first year. This discount is locked in when you join the waitlist and claim it at launch. The discount applies to annual plans only.",
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes, no contracts. Cancel your subscription anytime from your dashboard. If you cancel, you keep access until the end of your billing period.",
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
    <section className="relative z-10 py-16 md:py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-violet-500/30 rounded-[2.5rem] blur-2xl" />
          <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-violet-500/20 rounded-[2rem] blur-xl" />

          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] overflow-hidden">
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

            <div className="relative z-10 p-6 md:p-12 lg:p-16">
              {/* Badge */}
              <div className="flex justify-center mb-8">
                <div className="inline-flex items-center gap-3 px-4 md:px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-cyan-400" />
                    <span className="font-bold text-cyan-400 text-sm md:text-base">EARLY ACCESS</span>
                  </div>
                  <div className="w-px h-4 bg-white/20 hidden sm:block" />
                  <div className="hidden sm:flex items-center gap-2">
                    <Users className="w-4 h-4 text-white/60" />
                    <span className="text-white/80 text-sm">Only 153 spots left</span>
                  </div>
                </div>
              </div>

              {/* Headline */}
              <div className="text-center max-w-2xl mx-auto mb-8 md:mb-10">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
                  Ready to 10x your
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400">
                    LinkedIn growth?
                  </span>
                </h2>
                <p className="text-base md:text-lg text-slate-300">
                  Join the waitlist and lock in <span className="font-bold text-white">30% off</span> for your first year.
                  <br className="hidden sm:block" />
                  This deal ends at launch.
                </p>
              </div>

              {/* Countdown */}
              <div className="flex justify-center gap-2 sm:gap-3 md:gap-4 mb-8 md:mb-10">
                {[
                  { value: timeLeft.days, label: "Days" },
                  { value: timeLeft.hours, label: "Hours" },
                  { value: timeLeft.minutes, label: "Min" },
                  { value: timeLeft.seconds, label: "Sec" },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="w-14 sm:w-16 md:w-20 h-14 sm:h-16 md:h-20 rounded-xl md:rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                      <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-mono">
                        {String(item.value).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-2">{item.label}</p>
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
                        className="flex-1 h-12 md:h-14 px-4 md:px-5 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-slate-400 text-base focus:bg-white/20"
                      />
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="h-12 md:h-14 px-6 md:px-8 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base shadow-lg shadow-cyan-500/30 whitespace-nowrap"
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
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <p className="text-center text-xs md:text-sm text-slate-400">
                      Join 179 founders • No spam • Unsubscribe anytime
                    </p>
                  </form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-6 md:p-8 text-center"
                  >
                    <div className="w-14 md:w-16 h-14 md:h-16 mx-auto rounded-full bg-emerald-500 flex items-center justify-center mb-4">
                      <Check className="w-7 md:w-8 h-7 md:h-8 text-white" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-white mb-2">You&apos;re on the list!</h3>
                    <p className="text-slate-300">Your 30% discount is locked in. Check your inbox!</p>
                  </motion.div>
                )}
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-8 md:mt-10 pt-8 md:pt-10 border-t border-white/10">
                {[
                  { icon: Shield, text: "Bank-level security" },
                  { icon: Key, text: "Your API, your data" },
                  { icon: RefreshCw, text: "Cancel anytime" },
                ].map((badge) => (
                  <div key={badge.text} className="flex items-center gap-2 text-slate-400 text-xs md:text-sm">
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

  // Launch date: February 1st 2026
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

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative z-10 pt-8 md:pt-12 pb-12 md:pb-16 px-4"
      >
        <div className="max-w-6xl mx-auto">
          {/* Social proof badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-6 md:mb-8"
          >
            <div className="inline-flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50">
              <div className="flex -space-x-2">
                {["A", "B", "C", "D"].map((letter) => (
                  <div key={letter} className="w-7 md:w-8 h-7 md:h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 border-2 border-white dark:border-slate-800 flex items-center justify-center text-white text-xs font-bold">
                    {letter}
                  </div>
                ))}
              </div>
              <div className="text-xs md:text-sm">
                <span className="font-bold text-slate-900 dark:text-white">179 founders</span>
                <span className="text-slate-500 dark:text-slate-400"> joined</span>
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
              <div className="hidden sm:flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-3 md:w-4 h-3 md:h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Headline */}
          <div className="text-center max-w-4xl mx-auto mb-10 md:mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-4 md:mb-6"
            >
              Stop struggling to
              <br />
              <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
                {isMounted ? (
                  <TypewriterText texts={["create engaging content", "grow your audience fast", "write posts that convert", "build real authority"]} />
                ) : (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500">create engaging content</span>
                )}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-6 md:mb-8 px-2"
            >
              LinkedGrow analyzes viral content, generates posts in your voice, and lets you use your own AI key -
              paying only <span className="font-bold text-slate-900 dark:text-white">$3-5/month in API costs</span> instead of $50+ subscriptions.
            </motion.p>

            {/* CTA form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-xl mx-auto px-2"
            >
              {!isSuccess ? (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 md:h-14 px-4 md:px-5 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-base flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 md:h-14 px-5 md:px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-base shadow-lg shadow-cyan-500/30 whitespace-nowrap"
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
                  <div className="w-14 md:w-16 h-14 md:h-16 mx-auto rounded-full bg-emerald-500 flex items-center justify-center mb-4">
                    <Check className="w-7 md:w-8 h-7 md:h-8 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-2">You&apos;re on the list!</h3>
                  <p className="text-slate-600 dark:text-slate-400">Your 30% discount is locked in. Check your inbox!</p>
                </motion.div>
              )}
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                Join 179 founders • 30% off locked in • No spam
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
      <section className="relative z-10 py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium mb-4">
              <X className="w-4 h-4" />
              The LinkedIn Content Struggle
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Sound familiar?
            </h2>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              You know LinkedIn can grow your business. But creating content that actually works feels impossible.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[
              { title: "Hours wasted writing", description: "Staring at a blank screen, trying to write something that doesn't sound generic.", stat: "3h+" },
              { title: "Zero engagement", description: "You post consistently but the algorithm ignores you. Zero likes, zero leads.", stat: "0%" },
              { title: "Expensive AI tools", description: "Other tools cost $50+/month with strict limits. You pay even when you don't use it.", stat: "$600/yr" },
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
                <div className="relative bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 md:p-6 border border-slate-200/50 dark:border-slate-700/50 hover:border-red-300 dark:hover:border-red-700 transition-all h-full">
                  <div className="text-3xl md:text-4xl font-black text-red-500/20 dark:text-red-400/20 mb-2">{pain.stat}</div>
                  <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-2">{pain.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{pain.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="relative z-10 py-16 md:py-24 px-4 bg-gradient-to-b from-transparent via-cyan-50/50 dark:via-cyan-950/20 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              The Solution
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Your complete LinkedIn growth engine
            </h2>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              AI-powered content creation that writes like you, costs almost nothing, and actually drives results.
            </p>
          </motion.div>

          <BentoFeatures />
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4">
              How it works
            </h2>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400">
              From zero to viral in 4 simple steps
            </p>
          </motion.div>

          <HowItWorks />
        </div>
      </section>

      {/* Comparison Section */}
      <section className="relative z-10 py-16 md:py-24 px-4 bg-gradient-to-b from-transparent via-slate-100/50 dark:via-slate-900/50 to-transparent">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Why founders choose LinkedGrow
            </h2>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400">
              The honest comparison they don&apos;t want you to see
            </p>
          </motion.div>

          <ComparisonSection />
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="relative z-10 py-16 md:py-24 px-0">
        <div className="max-w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 md:mb-12 px-4"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Real results from real founders
            </h2>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400">
              Beta testers are already seeing incredible growth
            </p>
          </motion.div>

          <TestimonialsCarousel />
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="relative z-10 py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-4">
              <Gift className="w-4 h-4" />
              Early Access Pricing
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Choose the plan that fits your growth goals. Prices shown include the 30% early access discount.
            </p>
          </motion.div>

          <PricingPreview />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-16 md:py-24 px-4 bg-gradient-to-b from-transparent via-slate-100/50 dark:via-slate-900/50 to-transparent">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Questions? We&apos;ve got answers
            </h2>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400">
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
      <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800 py-6 md:py-8 px-4 bg-white dark:bg-slate-900">
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
