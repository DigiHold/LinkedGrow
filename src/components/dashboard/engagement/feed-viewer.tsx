"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  MessageCircle,
  Share2,
  Loader2,
  RefreshCw,
  Sparkles,
  Send,
  Rss,
} from "lucide-react";

interface FeedPost {
  urn: string;
  author: string;
  commentary: string;
  publishedAt: string;
  socialDetail: {
    likes?: number;
    comments?: number;
    shares?: number;
  } | null;
}

interface FeedViewerProps {
  isConnected: boolean;
  onLogAction?: (type: "like" | "comment", content?: string) => Promise<void>;
}

export function FeedViewer({ isConnected, onLogAction }: FeedViewerProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isGeneratingComment, setIsGeneratingComment] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likingPost, setLikingPost] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    if (!isConnected) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/linkedin/feed");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch feed");
      }

      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch feed");
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleLike = async (postUrn: string) => {
    setLikingPost(postUrn);
    try {
      const res = await fetch("/api/linkedin/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like", postUrn }),
      });
      if (res.ok) {
        setLikedPosts((prev) => new Set([...prev, postUrn]));
        if (onLogAction) await onLogAction("like");
      }
    } finally {
      setLikingPost(null);
    }
  };

  const handleComment = async (postUrn: string) => {
    if (!commentText.trim()) return;
    setIsCommenting(true);
    try {
      const res = await fetch("/api/linkedin/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment",
          postUrn,
          text: commentText.trim(),
        }),
      });
      if (res.ok) {
        setCommentingOn(null);
        setCommentText("");
        if (onLogAction) await onLogAction("comment", commentText.trim());
      }
    } finally {
      setIsCommenting(false);
    }
  };

  const handleGenerateComment = async (postContent: string) => {
    setIsGeneratingComment(true);
    try {
      const res = await fetch("/api/ai/generate-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postContent }),
      });
      if (res.ok) {
        const data = await res.json();
        setCommentText(data.comment || "");
      }
    } finally {
      setIsGeneratingComment(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Rss className="w-4 h-4 text-purple-500" />
            LinkedIn Feed
          </h3>
          <p className="text-muted-foreground text-sm">
            Connect your Community App above to view and interact with your
            LinkedIn feed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Rss className="w-4 h-4 text-purple-500" />
            LinkedIn Feed
          </h3>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={fetchFeed}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {isLoading && posts.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
          {posts.map((post) => (
            <div
              key={post.urn}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <span className="text-xs font-medium">
                    {post.author.slice(-2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium truncate max-w-[200px]">
                    {post.author}
                  </p>
                  {post.publishedAt && (
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-sm mb-3 line-clamp-4 whitespace-pre-wrap">
                {post.commentary}
              </p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                {post.socialDetail?.likes !== undefined && (
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" /> {post.socialDetail.likes}
                  </span>
                )}
                {post.socialDetail?.comments !== undefined && (
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />{" "}
                    {post.socialDetail.comments}
                  </span>
                )}
                {post.socialDetail?.shares !== undefined && (
                  <span className="flex items-center gap-1">
                    <Share2 className="w-3 h-3" /> {post.socialDetail.shares}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(post.urn)}
                  disabled={
                    likingPost === post.urn || likedPosts.has(post.urn)
                  }
                  className={likedPosts.has(post.urn) ? "text-cyan-600" : ""}
                >
                  {likingPost === post.urn ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  ) : (
                    <Heart
                      className={`w-3.5 h-3.5 mr-1 ${likedPosts.has(post.urn) ? "fill-cyan-500" : ""}`}
                    />
                  )}
                  {likedPosts.has(post.urn) ? "Liked" : "Like"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCommentingOn(
                      commentingOn === post.urn ? null : post.urn
                    );
                    setCommentText("");
                  }}
                >
                  <MessageCircle className="w-3.5 h-3.5 mr-1" />
                  Comment
                </Button>
              </div>

              {commentingOn === post.urn && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[60px] text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleComment(post.urn)}
                      disabled={isCommenting || !commentText.trim()}
                    >
                      {isCommenting ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5 mr-1" />
                      )}
                      Post
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGenerateComment(post.commentary)}
                      disabled={isGeneratingComment}
                    >
                      {isGeneratingComment ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                      )}
                      AI
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {!isLoading && posts.length === 0 && !error && (
          <p className="text-muted-foreground text-sm text-center py-8">
            No feed posts available. Try refreshing.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
