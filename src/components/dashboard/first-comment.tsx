"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Sparkles, Loader2 } from "lucide-react";

interface FirstCommentProps {
  value: string;
  onChange: (value: string) => void;
  postContent: string;
  onError?: (message: string) => void;
}

export function FirstComment({ value, onChange, postContent, onError }: FirstCommentProps) {
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

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            First Comment
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
            {isGenerating ? "Generating..." : "AI Generate"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Add a value-adding comment - a question, extra insight, or useful link..."
          className="min-h-20 resize-none"
          maxLength={300}
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            Auto-posted 1-5 min after publication to boost engagement.
          </p>
          {value && (
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-muted-foreground">
                {value.length}/300
              </span>
              <button
                onClick={() => onChange("")}
                className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
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
