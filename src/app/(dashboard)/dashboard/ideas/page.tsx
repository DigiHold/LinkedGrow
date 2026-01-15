"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Lightbulb,
  Sparkles,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Hash,
  Key,
  Settings,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

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

export default function IdeasPage() {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [customTheme, setCustomTheme] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Loading state while checking API key
  if (isCheckingApiKey) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // No API key configured - show setup prompt
  if (!hasApiKey) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-amber-500" />
            Content Ideas
          </h1>
          <p className="text-muted-foreground mt-1">
            Get AI-powered content ideas for your niche
          </p>
        </div>

        {/* API Key Required Card */}
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="py-12 px-8">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-linear-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
                <Key className="w-10 h-10 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI API Key Required</h3>
              <p className="text-muted-foreground mb-6">
                To generate content ideas, you need to configure your AI API key in settings.
                LinkedGrow uses your own API key (BYOK) for unlimited generations.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/dashboard/settings/ai-api">
                  <Button className="w-full sm:w-auto bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure API Key
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground mt-6">
                We support OpenAI, Anthropic, Google AI, and Groq. Your key is encrypted and stored securely.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview of what's possible */}
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="text-base">Preview - Popular Themes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {popularThemes.map((theme) => (
                <span
                  key={theme}
                  className="px-3 py-1.5 rounded-full text-sm bg-gray-100 dark:bg-gray-800 text-muted-foreground"
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <Lightbulb className="w-8 h-8 text-amber-500" />
          Content Ideas
        </h1>
        <p className="text-muted-foreground mt-1">
          Get AI-powered content ideas for your niche
        </p>
      </div>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Choose a Theme</CardTitle>
          <CardDescription>
            Select a popular theme or enter your own topic
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {popularThemes.map((theme) => (
              <button
                key={theme}
                onClick={() => {
                  setSelectedTheme(theme);
                  setCustomTheme("");
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm transition-colors",
                  selectedTheme === theme && !customTheme
                    ? "bg-linear-to-r from-cyan-500 to-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                {theme}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Or enter your own topic..."
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
              className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate 10 Ideas
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

      {/* Empty State - No Ideas Generated Yet */}
      {ideas.length === 0 && !isGenerating && (
        <Card className="border-dashed">
          <CardContent className="py-16 px-8">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-linear-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to generate ideas</h3>
              <p className="text-muted-foreground text-sm">
                Select a theme above and click "Generate 10 Ideas" to get AI-powered content suggestions for your LinkedIn posts.
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
                className="group hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        idea.engagement === "Very High"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : idea.engagement === "High"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      )}
                    >
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      {idea.engagement}
                    </span>
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  </div>

                  <p className="font-medium text-sm sm:text-base leading-relaxed mb-4 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {idea.hook}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {idea.type}
                    </span>
                    <span>-</span>
                    <span>{idea.category}</span>
                  </div>

                  <Link href={`/dashboard/editor?idea=${encodeURIComponent(idea.hook)}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Create Post
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center">
            <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
              <RefreshCw className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
              Generate More Ideas
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
