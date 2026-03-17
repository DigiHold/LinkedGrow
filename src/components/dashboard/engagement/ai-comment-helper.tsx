"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Copy,
  Check,
  Loader2,
  MessageCircle,
} from "lucide-react";

export function AiCommentHelper() {
  const [postContent, setPostContent] = useState("");
  const [generatedComment, setGeneratedComment] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!postContent.trim()) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedComment("");

    try {
      const res = await fetch("/api/ai/generate-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postContent: postContent.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate comment");
      }

      const data = await res.json();
      setGeneratedComment(data.comment || "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate comment"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedComment);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          AI Comment Helper
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Paste a LinkedIn post and generate a thoughtful comment using AI. Copy
          it and post it on LinkedIn.
        </p>

        <Textarea
          placeholder="Paste a LinkedIn post here..."
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          className="min-h-[100px] mb-3"
        />

        <Button
          variant="primary"
          size="sm"
          onClick={handleGenerate}
          disabled={isGenerating || !postContent.trim()}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Generate Comment
        </Button>

        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {generatedComment && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Generated Comment
                  </span>
                </div>
                <p className="text-sm">{generatedComment}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleCopy}
                className="shrink-0"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
