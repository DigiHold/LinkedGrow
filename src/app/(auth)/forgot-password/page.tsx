"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Failed to send reset email");
        return;
      }

      setIsSuccess(true);
    } catch {
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background matching prelaunch page */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />

      {/* Animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-gradient-to-r from-cyan-400/30 to-blue-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-gradient-to-r from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-300/10 to-blue-300/10 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] pointer-events-none opacity-30 dark:opacity-10" />

      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md">
        {/* Glassmorphism Card */}
        <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
          {/* Top gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />

          {/* Header */}
          <div className="p-8 pb-6 text-center">
            <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:shadow-xl group-hover:shadow-cyan-500/40 transition-all group-hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 379 230" className="w-7 h-7 text-white" fill="currentColor">
                  <path d="M205.9185,32.0339c.9512,8.7484,8.8874,15.128,17.6358,14.1767l88.8761-9.6638-93.389,116.1758-93.3595-75.0479c-6.8339-5.4935-16.9741-4.3909-22.4676,2.443L3.9774,203.5681c-5.4935,6.8339-4.3909,16.9741,2.443,22.4676,6.8339,5.4935,16.9741,4.3909,22.4676-2.443l89.2246-110.9953,93.3595,75.0479c6.8339,5.4935,16.9741,4.3909,22.4676-2.443l103.4013-128.631,9.6638,88.8761c.9512,8.7484,8.8874,15.128,17.6358,14.1767s15.128-8.8874,14.1767-17.6358l-13.8363-127.25c-.9512-8.7484-8.8874-15.128-17.6358-14.1767l-127.25,13.8363c-8.7484.9512-15.128,8.8874-14.1767,17.6358Z"/>
                </svg>
              </div>
              <span className="text-2xl font-bold font-display flex gap-[0.07rem] text-slate-900 dark:text-white">
                Linked<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">Grow</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {isSuccess ? "Check your email" : "Reset your password"}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {isSuccess
                ? "We've sent you a password reset link"
                : "Enter your email and we'll send you a reset link"}
            </p>
          </div>

          {/* Form Content */}
          <div className="px-8 pb-8">
            {isSuccess ? (
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  If an account exists for <strong className="text-slate-900 dark:text-white">{email}</strong>, you will receive an email with instructions to reset your password.
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mb-6">
                  Didn&apos;t receive the email? Check your spam folder or try again.
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      setIsSuccess(false);
                      setEmail("");
                    }}
                    variant="outline"
                    className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700"
                  >
                    Try another email
                  </Button>
                  <Link href="/sign-in" className="block">
                    <Button
                      className="w-full h-14 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-base shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40"
                    >
                      Back to Sign In
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {errorMessage && (
                  <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-base shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Send Reset Link
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center text-sm text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-medium"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Sign In
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
