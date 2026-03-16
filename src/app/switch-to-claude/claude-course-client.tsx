"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";
import {
  ArrowRight,
  Check,
  Mail,
  Loader2,
  Zap,
  Sparkles,
  Star,
  Clock,
  ChevronDown,
  HelpCircle,
  MessageCircle,
  BookOpen,
  Rocket,
  Brain,
  Code,
  FileText,
  Settings,
  Layers,
  Monitor,
  Globe,
  Puzzle,
  PenTool,
  BarChart3,
  Users,
  RefreshCw,
  Shield,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

interface FAQ {
  question: string;
  answer: string;
}

interface ClaudeCourseClientProps {
  faqs: FAQ[];
}

// ============================================
// SIGNUP FORM (reusable)
// ============================================

function SignupForm({ location }: { location: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formLoadTime] = useState(() => Date.now());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your first name");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/claude-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          _hp: "",
          _ts: formLoadTime.toString(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccess(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
      >
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
          <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
          You&apos;re in! Check your inbox.
        </p>
        <p className="text-sm text-emerald-600 dark:text-emerald-400 text-center">
          Your welcome email is on its way. Day 1 arrives in just a few minutes.
          Check your spam folder if you don&apos;t see it.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-3">
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        className="absolute -left-[9999px] opacity-0 h-0 w-0"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your first name"
          className="w-full h-12 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
          required
        />
      </div>

      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your best email address"
          className="w-full h-12 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
          required
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-14 rounded-xl bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-base shadow-lg shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Enrolling...
          </>
        ) : (
          <>
            Start Free Course
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

      <p className="text-xs text-center text-slate-500 dark:text-slate-400">
        100% free. No credit card. Unsubscribe anytime.
      </p>
    </form>
  );
}

// ============================================
// HERO SECTION
// ============================================

function HeroSection() {
  return (
    <section className="relative min-h-[85vh] overflow-hidden">
      {/* Floating background elements */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute top-20 left-10 w-64 h-64 bg-amber-500 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.08, 0.05] }}
        transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        className="absolute bottom-20 right-10 w-72 h-72 bg-orange-500 rounded-full blur-3xl"
      />

      <div className="relative z-10 mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 lg:pt-40 pb-16 lg:pb-24 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 mb-8"
        >
          <span className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              Free Email Course
            </span>
          </span>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            10 days - 10 features mastered
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="flex flex-col items-center tracking-tight text-slate-900 dark:text-white mb-6 text-3xl sm:text-4xl md:text-5xl leading-none"
        >
          <span className="leading-[1.3]">Switch from ChatGPT to Claude</span>
          <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-500 to-orange-600 leading-[1.3]">
            and master it in 10 days
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          <span className="font-semibold text-slate-900 dark:text-white">
            One email per day. One powerful feature per day. Zero starting over.
          </span>
          <br className="hidden sm:block" />
          Transfer your ChatGPT data in 60 seconds, then learn Projects,
          Artifacts, Extended Thinking, and how to build websites and apps -
          without writing code.
        </motion.p>

        {/* Value Props Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center gap-4 mb-10"
        >
          {[
            { icon: Clock, text: "10-15 min daily tutorial" },
            { icon: RefreshCw, text: "Transfer ChatGPT data" },
            { icon: Code, text: "Build apps without code" },
          ].map((item, i) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <item.icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium">{item.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Signup Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <SignupForm location="hero" />
        </motion.div>

        {/* Social Proof Avatars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-center gap-4 mt-8"
        >
          <div className="flex -space-x-3">
            {[1, 2, 3, 4, 5, 6].map((num, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + i * 0.1, type: "spring" }}
                className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 overflow-hidden shadow-lg"
                style={{ zIndex: 6 - i }}
              >
                <Image
                  src={`https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person${num}.avif`}
                  alt=""
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="w-4 h-4 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Joined by{" "}
              <span className="font-bold text-slate-900 dark:text-white">
                thousands
              </span>{" "}
              switching to Claude
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// CHATGPT VS CLAUDE COMPARISON
// ============================================

const comparisons = [
  {
    feature: "Writing quality",
    chatgpt: "Recognizable AI patterns",
    claude: "Sounds naturally human",
    winner: "claude",
  },
  {
    feature: "Coding",
    chatgpt: "Good for simple tasks",
    claude: "95% accuracy, full codebase context",
    winner: "claude",
  },
  {
    feature: "Document analysis",
    chatgpt: "Limited context window",
    claude: "Reads 200+ page documents fully",
    winner: "claude",
  },
  {
    feature: "Build apps",
    chatgpt: "Requires coding knowledge",
    claude: "Claude Code builds from plain English",
    winner: "claude",
  },
  {
    feature: "Image generation",
    chatgpt: "Built-in DALL-E",
    claude: "External tools needed",
    winner: "chatgpt",
  },
  {
    feature: "Transparency",
    chatgpt: "Memory is a black box",
    claude: "See, edit, and delete all memories",
    winner: "claude",
  },
];

function ComparisonSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true });

  return (
    <section ref={sectionRef} className="relative z-10 py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-sm font-medium text-amber-700 dark:text-amber-400 mb-6"
          >
            <BarChart3 className="w-4 h-4" />
            <span>ChatGPT vs Claude</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4"
          >
            Why people are{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-500 to-orange-600">
              switching
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
          >
            Claude wins in the areas that matter most for professional work.
            Here is the honest comparison.
          </motion.p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Feature
            </div>
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 text-center">
              ChatGPT
            </div>
            <div className="text-sm font-semibold text-amber-600 dark:text-amber-400 text-center">
              Claude
            </div>
          </div>

          {/* Rows */}
          {comparisons.map((row, index) => (
            <motion.div
              key={row.feature}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="grid grid-cols-3 gap-4 p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 items-center"
            >
              <div className="text-sm font-medium text-slate-900 dark:text-white">
                {row.feature}
              </div>
              <div
                className={`text-sm text-center ${
                  row.winner === "chatgpt"
                    ? "text-emerald-600 dark:text-emerald-400 font-medium"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {row.chatgpt}
              </div>
              <div
                className={`text-sm text-center ${
                  row.winner === "claude"
                    ? "text-amber-600 dark:text-amber-400 font-medium"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {row.claude}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4"
        >
          Source: Independent benchmarks by Zapier, Ryz Labs, and Vertu - March 2026
        </motion.p>
      </div>
    </section>
  );
}

// ============================================
// NO STARTING OVER SECTION
// ============================================

function NoStartingOverSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true });

  const steps = [
    {
      step: "1",
      title: "Copy the extraction prompt",
      description:
        "Go to claude.ai/import-memory and copy the special prompt designed to export your ChatGPT data.",
    },
    {
      step: "2",
      title: "Paste it into ChatGPT",
      description:
        "ChatGPT outputs everything it knows about you - your preferences, projects, writing style - in one text block.",
    },
    {
      step: "3",
      title: "Import into Claude",
      description:
        "Paste the text into Claude and click import. Your memory, preferences, and context transfer in 60 seconds.",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative z-10 py-20 md:py-28 overflow-hidden"
    >
      <div className="absolute inset-0 bg-linear-to-br from-amber-600 via-orange-600 to-red-600" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"
      />

      <div className="relative mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium mb-6 backdrop-blur-sm border border-white/20"
          >
            <Shield className="w-4 h-4" />
            <span>Your #1 Concern - Solved</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6"
          >
            You do not start from zero.
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-200 to-white">
              Not even close.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/80 max-w-2xl mx-auto"
          >
            The #1 fear when switching from ChatGPT: &ldquo;I have spent months
            training it to know me. I am not starting over.&rdquo; You do
            not have to. Claude imports everything in 3 steps.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <span className="text-white font-black text-lg">
                  {step.step}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {step.title}
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center text-white/60 text-sm mt-8"
        >
          Day 1 of the course walks you through this entire process step by
          step.
        </motion.p>
      </div>
    </section>
  );
}

// ============================================
// COURSE BREAKDOWN (10-Day)
// ============================================

const courseDays = [
  {
    day: 1,
    title: "Transfer Your ChatGPT Data and Set Up Claude",
    description:
      "Import your entire ChatGPT memory - preferences, projects, writing style - in 60 seconds. Set up your User Profile so Claude understands your role, tools, and communication style from the first conversation. Understand usage limits so they never catch you off guard.",
    skill: "Complete migration from ChatGPT to Claude",
    icon: RefreshCw,
    color: "from-amber-500 to-orange-600",
  },
  {
    day: 2,
    title: "Projects and Custom Instructions",
    description:
      "Create persistent workspaces with their own instructions, knowledge files, and conversation history. Upload documents, set per-project rules, and build the foundation that makes every future conversation smarter. This replaces Custom GPTs - but it is significantly more powerful.",
    skill: "Build your personalized Claude workspace",
    icon: Layers,
    color: "from-violet-500 to-purple-600",
  },
  {
    day: 3,
    title: "Prompting Claude the Right Way",
    description:
      "Forget prompt engineering tricks from ChatGPT. Claude responds to context, not commands. Learn the 3-rule prompting system: context over commands, honest constraints, and letting Claude push back. Side-by-side comparisons show you exactly why the same prompt gets different results on each platform.",
    skill: "Write prompts that unlock Claude's best output",
    icon: PenTool,
    color: "from-emerald-500 to-green-600",
  },
  {
    day: 4,
    title: "Artifacts - Build Tools Without Code",
    description:
      "Build interactive calculators, data dashboards, flowcharts, comparison tools, and mini-apps - all from plain English descriptions. Learn 8 real Artifact examples with copy-paste prompts. Discover the \"Claude in Claude\" technique where your Artifacts have their own AI brain running inside them.",
    skill: "Create interactive tools and dashboards instantly",
    icon: Sparkles,
    color: "from-pink-500 to-rose-600",
  },
  {
    day: 5,
    title: "Write Content That Sounds Human",
    description:
      "Professional editors identify ChatGPT writing 78% of the time but Claude writing only 34%. Learn the 4-message writing workflow, voice training technique, and specific prompt templates for cold emails, LinkedIn posts, blog articles, and client proposals that nobody can tell AI helped with.",
    skill: "Master AI writing that passes as human",
    icon: FileText,
    color: "from-blue-500 to-indigo-600",
  },
  {
    day: 6,
    title: "Analyze Spreadsheets, PDFs, and Contracts",
    description:
      "Upload 200-page PDFs, messy spreadsheets, or dense legal contracts and ask questions in plain English. Claude reads every page, every row, every clause. Learn the Claude for Excel add-in, cross-document analysis, and how to turn raw data into interactive dashboard Artifacts.",
    skill: "Process and analyze any document in seconds",
    icon: BarChart3,
    color: "from-cyan-500 to-blue-600",
  },
  {
    day: 7,
    title: "Extended Thinking for Complex Problems",
    description:
      "Make Claude reason step by step before answering instead of generating instant (and often wrong) responses. See real before-and-after examples: contract review that catches contradictions between pages, code debugging that traces exact failure points, and strategic decisions backed by deep analysis.",
    skill: "Solve problems that stump every other AI",
    icon: Brain,
    color: "from-amber-500 to-yellow-600",
  },
  {
    day: 8,
    title: "Build a Complete Website with Claude Code",
    description:
      "From blank screen to published website in under an hour - no coding experience needed. Step-by-step setup of Claude Code, writing your first detailed prompt, iterating with natural language, and deploying live to Vercel. Includes CLAUDE.md templates and real examples of portfolio sites, landing pages, and marketing sites.",
    skill: "Publish a professional website from scratch",
    icon: Globe,
    color: "from-emerald-500 to-teal-600",
  },
  {
    day: 9,
    title: "Build a Full App Without Coding",
    description:
      "Non-developers are building App Store apps using only Claude. Learn both Claude Code (terminal) and Cowork (desktop) approaches. Build CRMs, dashboards, Chrome extensions, and SaaS tools from plain English descriptions. Includes a detailed brief template and the 7 apps you can build in under an hour.",
    skill: "Create working applications from plain English",
    icon: Monitor,
    color: "from-rose-500 to-pink-600",
  },
  {
    day: 10,
    title: "MCP, Automations, and the Power-User System",
    description:
      "Connect Claude to GitHub, Slack, Google Calendar, databases, and 200+ tools via MCP (Model Context Protocol). Set up scheduled Cowork tasks that run automatically. Build the complete daily workflow that makes Claude your operating system for work - from morning priorities to end-of-day reviews.",
    skill: "Automate your entire workflow with Claude",
    icon: Puzzle,
    color: "from-violet-500 to-indigo-600",
  },
];

function CourseBreakdownSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true });

  return (
    <section ref={sectionRef} className="relative z-10 py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 text-sm font-medium text-slate-600 dark:text-slate-400 mb-6"
          >
            <BookOpen className="w-4 h-4" />
            <span>Course Curriculum</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4"
          >
            10 days to Claude{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-500 to-orange-600">
              mastery
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
          >
            Each day is a complete tutorial on one powerful feature. Not a
            summary - a step-by-step guide with real examples.
          </motion.p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line (desktop) */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-linear-to-b from-amber-500 via-orange-500 to-rose-500 hidden md:block" />

          <div className="space-y-6">
            {courseDays.map((day, index) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.1 + index * 0.06 }}
                className="relative flex gap-6 group"
              >
                {/* Day number circle */}
                <div className="hidden md:flex flex-shrink-0">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-linear-to-br ${day.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 relative z-10`}
                  >
                    <span className="text-white font-black text-lg">
                      {day.day}
                    </span>
                  </div>
                </div>

                {/* Content card */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div
                      className={`md:hidden flex-shrink-0 w-12 h-12 rounded-xl bg-linear-to-br ${day.color} flex items-center justify-center shadow-lg`}
                    >
                      <span className="text-white font-bold">{day.day}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          Day {day.day}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {day.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                        {day.description}
                      </p>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
                        <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                          You will master: {day.skill}
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-xl bg-linear-to-br ${day.color} bg-opacity-10 flex items-center justify-center opacity-20 group-hover:opacity-100 transition-opacity`}
                      >
                        <day.icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA after curriculum */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="mt-12"
        >
          <SignupForm location="after-curriculum" />
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// WHO IS THIS FOR SECTION
// ============================================

const audiences = [
  {
    icon: Rocket,
    title: "ChatGPT Users Ready to Switch",
    description:
      "You have been using ChatGPT for months but keep hearing Claude is better. This course makes the switch painless - transfer your data, learn the differences, and master Claude in 10 days.",
  },
  {
    icon: Code,
    title: "Non-Developers Who Want to Build",
    description:
      "You have ideas for websites, apps, and tools but no coding skills. Days 8 and 9 show you how to build and publish real applications using only plain English descriptions.",
  },
  {
    icon: Users,
    title: "Professionals and Knowledge Workers",
    description:
      "Writers, marketers, consultants, lawyers, analysts - anyone who works with documents, data, and content. Claude handles all of it better than any other AI.",
  },
  {
    icon: Settings,
    title: "AI Curious Beginners",
    description:
      "Never used Claude or barely started? Day 1 begins from complete scratch. By Day 10, you will know more about Claude than 99% of users. No technical skills required.",
  },
];

function WhoIsThisForSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true });

  return (
    <section ref={sectionRef} className="relative z-10 py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 text-sm font-medium text-slate-600 dark:text-slate-400 mb-6"
          >
            <Users className="w-4 h-4" />
            <span>Who Is This For</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4"
          >
            Perfect for anyone{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-500 to-orange-600">
              switching to Claude
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
          >
            Whether you are a ChatGPT power user or completely new to AI, this
            course gives you the complete Claude toolkit.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {audiences.map((audience, index) => (
            <motion.div
              key={audience.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + index * 0.1 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <audience.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {audience.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {audience.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// RESULTS SECTION
// ============================================

const results = [
  {
    stat: "60s",
    label: "ChatGPT data transfer",
    description:
      "Import your entire ChatGPT memory, preferences, and writing style into Claude.",
  },
  {
    stat: "95%",
    label: "Coding accuracy",
    description:
      "Claude outperforms ChatGPT in independent coding benchmarks by Ryz Labs.",
  },
  {
    stat: "34%",
    label: "AI detection rate",
    description:
      "Editors spotted Claude writing only 34% of the time vs 78% for ChatGPT.",
  },
  {
    stat: "$0",
    label: "Cost to learn",
    description:
      "This entire 10-day course is free. No credit card, no hidden upsells.",
  },
];

function ResultsSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true });

  return (
    <section ref={sectionRef} className="relative z-10 py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {results.map((result, index) => (
            <motion.div
              key={result.stat}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + index * 0.1 }}
              className="relative bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-300 text-center group"
            >
              <div className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-amber-500 to-orange-600 mb-2">
                {result.stat}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {result.label}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {result.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// TESTIMONIALS SECTION
// ============================================

const testimonials = [
  {
    name: "Mark T.",
    role: "Product Manager",
    avatar: 1,
    quote:
      "I was a ChatGPT power user for 2 years. After Day 3 of this course, I understood why Claude is better for my work. The prompting difference alone changed everything.",
  },
  {
    name: "Jessica K.",
    role: "Freelance Copywriter",
    avatar: 4,
    quote:
      "The writing techniques in Day 5 blew my mind. My clients cannot tell the difference between my writing and Claude-assisted writing anymore. That was never true with ChatGPT.",
  },
  {
    name: "Ryan P.",
    role: "Startup Founder",
    avatar: 3,
    quote:
      "I built and launched my company's entire marketing website on Day 8. No developer, no agency. Just Claude Code and the instructions from this course. Saved us $10,000+.",
  },
];

function TestimonialsSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true });

  return (
    <section ref={sectionRef} className="relative z-10 py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-sm font-medium text-amber-700 dark:text-amber-400 mb-6"
          >
            <Star className="w-4 h-4" />
            <span>Student Stories</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4"
          >
            Hear from{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-500 to-orange-600">
              real switchers
            </span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + index * 0.1 }}
              className="bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6"
            >
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed italic">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={`https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/person${testimonial.avatar}.avif`}
                    alt={testimonial.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// FAQ SECTION
// ============================================

function FAQSection({ faqs }: { faqs: FAQ[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true });

  return (
    <section ref={sectionRef} className="relative z-10 py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 text-sm font-medium text-slate-600 dark:text-slate-400 mb-6"
          >
            <HelpCircle className="w-4 h-4" />
            <span>FAQ</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4"
          >
            Got{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-500 to-orange-600">
              questions?
            </span>
          </motion.h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.05 }}
            >
              <button
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
                className="w-full text-left bg-slate-50 dark:bg-slate-800/80 rounded-xl p-5 border border-slate-200/50 dark:border-slate-700/50 hover:border-amber-300 dark:hover:border-amber-700 transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-left">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform shrink-0 ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
        >
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Still have questions?
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Drop us an email and we&apos;ll get back to you within 24 hours.
          </p>
          <a
            href="mailto:contact@linkedgrow.ai"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors group"
          >
            Contact Us
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// FINAL CTA SECTION
// ============================================

function FinalCTASection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true });

  return (
    <section ref={sectionRef} className="relative z-10 py-20 md:py-28">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
            Ready to switch from
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-500 to-orange-600">
              ChatGPT to Claude?
            </span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-xl mx-auto">
            Join thousands of professionals who are mastering Claude with our
            free 10-day course. Your first lesson arrives in minutes.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          <SignupForm location="bottom-cta" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-8 text-sm text-slate-500 dark:text-slate-400"
        >
          <span className="flex items-center gap-1">
            <Check className="w-4 h-4 text-emerald-500" />
            100% free
          </span>
          <span className="flex items-center gap-1">
            <Check className="w-4 h-4 text-emerald-500" />
            No spam, ever
          </span>
          <span className="flex items-center gap-1">
            <Check className="w-4 h-4 text-emerald-500" />
            Unsubscribe anytime
          </span>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ClaudeCourseClient({ faqs }: ClaudeCourseClientProps) {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Header />
      <HeroSection />
      <ResultsSection />
      <NoStartingOverSection />
      <ComparisonSection />
      <CourseBreakdownSection />
      <WhoIsThisForSection />
      <TestimonialsSection />
      <FAQSection faqs={faqs} />
      <FinalCTASection />
      <Footer />
    </main>
  );
}
