"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  MessageCircle,
  Linkedin,
  Check,
  AlertCircle,
  Info,
  Loader2,
  Settings,
  Send,
  RefreshCw,
  X,
  ThumbsUp,
  Lightbulb,
  PartyPopper,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedPost {
  id: string;
  author: {
    name: string;
    headline?: string;
    profilePicture?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  liked?: boolean;
}

// Mock feed data for UI development (will be replaced with real API)
const MOCK_FEED: FeedPost[] = [
  {
    id: "1",
    author: {
      name: "Sarah Chen",
      headline: "Product Manager at TechCorp",
      profilePicture: "",
    },
    content: "Just shipped a major feature that our users have been asking for! The power of listening to customer feedback cannot be overstated. What's your best tip for gathering user insights?",
    timestamp: "2h ago",
    likes: 47,
    comments: 12,
    liked: false,
  },
  {
    id: "2",
    author: {
      name: "Marcus Johnson",
      headline: "Founder & CEO at StartupXYZ",
      profilePicture: "",
    },
    content: "Unpopular opinion: The best time to start building your personal brand was 5 years ago. The second best time is today.\n\nStop waiting for the \"perfect\" moment. It doesn't exist.",
    timestamp: "4h ago",
    likes: 234,
    comments: 45,
    liked: true,
  },
  {
    id: "3",
    author: {
      name: "Emily Rodriguez",
      headline: "Senior Software Engineer",
      profilePicture: "",
    },
    content: "Three things I wish I knew when I started my tech career:\n\n1. Soft skills matter more than you think\n2. Imposter syndrome never fully goes away\n3. Your network is your net worth\n\nWhat would you add to this list?",
    timestamp: "6h ago",
    likes: 89,
    comments: 28,
    liked: false,
  },
];

export default function EngagementPage() {
  const { data: session } = useSession();
  const [isConnecting, setIsConnecting] = useState(false);
  const [communityConnected, setCommunityConnected] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Daily objectives
  const [likesObjective, setLikesObjective] = useState(10);
  const [commentsObjective, setCommentsObjective] = useState(5);
  const [todayLikes, setTodayLikes] = useState(0);
  const [todayComments, setTodayComments] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [tempLikesObjective, setTempLikesObjective] = useState(10);
  const [tempCommentsObjective, setTempCommentsObjective] = useState(5);

  // Feed state
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);
  const [likingPost, setLikingPost] = useState<string | null>(null);

  // Check if community app is connected
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch("/api/linkedin/community/status");
        if (response.ok) {
          const data = await response.json();
          setCommunityConnected(data.connected);
          if (data.connected) {
            loadEngagementData();
            loadFeed();
          }
        }
      } catch (error) {
        console.error("Failed to check community connection:", error);
      }
    };
    checkConnection();
  }, []);

  const loadEngagementData = async () => {
    try {
      const response = await fetch("/api/linkedin/engagement/today");
      if (response.ok) {
        const data = await response.json();
        setTodayLikes(data.likes || 0);
        setTodayComments(data.comments || 0);
        setLikesObjective(data.likesObjective || 10);
        setCommentsObjective(data.commentsObjective || 5);
        setTempLikesObjective(data.likesObjective || 10);
        setTempCommentsObjective(data.commentsObjective || 5);
      }
    } catch (error) {
      console.error("Failed to load engagement data:", error);
    }
  };

  const loadFeed = async () => {
    setLoadingFeed(true);
    try {
      // TODO: Replace with real API call when Community Management API is approved
      // const response = await fetch("/api/linkedin/feed");
      // const data = await response.json();
      // setFeed(data.posts || []);

      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      setFeed(MOCK_FEED);
    } catch (error) {
      console.error("Failed to load feed:", error);
    } finally {
      setLoadingFeed(false);
    }
  };

  const handleConnectCommunity = () => {
    setIsConnecting(true);
    setMessage(null);

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      "/api/linkedin/auth?app=community&popup=true",
      "linkedin-community-auth",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "linkedin-success") {
        setCommunityConnected(true);
        setMessage({ type: "success", text: "LinkedIn engagement features connected!" });
        setIsConnecting(false);
        loadEngagementData();
        loadFeed();
        window.removeEventListener("message", handleMessage);
      } else if (event.data.type === "linkedin-error") {
        setMessage({ type: "error", text: event.data.error || "Failed to connect" });
        setIsConnecting(false);
        window.removeEventListener("message", handleMessage);
      }
    };

    window.addEventListener("message", handleMessage);

    const checkPopup = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkPopup);
        setIsConnecting(false);
        window.removeEventListener("message", handleMessage);
      }
    }, 500);
  };

  const handleDisconnectCommunity = async () => {
    try {
      const response = await fetch("/api/linkedin/community/disconnect", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to disconnect");
      }

      setCommunityConnected(false);
      setFeed([]);
      setMessage({ type: "success", text: "Engagement features disconnected" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to disconnect",
      });
    }
  };

  const handleSaveObjectives = async () => {
    try {
      const response = await fetch("/api/linkedin/engagement/objectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          likesObjective: tempLikesObjective,
          commentsObjective: tempCommentsObjective,
        }),
      });

      if (response.ok) {
        setLikesObjective(tempLikesObjective);
        setCommentsObjective(tempCommentsObjective);
        setShowSettings(false);
      }
    } catch (error) {
      console.error("Failed to save objectives:", error);
    }
  };

  const handleLikePost = async (postId: string) => {
    setLikingPost(postId);
    try {
      // TODO: Replace with real API call
      // await fetch(`/api/linkedin/posts/${postId}/like`, { method: "POST" });

      await new Promise(resolve => setTimeout(resolve, 300));

      setFeed(prev => prev.map(post =>
        post.id === postId
          ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
          : post
      ));

      // Track engagement
      const post = feed.find(p => p.id === postId);
      if (post && !post.liked) {
        setTodayLikes(prev => prev + 1);
        await fetch("/api/linkedin/engagement/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "like" }),
        }).catch(() => {});
      }
    } catch (error) {
      console.error("Failed to like post:", error);
    } finally {
      setLikingPost(null);
    }
  };

  const handleSubmitComment = async (postId: string) => {
    const commentText = commentTexts[postId]?.trim();
    if (!commentText) return;

    setSubmittingComment(postId);
    try {
      // TODO: Replace with real API call
      // await fetch(`/api/linkedin/posts/${postId}/comment`, {
      //   method: "POST",
      //   body: JSON.stringify({ text: commentText }),
      // });

      await new Promise(resolve => setTimeout(resolve, 500));

      setFeed(prev => prev.map(post =>
        post.id === postId ? { ...post, comments: post.comments + 1 } : post
      ));

      setCommentTexts(prev => ({ ...prev, [postId]: "" }));
      setExpandedComments(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });

      // Track engagement
      setTodayComments(prev => prev + 1);
      await fetch("/api/linkedin/engagement/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "comment" }),
      }).catch(() => {});
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setSubmittingComment(null);
    }
  };

  const toggleCommentSection = (postId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  // Calculate progress percentages
  const likesProgress = Math.min((todayLikes / likesObjective) * 100, 100);
  const commentsProgress = Math.min((todayComments / commentsObjective) * 100, 100);

  // SVG circle calculations
  const likesCircumference = 2 * Math.PI * 36; // r=36
  const commentsCircumference = 2 * Math.PI * 30; // r=30
  const likesOffset = likesCircumference - (likesCircumference * likesProgress) / 100;
  const commentsOffset = commentsCircumference - (commentsCircumference * commentsProgress) / 100;

  return (
    <FeatureGate feature="engagement">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Header with Daily Objectives */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              Engagement
            </h1>
            <p className="text-muted-foreground mt-1">
              Like and comment on posts to grow your network
            </p>
          </div>

          {/* Daily Objectives Card */}
          {communityConnected && (
            <Card className="w-full sm:w-auto">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Circular Progress */}
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      {/* Background circles */}
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="30"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      {/* Progress circles */}
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="url(#likesGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={likesCircumference}
                        strokeDashoffset={likesOffset}
                        className="transition-all duration-500"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="30"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={commentsCircumference}
                        strokeDashoffset={commentsOffset}
                        className="transition-all duration-500"
                      />
                      <defs>
                        <linearGradient id="likesGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    {/* Profile picture in center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                        {session?.user?.name?.charAt(0) || "U"}
                      </div>
                    </div>
                  </div>

                  {/* Progress bars and settings */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Today&apos;s Goals</span>
                      <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      >
                        <Settings className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>

                    {/* Likes progress */}
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-4 h-4 text-cyan-500" />
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-cyan-500 to-blue-600 transition-all duration-500"
                          style={{ width: `${likesProgress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-12 text-right">
                        {todayLikes}/{likesObjective}
                      </span>
                    </div>

                    {/* Comments progress */}
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-emerald-500" />
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${commentsProgress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-12 text-right">
                        {todayComments}/{commentsObjective}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Settings dropdown */}
                {showSettings && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <p className="text-sm font-medium">Daily Objectives</p>
                    <div className="flex items-center gap-3">
                      <Heart className="w-4 h-4 text-cyan-500" />
                      <span className="text-sm w-20">Likes</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={tempLikesObjective}
                        onChange={(e) => setTempLikesObjective(parseInt(e.target.value) || 1)}
                        className="w-20 h-8 px-2 border rounded text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm w-20">Comments</span>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={tempCommentsObjective}
                        onChange={(e) => setTempCommentsObjective(parseInt(e.target.value) || 1)}
                        className="w-20 h-8 px-2 border rounded text-sm"
                      />
                    </div>
                    <Button size="sm" onClick={handleSaveObjectives} className="w-full">
                      Save
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={cn(
            "p-3 rounded-lg text-sm flex items-center gap-2",
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
          )}>
            {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        {/* Not Connected State */}
        {!communityConnected && (
          <Card className="border-linkedin/30 bg-linear-to-br from-linkedin/5 to-linkedin/10">
            <CardContent className="py-8">
              <div className="max-w-md mx-auto text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-linkedin/10 flex items-center justify-center">
                  <Linkedin className="w-8 h-8 text-linkedin" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Connect LinkedIn for Engagement</h3>
                <p className="text-muted-foreground mb-6">
                  View your feed and engage with posts directly from LinkedGrow
                </p>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6 text-left">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      This requires LinkedIn&apos;s Community Management API. Connect to like and comment on posts in your feed.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleConnectCommunity}
                  disabled={isConnecting}
                  className="bg-linkedin hover:bg-linkedin/90 text-white px-8"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Linkedin className="w-4 h-4 mr-2" />
                      Connect LinkedIn
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connected State - Feed */}
        {communityConnected && (
          <>
            {/* Feed Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your Feed</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadFeed}
                  disabled={loadingFeed}
                >
                  <RefreshCw className={cn("w-4 h-4 mr-2", loadingFeed && "animate-spin")} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectCommunity}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Disconnect
                </Button>
              </div>
            </div>

            {/* Feed Posts */}
            {loadingFeed ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : feed.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No posts in your feed yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {feed.map((post) => (
                  <Card key={post.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      {/* Post Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold shrink-0">
                          {post.author.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{post.author.name}</p>
                          {post.author.headline && (
                            <p className="text-sm text-muted-foreground truncate">{post.author.headline}</p>
                          )}
                          <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                        </div>
                      </div>

                      {/* Post Content */}
                      <p className="whitespace-pre-line text-sm mb-4">{post.content}</p>

                      {/* Post Stats */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3 pb-3 border-b">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {post.likes}
                        </span>
                        <span>{post.comments} comments</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLikePost(post.id)}
                          disabled={likingPost === post.id}
                          className={cn(
                            "flex-1",
                            post.liked && "text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20"
                          )}
                        >
                          {likingPost === post.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Heart className={cn("w-4 h-4 mr-2", post.liked && "fill-current")} />
                          )}
                          {post.liked ? "Liked" : "Like"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCommentSection(post.id)}
                          className={cn(
                            "flex-1",
                            expandedComments.has(post.id) && "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                          )}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Comment
                        </Button>
                      </div>

                      {/* Comment Input */}
                      {expandedComments.has(post.id) && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                              {session?.user?.name?.charAt(0) || "U"}
                            </div>
                            <div className="flex-1">
                              <Textarea
                                placeholder="Write a comment..."
                                value={commentTexts[post.id] || ""}
                                onChange={(e) => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                                className="min-h-20 resize-none"
                              />
                              <div className="flex justify-end mt-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSubmitComment(post.id)}
                                  disabled={!commentTexts[post.id]?.trim() || submittingComment === post.id}
                                >
                                  {submittingComment === post.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Send className="w-4 h-4 mr-2" />
                                      Post
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Info Note */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Note:</strong> Feed data is currently simulated. Once LinkedIn approves your Community Management API access (Standard Tier), you&apos;ll see your real LinkedIn feed here.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </FeatureGate>
  );
}
