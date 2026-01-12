"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Sparkles,
  Zap,
  Calendar,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Star,
  Check,
} from "lucide-react";

export default function PreLaunchPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsMounted(true);
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

      if (!response.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white overflow-hidden">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-100/40 via-transparent to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230891b2' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/prelaunch" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900">
              Linked<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">Grow</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Launching Soon</span>
            </div>
            <Link href="/sign-in">
              <Button variant="outline" size="sm" className="rounded-full border-slate-200 text-slate-600 hover:bg-slate-100">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-12 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column - Content */}
          <motion.div
            initial={isMounted ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={isMounted ? { opacity: 0, scale: 0.9 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-sm mb-6"
            >
              <div className="flex -space-x-1.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 border-2 border-white flex items-center justify-center text-[10px] font-medium text-slate-600"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-medium">2,500+ on waitlist</span>
              </div>
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6">
              Create LinkedIn content that{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">
                  actually converts
                </span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                >
                  <path
                    d="M2 8.5C50 2.5 100 2.5 150 5.5C200 8.5 250 8.5 298 2.5"
                    stroke="url(#prelaunch-gradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="prelaunch-gradient" x1="0" y1="0" x2="300" y2="0">
                      <stop offset="0%" stopColor="#0891b2" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0">
              AI-powered writing, smart scheduling, and real-time optimization.
              <span className="font-semibold text-slate-900"> Bring your own AI key</span> — no hidden costs, no limits.
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: Zap, text: "AI-Powered Writing" },
                { icon: TrendingUp, text: "Viral Post Analysis" },
                { icon: Calendar, text: "Smart Scheduling" },
                { icon: Sparkles, text: "Carousel Generator" },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={isMounted ? { opacity: 0, x: -20 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-cyan-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right column - Form */}
          <motion.div
            initial={isMounted ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="relative">
              <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-200/80 p-8">
                {!isSuccess ? (
                  <div>
                    {/* Form header */}
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4">
                        <Sparkles className="w-7 h-7 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        Get Notified at Launch
                      </h2>
                      <p className="text-slate-600">
                        Be the first to know + get exclusive early bird pricing
                      </p>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-3 mb-6">
                      {[
                        "50% off for early subscribers",
                        "Priority access before public launch",
                        "Exclusive tips & LinkedIn strategies",
                      ].map((benefit, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 text-sm"
                        >
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-emerald-600" />
                          </div>
                          <span className="text-slate-700">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <Input
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 h-12 rounded-xl focus:border-cyan-500 focus:ring-cyan-500"
                      />
                      <Input
                        type="email"
                        placeholder="Your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 h-12 rounded-xl focus:border-cyan-500 focus:ring-cyan-500"
                      />

                      {error && (
                        <p className="text-red-500 text-sm">{error}</p>
                      )}

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-lg shadow-slate-900/20 transition-all duration-300"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            Join the Waitlist
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>
                    </form>

                    <p className="text-xs text-slate-500 text-center mt-4">
                      No spam, ever. Unsubscribe anytime.
                    </p>
                  </div>
                ) : (
                  <motion.div
                    initial={isMounted ? { opacity: 0, scale: 0.95 } : false}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 mb-6">
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 mb-2">You&apos;re In!</h2>
                    <p className="text-slate-600 mb-4">
                      We&apos;ll email you when LinkedGrow launches.
                    </p>
                    <p className="text-sm text-cyan-600 font-medium">
                      Check your inbox for a confirmation.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features preview */}
        <motion.section
          initial={isMounted ? { opacity: 0, y: 40 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-24"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">What You&apos;ll Get</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Everything you need to grow your LinkedIn presence without the grind
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "AI Content Generator",
                description:
                  "Generate engaging posts, hooks, and stories that resonate with your audience.",
                color: "from-cyan-500 to-blue-500",
              },
              {
                icon: TrendingUp,
                title: "Viral Post Analyzer",
                description:
                  "Analyze top-performing content from Reddit and LinkedIn to find proven topics.",
                color: "from-violet-500 to-purple-500",
              },
              {
                icon: Calendar,
                title: "Smart Scheduler",
                description:
                  "Plan your content calendar weeks ahead. Auto-post at optimal times.",
                color: "from-amber-500 to-orange-500",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={isMounted ? { opacity: 0, y: 20 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Testimonial */}
        <motion.section
          initial={isMounted ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-24"
        >
          <div className="relative bg-white rounded-2xl p-8 md:p-12 border border-slate-200 shadow-sm">
            <div className="absolute top-6 right-6">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
            </div>

            <div className="max-w-3xl">
              <p className="text-xl md:text-2xl text-slate-700 leading-relaxed mb-6">
                &ldquo;I&apos;ve been beta testing LinkedGrow and it&apos;s{" "}
                <span className="text-cyan-600 font-semibold">completely transformed</span> how
                I approach LinkedIn. What used to take me 2 hours now takes 15
                minutes.&rdquo;
              </p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                  SM
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Sarah Mitchell</div>
                  <div className="text-sm text-slate-500">
                    Marketing Director @ TechCorp
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 py-8 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div>&copy; 2026 LinkedGrow. All rights reserved.</div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/cookies" className="hover:text-slate-900 transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
