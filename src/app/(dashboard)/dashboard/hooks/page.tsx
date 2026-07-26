"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AiKeyGate } from "@/components/dashboard/ai-key-gate";
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
        <div className="mx-auto w-full max-w-7xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-10 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">
                Hooks
              </h1>
              <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">
                The first two lines decide whether the rest gets read. Write several and pick one.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <VideoModal videoId="ylHZIxbFCOA" />
              <Link href="/docs/content-creation/hooks-generator" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-white">
                <HelpCircle className="w-3.5 h-3.5" />
                Docs
              </Link>
            </div>
          </div>

          <AiKeyGate what="write hooks" />

          {/* Preview of what's possible */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Popular topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {popularTopics.map((topic) => (
                  <span
                    key={topic}
                    className="px-3 py-1.5 rounded-full text-sm bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
    );
  }

  return (
      <div className="mx-auto w-full max-w-7xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">
              Hooks
            </h1>
            <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">
              The first two lines decide whether the rest gets read. Write several and pick one.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <VideoModal videoId="ylHZIxbFCOA" />
            <Link href="/docs/content-creation/hooks-generator" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-white">
              <HelpCircle className="w-3.5 h-3.5" />
              Docs
            </Link>
          </div>
        </div>

        {/* Topic Selection */}
        <Card>
          <CardHeader>
            <CardTitle>What is the post about?</CardTitle>
            <CardDescription>
              Or type your own. Either way you get 6 openings to choose from.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
              {popularTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => {
                    setSelectedTopic(selectedTopic === topic ? null : topic);
                    setCustomTopic("");
                  }}
                  aria-pressed={selectedTopic === topic && !customTopic}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    selectedTopic === topic && !customTopic
                      ? "border-cyan-500 bg-cyan-50/60 text-cyan-800 dark:border-cyan-400/60 dark:bg-cyan-400/10 dark:text-cyan-200"
                      : "border-border text-slate-600 hover:border-slate-300 dark:text-slate-300 dark:hover:border-white/20"
                  )}
                >
                  {topic}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                placeholder="Something else, in your own words"
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
                className="px-6"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate 6 hooks
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* The card above already says what to do; this only holds the space
            the results will fill. */}
        {hooks.length === 0 && !isGenerating && (
          <Card>
            <CardContent className="px-8 py-16">
              <div className="mx-auto max-w-md text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5">
                  <Anchor className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-[17px] font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">
                  Your hooks will appear here
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Six openings for the same post, so you can read them side by
                  side and keep the one that lands.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hooks Grid */}
        {hooks.length > 0 && (
          <>
            <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">
              Six openings for the same post
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hooks.map((hook, index) => (
                <Card
                  key={index}
                  className="flex flex-col transition-colors hover:border-slate-300 dark:hover:border-white/20"
                >
                  <CardContent className="flex flex-1 flex-col p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                        {index + 1}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{hook.firstLine.length} chars</span>
                    </div>

                    {/* Hook Preview - no empty line between */}
                    <div className="mb-4 flex-1">
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
                        Open in the editor
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
                Six more
              </Button>
            </div>
          </>
        )}
      </div>
  );
}
