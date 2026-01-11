"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Lock, Shield, ArrowRight } from "lucide-react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(error || "");
  const [requires2FA, setRequires2FA] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        totpCode: requires2FA ? totpCode : undefined,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "2FA_REQUIRED") {
          setRequires2FA(true);
          setIsLoading(false);
          return;
        }
        setErrorMessage(result.error);
      } else if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch {
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="relative w-full max-w-md border-0 shadow-2xl">
      <CardHeader className="text-center pb-2">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-linkedin-gradient flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <span className="text-xl font-bold">
            Linked<span className="text-linkedin">Grow</span>
          </span>
        </Link>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!requires2FA ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Password</label>
                  <Link href="/forgot-password" className="text-sm text-linkedin hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-linkedin/10 flex items-center justify-center mb-3">
                  <Shield className="w-8 h-8 text-linkedin" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                className="h-14 text-center text-2xl tracking-widest font-mono"
                autoFocus
                required
              />

              <button
                type="button"
                onClick={() => {
                  setRequires2FA(false);
                  setTotpCode("");
                }}
                className="text-sm text-linkedin hover:underline w-full text-center"
              >
                Use a different account
              </button>
            </div>
          )}

          <Button
            type="submit"
            variant="linkedin"
            className="w-full h-12"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {requires2FA ? "Verify" : "Sign In"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Don&apos;t have an account? </span>
          <Link href="/sign-up" className="text-linkedin hover:underline font-medium">
            Sign up
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="hover:underline">Terms</Link>{" "}
          and{" "}
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        </p>
      </CardContent>
    </Card>
  );
}

function LoadingFallback() {
  return (
    <Card className="relative w-full max-w-md border-0 shadow-2xl">
      <CardContent className="p-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-linkedin" />
      </CardContent>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 px-4 py-12">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-linkedin/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <Suspense fallback={<LoadingFallback />}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
