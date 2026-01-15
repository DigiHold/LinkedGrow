"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  GitBranch,
  ArrowLeft,
  Loader2,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { PlanId } from "@/lib/plans";
import Link from "next/link";

export default function NewABTestPage() {
  const { data: session } = useSession();
  const userPlan = (session?.user?.plan || "free") as PlanId;
  const router = useRouter();

  const [name, setName] = useState("");
  const [variantA, setVariantA] = useState("");
  const [variantB, setVariantB] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please give your test a name");
      return;
    }

    if (!variantA.trim() || !variantB.trim()) {
      setError("Both variants must have content");
      return;
    }

    if (variantA.trim() === variantB.trim()) {
      setError("Variants must be different from each other");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/ab-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          variantAContent: variantA.trim(),
          variantBContent: variantB.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create test");
      }

      const data = await response.json();
      router.push(`/dashboard/ab-testing/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create test");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwapVariants = () => {
    const temp = variantA;
    setVariantA(variantB);
    setVariantB(temp);
  };

  return (
    <FeatureGate
      feature="abTesting"
      userPlan={userPlan}
      userEmail={session?.user?.email || ""}
    >
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/ab-testing"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to A/B Tests
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            Create A/B Test
          </h1>
          <p className="text-muted-foreground mt-1">
            Test two versions of your post to see which performs better
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Test Name */}
          <Card>
            <CardHeader>
              <CardTitle>Test Name</CardTitle>
              <CardDescription>
                Give your test a descriptive name so you can find it later
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="e.g., Hook comparison - storytelling vs stats"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
              />
            </CardContent>
          </Card>

          {/* Variants */}
          <div className="grid lg:grid-cols-2 gap-6 relative">
            {/* Variant A */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                    A
                  </span>
                  Variant A
                </CardTitle>
                <CardDescription>
                  Your first version of the post
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full min-h-[200px] p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Write your first version here...

Example: Start with a story-based hook:
'Last year, I almost quit my job...'

Or a bold statement:
'Most career advice is wrong...'"
                  value={variantA}
                  onChange={(e) => setVariantA(e.target.value)}
                  maxLength={3000}
                />
                <p className="text-xs text-muted-foreground mt-2 text-right">
                  {variantA.length}/3000
                </p>
              </CardContent>
            </Card>

            {/* Swap Button */}
            <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-full bg-white dark:bg-slate-900 shadow-md"
                onClick={handleSwapVariants}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {/* Variant B */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">
                    B
                  </span>
                  Variant B
                </CardTitle>
                <CardDescription>
                  Your second version of the post
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full min-h-[200px] p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Write your second version here...

Try a different approach:
- Different hook style
- Different structure
- Different tone
- Different CTA"
                  value={variantB}
                  onChange={(e) => setVariantB(e.target.value)}
                  maxLength={3000}
                />
                <p className="text-xs text-muted-foreground mt-2 text-right">
                  {variantB.length}/3000
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Mobile swap button */}
          <div className="lg:hidden flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSwapVariants}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Swap Variants
            </Button>
          </div>

          {/* Tips */}
          <Card className="bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800">
            <CardContent className="p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-violet-600" />
                Tips for Effective A/B Tests
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>- Test one variable at a time (hook, structure, CTA, etc.)</li>
                <li>- Keep the core message the same in both variants</li>
                <li>- Post both variants at similar times for fair comparison</li>
                <li>- Wait at least 48-72 hours before declaring a winner</li>
                <li>- Look at engagement rate, not just total impressions</li>
              </ul>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Link href="/dashboard/ab-testing">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              className="bg-linear-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create A/B Test"
              )}
            </Button>
          </div>
        </form>
      </div>
    </FeatureGate>
  );
}
