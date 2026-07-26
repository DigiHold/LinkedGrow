"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Sparkles, Loader2, ArrowUpRight } from "lucide-react";
import Link from "next/link";

// Community Management API available in developer mode
const COMING_SOON = false;

interface FirstCommentProps {
  value: string;
  onChange: (value: string) => void;
  postContent: string;
  onError?: (message: string) => void;
  hasAccess?: boolean;
}

export function FirstComment({ value, onChange, postContent, onError, hasAccess = true }: FirstCommentProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!postContent.trim()) return;
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postContent }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate comment");
      }

      const data = await response.json();
      if (data.comment) {
        onChange(data.comment);
      }
    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error.message : "Failed to generate comment");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // CTA for Free/Starter users
  if (!hasAccess) {
    return (
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium mb-1">First comment</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Automatically post a comment 1-5 min after publication to drive early interactions and boost your post in the algorithm. Available on Pro plan.
              </p>
              <Link href="/dashboard/upgrade">
                <Button size="sm">
                  Upgrade to Pro
                  <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            First comment
            {COMING_SOON && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                Coming Soon
              </span>
            )}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={!postContent.trim() || isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            )}
            {isGenerating ? "Generating..." : "Generate"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Add a value-adding comment - a question, extra insight, or useful link..."
          className="min-h-20 resize-none"
          maxLength={1250}
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Auto-posted 1-5 min after publication to boost engagement.
          </p>
          {value && (
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {value.length}/1250
              </span>
              <button
                onClick={() => onChange("")}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
