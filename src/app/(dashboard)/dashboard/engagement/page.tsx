"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  Users,
  ShieldX,
  HelpCircle,
  Loader2,
  Heart,
  MessageCircle,
  Sparkles,
  Send,
  RefreshCw,
  Settings,
  X,
  Rss,
  ThumbsUp,
  Share2,
  Video,
  FileText,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { CommunityConnectBanner } from "@/components/dashboard/engagement/community-connect-banner";

interface FeedPost {
  urn: string;
  authorUrn: string;
  authorName: string;
  authorHeadline: string;
  authorProfilePicture: string;
  commentary: string;
  publishedAt: number;
  mediaType?: "image" | "video" | "document" | "multiImage" | "article";
  imageUrl?: string;
  multiImageUrls?: string[];
  articleUrl?: string;
  articleTitle?: string;
  likes: number;
  comments: number;
  shares: number;
}

interface EngagementData {
  objectives: { dailyLikes: number; dailyComments: number };
  today: { likes: number; comments: number };
  communityConnected: boolean;
  profileName: string;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

export default function EngagementPage() {
  const { data: session } = useSession();
  const isTeamMember = session?.user?.isTeamMember === true;

  const [engagementData, setEngagementData] = useState<EngagementData | null>(null);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Goals dialog
  const [showGoals, setShowGoals] = useState(false);
  const [editLikes, setEditLikes] = useState(10);
  const [editComments, setEditComments] = useState(5);
  const [isSavingGoals, setIsSavingGoals] = useState(false);

  // Per-post interaction states
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likingPost, setLikingPost] = useState<string | null>(null);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [generatingCommentFor, setGeneratingCommentFor] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  const fetchEngagement = useCallback(async () => {
    try {
      const res = await fetch("/api/linkedin/engagement");
      if (res.ok) {
        const data = await res.json();
        setEngagementData(data);
      }
    } catch (err) {
      console.error("Failed to fetch engagement:", err);
    }
  }, []);

