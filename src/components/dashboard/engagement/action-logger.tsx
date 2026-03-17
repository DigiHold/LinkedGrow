"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Loader2, Check } from "lucide-react";

interface ActionLoggerProps {
  onLogAction: (type: "like" | "comment", content?: string) => Promise<void>;
}

export function ActionLogger({ onLogAction }: ActionLoggerProps) {
  const [isLoggingLike, setIsLoggingLike] = useState(false);
  const [isLoggingComment, setIsLoggingComment] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogLike = async () => {
    setIsLoggingLike(true);
    try {
      await onLogAction("like");
      setSuccess("Like logged!");
      setTimeout(() => setSuccess(null), 2000);
    } finally {
      setIsLoggingLike(false);
    }
  };

  const handleLogComment = async () => {
    setIsLoggingComment(true);
    try {
      await onLogAction("comment", commentText || undefined);
      setCommentText("");
      setShowCommentInput(false);
      setSuccess("Comment logged!");
      setTimeout(() => setSuccess(null), 2000);
    } finally {
      setIsLoggingComment(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-4">Quick Actions</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Track your engagement by logging likes and comments you make on
          LinkedIn.
        </p>

        {success && (
          <div className="mb-4 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
            <Check className="w-4 h-4" />
            {success}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogLike}
            disabled={isLoggingLike}
          >
            {isLoggingLike ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Heart className="w-4 h-4 mr-2 text-cyan-500" />
            )}
            Log a Like
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCommentInput(!showCommentInput)}
          >
            <MessageCircle className="w-4 h-4 mr-2 text-blue-500" />
            Log a Comment
          </Button>
        </div>

        {showCommentInput && (
          <div className="mt-4 space-y-3">
            <Textarea
              placeholder="Optional: paste the comment you wrote..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleLogComment}
                disabled={isLoggingComment}
              >
                {isLoggingComment && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Log Comment
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCommentInput(false);
                  setCommentText("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
