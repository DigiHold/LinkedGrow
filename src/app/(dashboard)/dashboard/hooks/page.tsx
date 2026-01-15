"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Anchor,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  Zap,
  Crown,
  Lock,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlanId, canAccessFeature } from "@/lib/plans";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { redirectToCheckout } from "@/lib/checkout";

interface HookPair {
  firstLine: string;
  secondLine: string;
}

export default function HooksPage() {
  const { data: session } = useSession();
  const userPlan: PlanId = (session?.user?.plan as PlanId) || "free";
  const userEmail = session?.user?.email || "";
  const hasAccess = canAccessFeature(userPlan, "hooksGenerator");

  const [postIdea, setPostIdea] = useState("");
  const [hooks, setHooks] = useState<HookPair[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/user/settings");
        if (res.ok) {
          const data = await res.json();
          setHasApiKey(data.hasApiKey || false);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleGenerate = async () => {
    if (!postIdea.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/generate-hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postIdea, count: 5 }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate hooks");
      }

      const data = await res.json();
      setHooks(data.hooks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate hooks");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (index: number) => {
    const hook = hooks[index];
    const text = `${hook.firstLine}\n\n${hook.secondLine}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyFirst = (index: number) => {
    navigator.clipboard.writeText(hooks[index].firstLine);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <FeatureGate feature="hooksGenerator" userPlan={userPlan} userEmail={userEmail}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Anchor className="w-8 h-8 text-linkedin" />
            Hooks Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate scroll-stopping hooks that capture attention in the first 2 lines
          </p>
        </div>

        {/* No API Key Warning */}
        {!hasApiKey && (
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
            <CardContent className="py-6">
              <div className="text-center">
                <Zap className="w-10 h-10 text-amber-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">AI API Key Required</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure your AI API key to generate hooks
                </p>
                <a href="/dashboard/settings/ai-api">
                  <Button className="bg-amber-600 hover:bg-amber-700">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Configure API Key
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>What&apos;s your post about?</CardTitle>
            <CardDescription>
              Describe your post idea and we&apos;ll generate attention-grabbing hooks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="e.g., How I went from 0 to 10k followers in 6 months by posting consistently and engaging with my audience..."
              value={postIdea}
              onChange={(e) => setPostIdea(e.target.value)}
              className="min-h-[120px]"
              disabled={!hasApiKey}
            />

            {/* Quick Ideas */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Try:</span>
              {[
                "Career pivot story",
                "Productivity hack",
                "Leadership lesson",
                "Hiring mistake",
                "Side project success",
              ].map((idea) => (
                <button
                  key={idea}
                  onClick={() => setPostIdea(idea)}
                  disabled={!hasApiKey}
                  className="px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {idea}
                </button>
              ))}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={!postIdea.trim() || isGenerating || !hasApiKey}
              className="w-full sm:w-auto bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Hooks...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate 5 Hook Pairs
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {hooks.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Generated Hooks</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
                Regenerate
              </Button>
            </div>

            <div className="grid gap-4">
              {hooks.map((hook, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 sm:p-6">
                      {/* Hook Preview */}
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-border mb-4">
                        <p className="font-semibold text-lg leading-relaxed">
                          {hook.firstLine}
                        </p>
                        <p className="text-muted-foreground mt-2 leading-relaxed">
                          {hook.secondLine}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(index)}
                          className="flex-1 sm:flex-none"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check className="w-4 h-4 mr-2 text-green-500" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Both Lines
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyFirst(index)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          First Line Only
                        </Button>
                      </div>
                    </div>

                    {/* Character counts */}
                    <div className="px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                      <span>First line: {hook.firstLine.length} chars</span>
                      <span>Second line: {hook.secondLine.length} chars</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tips Card */}
        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Hook Writing Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" />
                <span>Keep your first line under 100 characters for mobile visibility</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" />
                <span>Create a curiosity gap - make readers NEED to click &quot;see more&quot;</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" />
                <span>Use specific numbers and results when possible</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" />
                <span>The second line should build tension, not give away the answer</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  );
}
