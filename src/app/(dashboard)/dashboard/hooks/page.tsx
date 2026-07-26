"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Anchor,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Key,
  Settings,
  AlertCircle,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { VideoModal } from "@/components/dashboard/video-modal";
import Link from "next/link";

const popularTopics = [
  "Career Growth",
  "Leadership",
  "Productivity",
  "Hiring & Recruiting",
  "Startups",
  "Remote Work",
  "Sales Tips",
  "Marketing",
  "AI & Tech",
  "Personal Branding",
];

interface HookPair {
  firstLine: string;
  secondLine: string;
}

interface SettingsResponse {
  hasApiKey: boolean;
  aiProvider: string | null;
}

export default function HooksPage() {
  const router = useRouter();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [hooks, setHooks] = useState<HookPair[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const response = await fetch("/api/user/settings");
        if (response.ok) {
          const data: SettingsResponse = await response.json();
          setHasApiKey(data.hasApiKey);
        } else {
          setHasApiKey(false);
        }
      } catch {
        setHasApiKey(false);
      } finally {
        setIsCheckingApiKey(false);
      }
    };

    checkApiKey();
  }, []);

  const handleGenerate = async () => {
    const topic = customTopic || selectedTopic;
    if (!topic || !hasApiKey) return;

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/generate-hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postIdea: topic, count: 6 }),
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
    // No line space between the two hooks - just a single newline
    const text = `${hook.firstLine}\n${hook.secondLine}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleUseInEditor = (hook: HookPair) => {
    // Navigate to editor with the hook as starting content
    const content = `${hook.firstLine}\n${hook.secondLine}`;
    router.push(`/dashboard/editor?content=${encodeURIComponent(content)}`);
  };

  // Loading state while checking API key
  if (isCheckingApiKey) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-10">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
        <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-slate-100 dark:bg-white/5" />
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
        </div>
      </div>
    );
  }

  // No API key configured - show setup prompt
  if (!hasApiKey) {
    return (
      <FeatureGate feature="hooksGenerator">
        <div className="mx-auto w-full max-w-7xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-10 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">
                Hooks Generator
              </h1>
              <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">
                Generate scroll-stopping hooks that capture attention in the first 2 lines
              </p>
            </div>
            <div className="flex items-center gap-3">
              <VideoModal videoId="ylHZIxbFCOA" />
              <Link href="/docs/content-creation/hooks-generator" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 inline-flex items-center gap-1 transition-colors">
                <HelpCircle className="w-3.5 h-3.5" />
                Help?
              </Link>
            </div>
          </div>

          {/* API Key Required Card */}
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
            <CardContent className="py-12 px-8">
              <div className="text-center max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-linear-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
                  <Key className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI API Key Required</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  To generate hooks, you need to configure your AI API key in settings.
                  LinkedGrow uses your own API key (BYOK) for unlimited generations.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/dashboard/settings/ai-api">
                    <Button className="w-full sm:w-auto bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure API Key
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-6">
                  We support OpenAI, Anthropic, Google AI, Grok (xAI), Perplexity, and Kimi. Your key is encrypted and stored securely.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preview of what's possible */}
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="text-base">Preview - Popular Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {popularTopics.map((topic) => (
                  <span
                    key={topic}
                    className="px-3 py-1.5 rounded-full text-sm bg-gray-100 dark:bg-gray-800 text-slate-500 dark:text-slate-400"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </FeatureGate>
    );
  }

  return (
    <FeatureGate feature="hooksGenerator">
      <div className="mx-auto w-full max-w-7xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">
              Hooks Generator
            </h1>
            <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">
              Generate scroll-stopping hooks that capture attention in the first 2 lines
            </p>
          </div>
          <div className="flex items-center gap-3">
            <VideoModal videoId="ylHZIxbFCOA" />
            <Link href="/docs/content-creation/hooks-generator" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 inline-flex items-center gap-1 transition-colors">
              <HelpCircle className="w-3.5 h-3.5" />
              Help?
            </Link>
          </div>
        </div>

        {/* Topic Selection */}
        <Card>
          <CardHeader>
            <CardTitle>What&apos;s your post about?</CardTitle>
            <CardDescription>
              Select a popular topic or enter your own idea
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {popularTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => {
                    setSelectedTopic(topic);
                    setCustomTopic("");
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm transition-colors",
                    selectedTopic === topic && !customTopic
                      ? "bg-linear-to-r from-cyan-500 to-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  {topic}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Or describe your post idea..."
                value={customTopic}
                onChange={(e) => {
                  setCustomTopic(e.target.value);
                  setSelectedTopic(null);
                }}
                className="flex-1"
              />
              <Button
                onClick={handleGenerate}
                disabled={(!selectedTopic && !customTopic) || isGenerating}
                className="px-6 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate 6 Hooks
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Empty State - No Hooks Generated Yet */}
        {hooks.length === 0 && !isGenerating && (
          <Card>
            <CardContent className="py-16 px-8">
              <div className="text-center max-w-md mx-auto">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5">
                  <Anchor className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Ready to generate hooks</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Select a topic above and click &quot;Generate 6 Hooks&quot; to get attention-grabbing opening lines for your LinkedIn posts.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hooks Grid */}
        {hooks.length > 0 && (
          <>
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

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hooks.map((hook, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                        Hook #{index + 1}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{hook.firstLine.length} chars</span>
                    </div>

                    {/* Hook Preview - no empty line between */}
                    <div className="mb-4">
                      <p className="font-semibold text-sm sm:text-base leading-snug">
                        {hook.firstLine}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-snug">
                        {hook.secondLine}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(index)}
                        className="flex-1"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="w-4 h-4 mr-2 text-green-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUseInEditor(hook)}
                        className="flex-1"
                      >
                        Use in Editor
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center">
              <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
                <RefreshCw className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
                Generate More Hooks
              </Button>
            </div>
          </>
        )}
      </div>
    </FeatureGate>
  );
}
