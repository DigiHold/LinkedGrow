"use client";

import { useState } from "react";
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
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const sampleIdeas = [
  {
    hook: "The biggest lie about productivity is that you need to do more.",
    type: "Introspective",
    category: "Advice",
    engagement: "High",
  },
  {
    hook: "5 tools that helped me save 10 hours every week:",
    type: "Actionable",
    category: "List",
    engagement: "Very High",
  },
  {
    hook: "I asked 100 successful founders the same question. Here's what they said:",
    type: "Inspiring",
    category: "Resources",
    engagement: "Very High",
  },
  {
    hook: "Stop saying 'I don't have time.' Start saying 'It's not a priority.'",
    type: "Introspective",
    category: "Advice",
    engagement: "High",
  },
  {
    hook: "The 3-2-1 rule that transformed my morning routine:",
    type: "Actionable",
    category: "Best Practices",
    engagement: "Medium",
  },
  {
    hook: "Why I unsubscribed from 50 newsletters (and the 3 I kept):",
    type: "Introspective",
    category: "Resources",
    engagement: "High",
  },
  {
    hook: "Your calendar doesn't lie. Here's what mine revealed about my priorities:",
    type: "Introspective",
    category: "Explanation",
    engagement: "Medium",
  },
  {
    hook: "The uncomfortable truth about 'hustle culture' nobody talks about:",
    type: "Inspiring",
    category: "Advice",
    engagement: "Very High",
  },
  {
    hook: "I tracked every minute of my work week. Here are the results:",
    type: "Actionable",
    category: "Explanation",
    engagement: "High",
  },
  {
    hook: "A simple framework for making better decisions (works every time):",
    type: "Actionable",
    category: "Best Practices",
    engagement: "High",
  },
];

export default function IdeasPage() {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [customTheme, setCustomTheme] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState(sampleIdeas);

  const handleGenerate = async () => {
    const theme = customTheme || selectedTheme;
    if (!theme) return;

    setIsGenerating(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // In real app, this would generate new ideas based on theme
    setIdeas(sampleIdeas.sort(() => Math.random() - 0.5));
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <Lightbulb className="w-8 h-8 text-yellow-500" />
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
                    ? "bg-yellow-500 text-white"
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
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
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
        </CardContent>
      </Card>

      {/* Ideas Grid */}
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

              <p className="font-medium text-sm sm:text-base leading-relaxed mb-4 group-hover:text-linkedin transition-colors">
                {idea.hook}
              </p>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {idea.type}
                </span>
                <span>•</span>
                <span>{idea.category}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-4 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Create Post
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
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

      {/* Trending Section */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border-yellow-200 dark:border-yellow-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <TrendingUp className="w-5 h-5" />
            Trending This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { topic: "AI in the workplace", posts: "2.4K", growth: "+180%" },
              { topic: "Remote work challenges", posts: "1.8K", growth: "+95%" },
              { topic: "Career pivots", posts: "1.2K", growth: "+67%" },
            ].map((trend, index) => (
              <div
                key={index}
                className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-yellow-200 dark:border-yellow-800"
              >
                <p className="font-medium">{trend.topic}</p>
                <div className="flex items-center gap-3 mt-2 text-sm">
                  <span className="text-muted-foreground">{trend.posts} posts</span>
                  <span className="text-green-600 font-medium">{trend.growth}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
