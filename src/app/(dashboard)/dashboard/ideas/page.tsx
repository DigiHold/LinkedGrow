"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AiKeyGate } from "@/components/dashboard/ai-key-gate";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Hash,
  Key,
  Settings,
  Loader2,
  AlertCircle,
  X,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoModal } from "@/components/dashboard/video-modal";
import Link from "next/link";
import { FeatureGate } from "@/components/dashboard/feature-gate";

const popularThemes = [
  "Productivity",
  "Leadership",
  "AI & Tech",
  "Career Growth",
  "Startups",
  "Remote Work",
  "Marketing",
  "Sales",
  "Entrepreneurship",
  "Personal Branding",
];

interface Idea {
  hook: string;
  type: string;
  category: string;
  engagement: string;
}

interface SettingsResponse {
  hasApiKey: boolean;
  aiProvider: string | null;
}

function IdeasContent() {
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [customTheme, setCustomTheme] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);

  // Check if user has API key configured
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
    const theme = customTheme || selectedTheme;
    if (!theme || !hasApiKey) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/ideas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, count: 10 }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate ideas");
      }

      const data = await response.json();
      setIdeas(data.ideas || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate ideas");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleIdeaClick = (idea: Idea) => {
    setSelectedIdea(idea);
    setShowConfirmModal(true);
  };

  const handleGeneratePost = async () => {
    if (!selectedIdea) return;

    setIsGeneratingPost(true);
    try {
      const response = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          idea: selectedIdea.hook,
          postType: selectedIdea.type.toLowerCase().replace(/[- ]/g, ""),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate post");
      }

      const data = await response.json();

      // Create a draft post with the generated content
      const postResponse = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: data.post,
          status: "draft",
        }),
      });

      if (!postResponse.ok) {
        throw new Error("Failed to save draft");
      }

      const postData = await postResponse.json();

      // Redirect to editor with the new post
      router.push(`/dashboard/editor?edit=${postData.post.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate post");
      setShowConfirmModal(false);
    } finally {
      setIsGeneratingPost(false);
    }
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
              Ideas
            </h1>
            <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">
              Topics worth posting about, based on your niche and your audience.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <VideoModal videoId="53lsvhAIXq0" />
            <Link href="/docs/content-creation/ideas-generator" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-white">
              <HelpCircle className="w-3.5 h-3.5" />
              Docs
            </Link>
          </div>
        </div>

        <AiKeyGate what="generate content ideas" />

        {/* Preview of what's possible */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Popular themes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {popularThemes.map((theme) => (
                <span
                  key={theme}
                  className="px-3 py-1.5 rounded-full text-sm bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300"
                >
                  {theme}
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
            Ideas
          </h1>
          <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">
            Topics worth posting about, based on your niche and your audience.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <VideoModal videoId="53lsvhAIXq0" />
          <Link href="/docs/content-creation/ideas-generator" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-white">
            <HelpCircle className="w-3.5 h-3.5" />
            Docs
          </Link>
        </div>
      </div>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Pick a theme</CardTitle>
          <CardDescription>
            Or type your own. Either way you get 10 angles to choose from.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {popularThemes.map((theme) => (
              <button
                key={theme}
                onClick={() => {
                  setSelectedTheme(selectedTheme === theme ? null : theme);
                  setCustomTheme("");
                }}
                aria-pressed={selectedTheme === theme && !customTheme}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  selectedTheme === theme && !customTheme
                    ? "border-cyan-500 bg-cyan-50/60 text-cyan-800 dark:border-cyan-400/60 dark:bg-cyan-400/10 dark:text-cyan-200"
                    : "border-border text-slate-600 hover:border-slate-300 dark:text-slate-300 dark:hover:border-white/20"
                )}
              >
                {theme}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Something else, in your own words"
              value={customTheme}
              onChange={(e) => {
                setCustomTheme(e.target.value);
                setSelectedTheme(null);
              }}
              className="flex-1"
            />
            <Button
              onClick={handleGenerate}
              disabled={(!selectedTheme && !customTheme) || isGenerating}
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
                  Generate 10 ideas
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

      {/* The card above already says what to do, so this one only fills the
          space where the results will land. */}
      {ideas.length === 0 && !isGenerating && (
        <Card>
          <CardContent className="px-8 py-16">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5">
                <Sparkles className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-[17px] font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">
                Your ideas will appear here
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Each one comes with an angle you can send straight to the
                generator.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ideas Grid */}
      {ideas.length > 0 && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ideas.map((idea, index) => (
              <Card
                key={index}
                onClick={() => handleIdeaClick(idea)}
                className="group flex flex-col transition-colors hover:border-slate-300 cursor-pointer dark:hover:border-white/20"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
                      <TrendingUp className="h-3 w-3" />
                      {idea.engagement}
                    </span>
                  </div>

                  <p className="font-medium text-sm sm:text-base leading-snug mb-4 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors whitespace-pre-line">
                    {idea.hook}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {idea.type}
                    </span>
                    <span>-</span>
                    <span>{idea.category}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleIdeaClick(idea);
                    }}
                  >
                    Write this one
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center">
            <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
              <RefreshCw className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
              Ten more ideas
            </Button>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => !isGeneratingPost && setShowConfirmModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Generate Post from Idea</h2>
              {!isGeneratingPost && (
                <button onClick={() => setShowConfirmModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="mb-6">
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Are you sure you want to use this idea to generate a full LinkedIn post?
              </p>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-border">
                <p className="font-medium whitespace-pre-line">{selectedIdea.hook}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {selectedIdea.type}
                  </span>
                  <span>-</span>
                  <span>{selectedIdea.category}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                disabled={isGeneratingPost}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGeneratePost}
                disabled={isGeneratingPost}
                className="flex-1"
              >
                {isGeneratingPost ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IdeasPage() {
  return (
      <IdeasContent />
  );
}