  const fetchFeed = useCallback(async () => {
    setIsFeedLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/linkedin/feed");
      if (res.ok) {
        const data = await res.json();
        setFeedPosts(data.posts || []);
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to load feed");
      }
    } catch {
      setError("Failed to load feed");
    } finally {
      setIsFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchEngagement(), fetchFeed()]).finally(() => setIsLoading(false));
  }, [fetchEngagement, fetchFeed]);

  const handleLike = async (postUrn: string) => {
    setLikingPost(postUrn);
    try {
      const res = await fetch("/api/linkedin/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like", postUrn }),
      });
      if (res.ok) {
        const data = await res.json();
        setLikedPosts((prev) => new Set([...prev, postUrn]));
        // Update local like count on the post
        setFeedPosts((prev) =>
          prev.map((p) => p.urn === postUrn ? { ...p, likes: p.likes + 1 } : p)
        );
        if (data.today) {
          setEngagementData((prev) => prev ? { ...prev, today: data.today } : prev);
        }
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
        body: JSON.stringify({ action: "comment", postUrn, text: commentText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setCommentingOn(null);
        setCommentText("");
        // Update local comment count
        setFeedPosts((prev) =>
          prev.map((p) => p.urn === postUrn ? { ...p, comments: p.comments + 1 } : p)
        );
        if (data.today) {
          setEngagementData((prev) => prev ? { ...prev, today: data.today } : prev);
        }
      }
    } finally {
      setIsCommenting(false);
    }
  };

  const handleGenerateComment = async (postUrn: string, postContent: string) => {
    setCommentingOn(postUrn);
    setGeneratingCommentFor(postUrn);
    setCommentText("");
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
      setGeneratingCommentFor(null);
    }
  };

  const handleSaveGoals = async () => {
    setIsSavingGoals(true);
    try {
      const res = await fetch("/api/linkedin/engagement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyLikes: editLikes, dailyComments: editComments }),
      });
      if (res.ok) {
        setEngagementData((prev) => prev ? { ...prev, objectives: { dailyLikes: editLikes, dailyComments: editComments } } : prev);
        setShowGoals(false);
      }
    } finally {
      setIsSavingGoals(false);
    }
  };

  if (isTeamMember) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="py-12 px-8">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-linear-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
                <ShieldX className="w-10 h-10 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                This page contains the team owner&apos;s private LinkedIn engagement data and is not accessible to team members.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const likesProgress = engagementData ? Math.min(100, (engagementData.today.likes / Math.max(1, engagementData.objectives.dailyLikes)) * 100) : 0;
  const commentsProgress = engagementData ? Math.min(100, (engagementData.today.comments / Math.max(1, engagementData.objectives.dailyComments)) * 100) : 0;

  return (
    <FeatureGate feature="engagement">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Engagement</h1>
              <p className="text-muted-foreground text-sm">Like and comment on posts to grow your network</p>
            </div>
          </div>

          {/* Daily goals + controls */}
          {engagementData && (
            <div className="flex items-center gap-3 flex-wrap">
              {/* Likes */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <Heart className="w-4 h-4 text-cyan-500" />
                <span className="text-sm font-bold">{engagementData.today.likes}</span>
                <span className="text-xs text-muted-foreground">/ {engagementData.objectives.dailyLikes}</span>
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${likesProgress}%` }} />
                </div>
              </div>
              {/* Comments */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <MessageCircle className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-bold">{engagementData.today.comments}</span>
                <span className="text-xs text-muted-foreground">/ {engagementData.objectives.dailyComments}</span>
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${commentsProgress}%` }} />
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => { setEditLikes(engagementData.objectives.dailyLikes); setEditComments(engagementData.objectives.dailyComments); setShowGoals(true); }} title="Edit daily goals">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={fetchFeed} disabled={isFeedLoading} title="Refresh feed">
                <RefreshCw className={`w-4 h-4 ${isFeedLoading ? "animate-spin" : ""}`} />
              </Button>
              <Link href="/docs/getting-started/understanding-dashboard" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-cyan-600 transition-colors">
                <HelpCircle className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="min-h-[50vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="py-8 px-6 text-center">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && engagementData && (
          <>
            {/* Community connection / disconnection */}
            {!engagementData.communityConnected ? (
              <CommunityConnectBanner isConnected={false} profileName={engagementData.profileName} />
            ) : (
              <CommunityConnectBanner
                isConnected={true}
                profileName={engagementData.profileName}
                onDisconnect={async () => {
                  await fetch("/api/linkedin/community/disconnect", { method: "POST" });
                  window.location.reload();
                }}
              />
            )}

            {/* Feed loading */}
            {isFeedLoading && feedPosts.length === 0 && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
              </div>
            )}

            {/* Empty feed */}
            {!isFeedLoading && feedPosts.length === 0 && engagementData.communityConnected && (
              <Card>
                <CardContent className="py-16 text-center">
                  <Rss className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No feed posts available. Try refreshing.</p>
                </CardContent>
              </Card>
            )}

            {/* Feed grid - LinkedIn style cards */}
            {feedPosts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {feedPosts.map((post) => (
                  <div
                    key={post.urn}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all flex flex-col"
                  >
                    {/* Author row */}
                    <div className="p-4 pb-0">
                      <div className="flex items-start gap-3 mb-3">
                        {post.authorProfilePicture ? (
                          <img
                            src={post.authorProfilePicture}
                            alt={post.authorName}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-white">
                              {post.authorName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{post.authorName}</p>
                          {post.authorHeadline && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{post.authorHeadline}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {timeAgo(post.publishedAt)}
                          </p>
                        </div>
                      </div>

                      {/* Post text with see more/less */}
                      {post.commentary ? (
                        <div className="text-sm leading-relaxed">
                          <p className={`whitespace-pre-wrap ${expandedPosts.has(post.urn) ? "" : "line-clamp-4"}`}>
                            {post.commentary}
                          </p>
                          {post.commentary.length > 200 && (
                            <button
                              onClick={() => setExpandedPosts((prev) => {
                                const next = new Set(prev);
                                if (next.has(post.urn)) next.delete(post.urn);
                                else next.add(post.urn);
                                return next;
                              })}
                              className="text-muted-foreground hover:text-foreground font-medium text-xs mt-1 transition-colors"
                            >
                              {expandedPosts.has(post.urn) ? "...see less" : "...see more"}
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">(No text)</p>
                      )}
                    </div>

                    {/* Media */}
                    {post.imageUrl && (
                      <div className="mt-3">
                        <img
                          src={post.imageUrl}
                          alt=""
                          className="w-full max-h-64 object-cover"
                        />
                      </div>
                    )}

                    {/* Multi-image preview */}
                    {post.multiImageUrls && post.multiImageUrls.length > 1 && (
                      <div className="mt-3 grid grid-cols-2 gap-0.5">
                        {post.multiImageUrls.slice(0, 4).map((url, i) => (
                          <div key={i} className="relative">
                            <img src={url} alt="" className="w-full h-28 object-cover" />
                            {i === 3 && post.multiImageUrls!.length > 4 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">+{post.multiImageUrls!.length - 4}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Video placeholder */}
                    {post.mediaType === "video" && !post.imageUrl && (
                      <div className="mt-3 mx-4 h-40 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Video className="w-10 h-10 text-slate-400" />
                      </div>
                    )}

                    {/* Document/carousel placeholder */}
                    {post.mediaType === "document" && !post.imageUrl && (
                      <div className="mt-3 mx-4 h-40 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <FileText className="w-10 h-10 text-slate-400" />
                      </div>
                    )}

                    {/* Article preview */}
                    {post.mediaType === "article" && post.articleUrl && (
                      <a href={post.articleUrl} target="_blank" rel="noopener noreferrer" className="mt-3 mx-4 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors block">
                        {post.imageUrl && (
                          <img src={post.imageUrl} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />
                        )}
                        <p className="text-xs font-medium line-clamp-2">{post.articleTitle || post.articleUrl}</p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                          <ExternalLink className="w-3 h-3" />
                          {new URL(post.articleUrl).hostname}
                        </div>
                      </a>
                    )}

                    {/* Social counts */}
                    <div className="px-4 pt-3 mt-auto">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pb-2 border-b border-slate-100 dark:border-slate-800">
                        {post.likes > 0 && (
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" /> {post.likes}
                          </span>
                        )}
                        {post.comments > 0 && (
                          <span>{post.comments} comments</span>
                        )}
                        {post.shares > 0 && (
                          <span>{post.shares} shares</span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="px-2 py-1 flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex-1 text-xs ${likedPosts.has(post.urn) ? "text-cyan-600 dark:text-cyan-400" : ""}`}
                        onClick={() => handleLike(post.urn)}
                        disabled={likingPost === post.urn || likedPosts.has(post.urn)}
                      >
                        {likingPost === post.urn ? (
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        ) : (
                          <ThumbsUp className={`w-4 h-4 mr-1.5 ${likedPosts.has(post.urn) ? "fill-cyan-500 text-cyan-500" : ""}`} />
                        )}
                        {likedPosts.has(post.urn) ? "Liked" : "Like"}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => {
                          if (commentingOn === post.urn) {
                            setCommentingOn(null);
                            setCommentText("");
                          } else {
                            setCommentingOn(post.urn);
                            setCommentText("");
                          }
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-1.5" />
                        Comment
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0"
                        title="AI-generate a comment"
                        onClick={() => handleGenerateComment(post.urn, post.commentary)}
                        disabled={generatingCommentFor === post.urn}
                      >
                        {generatingCommentFor === post.urn ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-amber-500" />
                        )}
                      </Button>
                    </div>

                    {/* Inline comment form */}
                    {commentingOn === post.urn && (
                      <div className="px-4 pb-4 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <Textarea
                          placeholder="Write a comment..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="min-h-18 text-sm resize-none"
                          autoFocus
                        />
                        <div className="flex items-center justify-between">
                          <Button variant="ghost" size="sm" onClick={() => { setCommentingOn(null); setCommentText(""); }}>
                            <X className="w-3.5 h-3.5 mr-1" /> Cancel
                          </Button>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGenerateComment(post.urn, post.commentary)}
                              disabled={generatingCommentFor === post.urn}
                            >
                              {generatingCommentFor === post.urn ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />}
                              AI
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleComment(post.urn)}
                              disabled={isCommenting || !commentText.trim()}
                            >
                              {isCommenting ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                              Post
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Goals dialog */}
        <Dialog open={showGoals} onOpenChange={setShowGoals}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Daily Engagement Goals</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Heart className="w-4 h-4 text-cyan-500" /> Daily Likes
                  </label>
                  <span className="text-sm font-bold">{editLikes}</span>
                </div>
                <Slider value={[editLikes]} onValueChange={([v]) => setEditLikes(v)} min={1} max={100} step={1} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-blue-500" /> Daily Comments
                  </label>
                  <span className="text-sm font-bold">{editComments}</span>
                </div>
                <Slider value={[editComments]} onValueChange={([v]) => setEditComments(v)} min={1} max={50} step={1} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowGoals(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveGoals} disabled={isSavingGoals}>
                {isSavingGoals && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </FeatureGate>
  );
}
