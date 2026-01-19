"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Lock, User, ArrowRight, Check, Eye, EyeOff } from "lucide-react";

type SocialProvider = "linkedin" | "google" | null;
import { ThemeToggle } from "@/components/theme-toggle";

// LinkedIn icon component (Lucide style)
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

// Google icon component (official colors)
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(true);
  const [socialLoading, setSocialLoading] = useState<SocialProvider>(null);

  // Check for OAuth error from URL
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setErrorMessage(decodeURIComponent(error));
    }
  }, [searchParams]);

  const handleSocialSignUp = (provider: "linkedin" | "google") => {
    setSocialLoading(provider);

    // Build OAuth URL with params
    const params = new URLSearchParams({ mode: "register", popup: "true" });
    if (subscribeNewsletter) params.set("newsletter", "true");

    // Open OAuth in a popup window
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      `/api/${provider}/auth?${params.toString()}`,
      `${provider}-signup`,
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    // Listen for messages from the popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === `${provider}-success`) {
        window.removeEventListener('message', handleMessage);
        // Redirect to dashboard after successful signup
        router.push('/dashboard');
      } else if (event.data.type === `${provider}-error`) {
        window.removeEventListener('message', handleMessage);
        setErrorMessage(event.data.error || `Failed to sign up with ${provider}`);
        setSocialLoading(null);
      }
    };

    window.addEventListener('message', handleMessage);

    // Check if popup was blocked or closed
    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkPopup);
        window.removeEventListener('message', handleMessage);
        setSocialLoading(null);
      }
    }, 500);
  };

  const passwordRequirements = [
    { met: password.length >= 8, text: "At least 8 characters" },
    { met: /[A-Z]/.test(password), text: "One uppercase letter" },
    { met: /[0-9]/.test(password), text: "One number" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate password requirements
    if (!passwordRequirements.every((req) => req.met)) {
      setErrorMessage("Password does not meet requirements");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, subscribeNewsletter }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Failed to create account");
        return;
      }

      // Redirect to sign in page
      router.push("/sign-in?registered=true");
    } catch {
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background matching prelaunch page */}
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-cyan-50/30 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />

      {/* Animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-linear-to-r from-cyan-400/30 to-blue-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-linear-to-r from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-linear-to-r from-cyan-300/10 to-blue-300/10 rounded-full blur-3xl" />
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
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-cyan-500 to-blue-600" />

          {/* Header */}
          <div className="p-8 pb-6 text-center">
            <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6 group">
              <div className="w-12 h-12 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:shadow-xl group-hover:shadow-cyan-500/40 transition-all group-hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 379 230" className="w-7 h-7 text-white" fill="currentColor">
                  <path d="M205.9185,32.0339c.9512,8.7484,8.8874,15.128,17.6358,14.1767l88.8761-9.6638-93.389,116.1758-93.3595-75.0479c-6.8339-5.4935-16.9741-4.3909-22.4676,2.443L3.9774,203.5681c-5.4935,6.8339-4.3909,16.9741,2.443,22.4676,6.8339,5.4935,16.9741,4.3909,22.4676-2.443l89.2246-110.9953,93.3595,75.0479c6.8339,5.4935,16.9741,4.3909,22.4676-2.443l103.4013-128.631,9.6638,88.8761c.9512,8.7484,8.8874,15.128,17.6358,14.1767s15.128-8.8874,14.1767-17.6358l-13.8363-127.25c-.9512-8.7484-8.8874-15.128-17.6358-14.1767l-127.25,13.8363c-8.7484.9512-15.128,8.8874-14.1767,17.6358Z"/>
                </svg>
              </div>
              <span className="text-2xl font-bold font-display flex gap-[0.07rem] text-slate-900 dark:text-white">
                Linked<span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-blue-600">Grow</span>
              </span>
            </Link>
            <h1 className="text-[2rem] font-bold leading-[1.2] text-slate-900 dark:text-white mb-2">Create your account</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Start growing your LinkedIn presence today
            </p>
          </div>

          {/* Form Content */}
          <div className="px-8 pb-8">
            {errorMessage && (
              <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                {errorMessage}
              </div>
            )}

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => handleSocialSignUp("linkedin")}
                disabled={socialLoading !== null}
                className="h-12 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {socialLoading === "linkedin" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <LinkedInIcon className="w-5 h-5 text-linkedin" />
                )}
              </button>
              <button
                type="button"
                onClick={() => handleSocialSignUp("google")}
                disabled={socialLoading !== null}
                className="h-12 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {socialLoading === "google" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <GoogleIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                  or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
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

              <div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 pl-12 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 z-10"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {password && (
                  <div className="space-y-1 mt-2">
                    {passwordRequirements.map((req, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-2 text-xs ${
                          req.met ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                        }`}
                      >
                        <Check className={`w-3 h-3 ${req.met ? "opacity-100" : "opacity-30"}`} />
                        {req.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-14 pl-12 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 z-10"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>

              {/* Newsletter Checkbox */}
              <label className="flex items-center gap-3 cursor-pointer group mb-3">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={subscribeNewsletter}
                    onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded-md peer-checked:border-cyan-500 peer-checked:bg-cyan-500 transition-all group-hover:border-cyan-400">
                    {subscribeNewsletter && (
                      <Check className="w-full h-full text-white p-0.5" />
                    )}
                  </div>
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400 leading-tight">
                  Get growth tips, new features, and exclusive offers.
                </span>
              </label>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-base shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/40 mt-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-slate-600 dark:text-slate-400">Already have an account? </span>
              <Link href="/sign-in" className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-semibold">
                Sign in
              </Link>
            </div>

            <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="hover:underline text-slate-600 dark:text-slate-400">Terms</Link>{" "}
              and{" "}
              <Link href="/privacy" className="hover:underline text-slate-600 dark:text-slate-400">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}
