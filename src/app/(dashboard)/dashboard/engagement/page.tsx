"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ThumbsUp,
  Share2,
  Plus,
  Trash2,
  UserPlus,
  AlertCircle,
  FolderOpen,
  Check,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  FileText,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { CommunityConnectBanner } from "@/components/dashboard/engagement/community-connect-banner";
import { LikeIcon, LikedIcon, CommentIcon, ReactionMenu, REACTIONS } from "@/components/dashboard/engagement/linkedin-icons";

// ============================================
// TYPES
// ============================================

interface ListProfile {
  id: string;
  listId: string;
  vanityName: string;
  displayName: string | null;
  headline: string | null;
  profilePictureUrl: string | null;
}

interface EngagementList {
  id: string;
  name: string;
  profiles: ListProfile[];
}

interface FeedPost {
  activityUrn: string;
  text: string;
  datePublished: string;
  likes: number;
  comments: number;
  reposts: number;
  postUrl: string;
  imageUrl: string | null;
  mediaType: "image" | "video" | "carousel" | "article" | null;
  carouselSlides: string[];
  videoThumbnailUrl: string | null;
  authorVanityName: string;
  authorDisplayName: string;
  authorHeadline: string;
  authorProfilePictureUrl: string;
}

interface EngagementData {
  objectives: { dailyLikes: number; dailyComments: number; postsPerProfile: number };
  today: { likes: number; comments: number };
  communityConnected: boolean;
  profileName: string;
}

// ============================================
// HELPERS
// ============================================

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
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

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

/**
 * Truncate text like LinkedIn: max ~3 visual lines.
 * Each \n counts as a line. Long lines (~55 chars in a card) wrap.
 */
function linkedInTruncate(text: string): { truncated: string; isTruncated: boolean } {
  const MAX_VISUAL_LINES = 3;
  const CHARS_PER_LINE = 55; // approximate for card width

  const lines = text.split("\n");
  let visualLines = 0;
  let charCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Empty lines count as 1 visual line
    const lineVisualLines = line.length === 0 ? 1 : Math.ceil(line.length / CHARS_PER_LINE);

    if (visualLines + lineVisualLines > MAX_VISUAL_LINES) {
      // This line would exceed the limit
      const remainingLines = MAX_VISUAL_LINES - visualLines;
      const charsToKeep = remainingLines * CHARS_PER_LINE;
      // Cut within this line at a word boundary
      const cutText = line.substring(0, charsToKeep);
      const lastSpace = cutText.lastIndexOf(" ");
      const safeCut = lastSpace > charsToKeep * 0.5 ? lastSpace : charsToKeep;
      charCount += safeCut;
      return {
        truncated: text.substring(0, charCount + safeCut > text.length ? text.length : charCount + safeCut),
        isTruncated: true,
      };
    }

    visualLines += lineVisualLines;
    charCount += line.length + 1; // +1 for \n

    if (visualLines >= MAX_VISUAL_LINES && i < lines.length - 1) {
      return {
        truncated: text.substring(0, charCount - 1),
        isTruncated: true,
      };
    }
  }

  return { truncated: text, isTruncated: false };
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
      <path d="m21 3-9 9" />
      <path d="M15 3h6v6" />
    </svg>
  );
}

// ============================================
// CAROUSEL VIEWER
// ============================================

function CarouselViewer({ slides }: { slides: string[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  if (slides.length === 0) return null;
  return (
    <div className="relative mt-3 group">
      <img
        src={slides[currentSlide]}
        alt={`Slide ${currentSlide + 1}`}
        className="w-full object-contain max-h-80 bg-slate-50 dark:bg-slate-800"
      />
      {slides.length > 1 && (
        <>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium">
            {currentSlide + 1} / {slides.length}
          </div>
          {currentSlide > 0 && (
            <button
              onClick={() => setCurrentSlide((p) => p - 1)}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {currentSlide < slides.length - 1 && (
            <button
              onClick={() => setCurrentSlide((p) => p + 1)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ============================================
// PAGE
// ============================================

export default function EngagementPage() {
  return (
    <FeatureGate feature="engagement">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        <div className="flex flex-col items-center justify-center text-center py-16 sm:py-24 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold">Engagement Tools</h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-md">
              Like, comment, and interact with LinkedIn posts directly from your dashboard. Build meaningful connections and grow your network faster.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Coming Soon</span>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm">
            We are finalizing the LinkedIn Community Management API integration. This feature will be available shortly.
          </p>
        </div>
      </div>
    </FeatureGate>
  );
}

// ============================================
// ORIGINAL ENGAGEMENT PAGE (preserved for when feature launches)
// ============================================

function _EngagementPageFull() {
  const { data: session } = useSession();
  const isTeamMember = session?.user?.isTeamMember === true;

  // Data states
  const [engagementData, setEngagementData] = useState<EngagementData | null>(null);
  const [lists, setLists] = useState<EngagementList[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [feedErrors, setFeedErrors] = useState<{ vanityName: string; error: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFeedLoading, setIsFeedLoading] = useState(false);

  // Active list filter
  const [activeListId, setActiveListId] = useState<string | null>(null);

  // List management dialog
  const [showListDialog, setShowListDialog] = useState(false);
  const [dialogView, setDialogView] = useState<"lists" | "list-detail">("lists");
  const [dialogListId, setDialogListId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState("");
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [deletingListId, setDeletingListId] = useState<string | null>(null);
  const [renamingListId, setRenamingListId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [newVanityName, setNewVanityName] = useState("");
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [addProfileError, setAddProfileError] = useState<string | null>(null);

  // Settings dialog
  const [showSettings, setShowSettings] = useState(false);
  const [editLikes, setEditLikes] = useState(10);
  const [editComments, setEditComments] = useState(5);
  const [editPostsPerProfile, setEditPostsPerProfile] = useState(2);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Post interaction states
  // Map of postUrn -> reactionType (e.g., "LIKE", "PRAISE", "EMPATHY")
  const [likedPosts, setLikedPosts] = useState<Map<string, string>>(new Map());
  const [commentedPosts, setCommentedPosts] = useState<Set<string>>(new Set());
  const [likingPost, setLikingPost] = useState<string | null>(null);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [generatingCommentFor, setGeneratingCommentFor] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [reactionMenuPost, setReactionMenuPost] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const reactionMenuTimer = useRef<NodeJS.Timeout | null>(null);

  const showReactionMenu = (postUrn: string) => {
    if (reactionMenuTimer.current) clearTimeout(reactionMenuTimer.current);
    setReactionMenuPost(postUrn);
  };

  const hideReactionMenu = () => {
    // 500ms delay before hiding (like LinkedIn)
    reactionMenuTimer.current = setTimeout(() => setReactionMenuPost(null), 500);
  };

  // ============================================
  // FETCHERS
  // ============================================

  const fetchEngagement = useCallback(async () => {
    try {
      const res = await fetch("/api/linkedin/engagement");
      if (res.ok) setEngagementData(await res.json());
    } catch (err) {
      console.error("Failed to fetch engagement:", err);
    }
  }, []);

  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch("/api/engagement/lists");
      if (res.ok) {
        const data = await res.json();
        setLists(data.lists || []);
      }
    } catch (err) {
      console.error("Failed to fetch lists:", err);
    }
  }, []);

  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchFeed = useCallback(async (listId?: string | null, forceRefresh = false) => {
    setIsFeedLoading(true);
    setFeedErrors([]);
    try {
      let url = listId ? `/api/engagement/feed?listId=${listId}` : "/api/engagement/feed";
      url += (url.includes("?") ? "&" : "?") + "limit=12&offset=0";
      if (forceRefresh) url += "&forceRefresh=true";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFeedPosts(data.posts || []);
        setHasMorePosts(data.hasMore ?? false);
        setFeedErrors(data.errors || []);
      } else {
        const err = await res.json().catch(() => ({ error: "Failed to load feed" }));
        setFeedErrors([{ vanityName: "", error: err.error }]);
      }
    } catch {
      setFeedErrors([{ vanityName: "", error: "Failed to load feed" }]);
    } finally {
      setIsFeedLoading(false);
    }
  }, []);

  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !hasMorePosts) return;
    setIsLoadingMore(true);
    try {
      let url = activeListId ? `/api/engagement/feed?listId=${activeListId}` : "/api/engagement/feed";
      url += (url.includes("?") ? "&" : "?") + `limit=12&offset=${feedPosts.length}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const newPosts = data.posts || [];
        if (newPosts.length > 0) {
          setFeedPosts((prev) => [...prev, ...newPosts]);
        }
        setHasMorePosts(data.hasMore ?? false);
      }
    } catch { /* ignore */ } finally {
      setIsLoadingMore(false);
    }
  }, [activeListId, feedPosts.length, isLoadingMore, hasMorePosts]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchEngagement(), fetchLists()]).finally(() => setIsLoading(false));
  }, [fetchEngagement, fetchLists]);

  useEffect(() => {
    if (!isLoading && lists.length > 0) fetchFeed(activeListId);
  }, [isLoading, lists.length, activeListId, fetchFeed]);

  // Load which posts the user has already liked/commented (from DB)
  useEffect(() => {
    if (feedPosts.length === 0) return;
    // Load engagement history for visible posts
    const postUrns = feedPosts.map((p) => p.activityUrn);
    fetch("/api/engagement/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postUrns }),
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setLikedPosts(new Map(Object.entries(data.liked || {})));
          setCommentedPosts(new Set(data.commented || []));
        }
      })
      .catch(() => {});
  }, [feedPosts]);

  // Infinite scroll - load more posts from API when scrolling near bottom
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMorePosts]);

  // ============================================
  // LIST MANAGEMENT (DIALOG)
  // ============================================

  const openListDialog = () => {
    setShowListDialog(true);
    setDialogView("lists");
    setDialogListId(null);
    setNewListName("");
    setNewVanityName("");
    setAddProfileError(null);
  };

  const openListDetail = (listId: string) => {
    setDialogView("list-detail");
    setDialogListId(listId);
    setNewVanityName("");
    setAddProfileError(null);
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    setIsCreatingList(true);
    try {
      const res = await fetch("/api/engagement/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newListName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setLists((prev) => [...prev, data.list]);
        setNewListName("");
        // Auto-enter the new list
        openListDetail(data.list.id);
      }
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleDeleteList = async (listId: string) => {
    setDeletingListId(listId);
    try {
      const res = await fetch(`/api/engagement/lists/${listId}`, { method: "DELETE" });
      if (res.ok) {
        setLists((prev) => prev.filter((l) => l.id !== listId));
        if (activeListId === listId) setActiveListId(null);
        if (dialogListId === listId) setDialogView("lists");
      }
    } finally {
      setDeletingListId(null);
    }
  };

  const handleRenameList = async (listId: string) => {
    if (!renameValue.trim()) return;
    try {
      const res = await fetch(`/api/engagement/lists/${listId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      if (res.ok) {
        setLists((prev) => prev.map((l) => l.id === listId ? { ...l, name: renameValue.trim() } : l));
        setRenamingListId(null);
      }
    } catch { /* ignore */ }
  };

  const handleAddProfile = async (listId: string) => {
    if (!newVanityName.trim()) return;
    setIsAddingProfile(true);
    setAddProfileError(null);
    try {
      const res = await fetch(`/api/engagement/lists/${listId}/profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vanityName: newVanityName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setLists((prev) =>
          prev.map((l) => l.id === listId ? { ...l, profiles: [...l.profiles, data.profile] } : l)
        );
        setNewVanityName("");
        fetchFeed(activeListId);
      } else {
        setAddProfileError(data.error || "Failed to add profile");
      }
    } catch {
      setAddProfileError("Failed to add profile");
    } finally {
      setIsAddingProfile(false);
    }
  };

  const handleRemoveProfile = async (listId: string, profileId: string) => {
    try {
      const res = await fetch(`/api/engagement/lists/${listId}/profiles?profileId=${profileId}`, { method: "DELETE" });
      if (res.ok) {
        setLists((prev) =>
          prev.map((l) => l.id === listId ? { ...l, profiles: l.profiles.filter((p) => p.id !== profileId) } : l)
        );
      }
    } catch { /* ignore */ }
  };

  // ============================================
  // POST INTERACTIONS
  // ============================================

  const [interactError, setInteractError] = useState<string | null>(null);

  const handleReaction = async (postUrn: string, reactionType = "LIKE") => {
    setLikingPost(postUrn);
    setReactionMenuPost(null);
    setInteractError(null);
    try {
      const res = await fetch("/api/engagement/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like", postUrn, reactionType }),
      });
      const data = await res.json();
      if (res.ok) {
        setLikedPosts((prev) => new Map([...prev, [postUrn, reactionType]]));
        setFeedPosts((prev) => prev.map((p) => p.activityUrn === postUrn ? { ...p, likes: p.likes + 1 } : p));
        if (data.today) setEngagementData((prev) => prev ? { ...prev, today: data.today } : prev);
      } else {
        setInteractError(data.error || "Reaction failed");
      }
    } catch {
      setInteractError("Failed to react to post");
    } finally {
      setLikingPost(null);
    }
  };

  const handleComment = async (postUrn: string) => {
    if (!commentText.trim()) return;
    setIsCommenting(true);
    try {
      const res = await fetch("/api/engagement/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", postUrn, text: commentText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setCommentingOn(null);
        setCommentText("");
        setCommentedPosts((prev) => new Set([...prev, postUrn]));
        setFeedPosts((prev) => prev.map((p) => p.activityUrn === postUrn ? { ...p, comments: p.comments + 1 } : p));
        if (data.today) setEngagementData((prev) => prev ? { ...prev, today: data.today } : prev);
      }
    } finally {
      setIsCommenting(false);
    }
  };

  const handleGenerateComment = async (postUrn: string, postContent: string) => {
    if (generatingCommentFor) {
      setInteractError("Please wait for the current AI comment to finish generating.");
      return;
    }
    setInteractError(null);
    setCommentingOn(postUrn);
    setGeneratingCommentFor(postUrn);
    setCommentText("");
    try {
      const res = await fetch("/api/ai/generate-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postContent, isEngagement: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setCommentText(data.comment || "");
      }
    } finally {
      setGeneratingCommentFor(null);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/linkedin/engagement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyLikes: editLikes, dailyComments: editComments, postsPerProfile: editPostsPerProfile }),
      });
      if (res.ok) {
        setEngagementData((prev) => prev ? { ...prev, objectives: { dailyLikes: editLikes, dailyComments: editComments, postsPerProfile: editPostsPerProfile } } : prev);
        setShowSettings(false);
      }
    } finally {
      setIsSavingSettings(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

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
              <p className="text-muted-foreground">This page is not accessible to team members.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const likesProgress = engagementData ? Math.min(100, (engagementData.today.likes / Math.max(1, engagementData.objectives.dailyLikes)) * 100) : 0;
  const commentsProgress = engagementData ? Math.min(100, (engagementData.today.comments / Math.max(1, engagementData.objectives.dailyComments)) * 100) : 0;
  const totalProfiles = lists.reduce((sum, l) => sum + l.profiles.length, 0);
  const dialogList = dialogListId ? lists.find((l) => l.id === dialogListId) : null;

  return (
    <FeatureGate feature="engagement">
      <div className="max-w-400 mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Engagement</h1>
              <p className="text-muted-foreground text-sm">Follow LinkedIn profiles and engage with their posts</p>
            </div>
          </div>

          {engagementData && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <Heart className="w-4 h-4 text-cyan-500" />
                <span className="text-sm font-bold">{engagementData.today.likes}</span>
                <span className="text-xs text-muted-foreground">/ {engagementData.objectives.dailyLikes}</span>
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${likesProgress}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <MessageCircle className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-bold">{engagementData.today.comments}</span>
                <span className="text-xs text-muted-foreground">/ {engagementData.objectives.dailyComments}</span>
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${commentsProgress}%` }} />
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => { setEditLikes(engagementData.objectives.dailyLikes); setEditComments(engagementData.objectives.dailyComments); setEditPostsPerProfile(engagementData.objectives.postsPerProfile); setShowSettings(true); }} title="Engagement settings">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => fetchFeed(activeListId, true)} disabled={isFeedLoading} title="Refresh feed (clear cache)">
                <RefreshCw className={`w-4 h-4 ${isFeedLoading ? "animate-spin" : ""}`} />
              </Button>
              <Link href="/docs/getting-started/understanding-dashboard" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-cyan-600 transition-colors">
                <HelpCircle className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="min-h-[50vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        )}

        {!isLoading && engagementData && (
          <>
            {/* Community App connection */}
            {!engagementData.communityConnected ? (
              <CommunityConnectBanner isConnected={false} profileName={engagementData.profileName} />
            ) : (
              <CommunityConnectBanner isConnected={true} profileName={engagementData.profileName} onDisconnect={async () => { await fetch("/api/linkedin/community/disconnect", { method: "POST" }); window.location.reload(); }} />
            )}

            {/* List filter tabs + manage button */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveListId(null)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeListId === null ? "bg-cyan-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
              >
                All ({totalProfiles})
              </button>
              {lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => setActiveListId(list.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeListId === list.id ? "bg-cyan-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
                >
                  {list.name} ({list.profiles.length})
                </button>
              ))}
              <button
                onClick={openListDialog}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-cyan-100 hover:text-cyan-600 dark:hover:bg-cyan-900/30 dark:hover:text-cyan-400 flex items-center justify-center transition-colors"
                title="Manage lists"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Empty state */}
            {lists.length === 0 && !isFeedLoading && (
              <Card>
                <CardContent className="py-16 text-center">
                  <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Get started with engagement</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                    Click the <strong>+</strong> button above to create a list and add LinkedIn profiles you want to engage with.
                  </p>
                  <Button variant="primary" onClick={openListDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First List
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Errors */}
            {(feedErrors.length > 0 || interactError) && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-sm">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-amber-700 dark:text-amber-300">
                  {interactError && <p>{interactError}</p>}
                  {feedErrors.map((e, i) => <p key={i}>{e.vanityName ? `${e.vanityName}: ${e.error}` : e.error}</p>)}
                </div>
              </div>
            )}

            {/* Feed loading */}
            {isFeedLoading && feedPosts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                <p className="text-muted-foreground text-sm">Fetching posts from LinkedIn profiles...</p>
              </div>
            )}

            {/* Post Feed Grid */}
            {feedPosts.length > 0 && (<>
              <div className="columns-1 md:columns-2 xl:columns-3 gap-4 space-y-4">
                {feedPosts.map((post) => (
                  <div key={post.activityUrn} className="break-inside-avoid rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all flex flex-col">
                    {/* Author */}
                    <div className="p-4 pb-0">
                      <div className="flex items-start gap-3 mb-3">
                        {post.authorProfilePictureUrl ? (
                          <img src={post.authorProfilePictureUrl} alt={post.authorDisplayName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-white">{post.authorDisplayName.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase()}</span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <a href={`https://www.linkedin.com/in/${post.authorVanityName}/`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold truncate block hover:text-cyan-600 transition-colors">{post.authorDisplayName}</a>
                          {post.authorHeadline && <p className="text-xs text-muted-foreground line-clamp-1">{post.authorHeadline}</p>}
                          <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(post.datePublished)}</p>
                        </div>
                        {post.postUrl && (
                          <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-muted-foreground hover:text-cyan-600 transition-colors shrink-0" title="View on LinkedIn">
                            <ExternalLinkIcon className="w-4 h-4" />
                          </a>
                        )}
                      </div>

                      {/* Post text - LinkedIn-style truncation */}
                      {post.text ? (() => {
                        const isExpanded = expandedPosts.has(post.activityUrn);
                        const { truncated, isTruncated } = linkedInTruncate(post.text);
                        return (
                          <div className="text-sm leading-relaxed">
                            <p className="whitespace-pre-wrap">{isExpanded ? post.text : truncated}{!isExpanded && isTruncated && (
                              <button
                                onClick={() => setExpandedPosts((prev) => { const next = new Set(prev); next.add(post.activityUrn); return next; })}
                                className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                              > ...more</button>
                            )}</p>
                          </div>
                        );
                      })() : (
                        <p className="text-sm text-muted-foreground italic">(Shared content)</p>
                      )}
                    </div>

                    {/* Media: Carousel */}
                    {post.mediaType === "carousel" && post.carouselSlides.length > 0 && (
                      <CarouselViewer slides={post.carouselSlides} />
                    )}

                    {/* Media: Video */}
                    {post.mediaType === "video" && post.videoThumbnailUrl && (
                      <div className="relative mt-3">
                        <img src={post.videoThumbnailUrl} alt="" className="w-full object-contain" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Media: Single image */}
                    {post.mediaType === "image" && post.imageUrl && (
                      <div className="mt-3">
                        <img src={post.imageUrl} alt="" className="w-full object-contain" />
                      </div>
                    )}

                    {/* Media: No type but has image */}
                    {!post.mediaType && post.imageUrl && (
                      <div className="mt-3">
                        <img src={post.imageUrl} alt="" className="w-full object-contain" />
                      </div>
                    )}

                    {/* Social counts */}
                    <div className="px-4 pt-3 mt-auto">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pb-2 border-b border-slate-100 dark:border-slate-800">
                        {post.likes > 0 && <span className="flex items-center gap-1"><LikedIcon className="w-4 h-4" /> {formatCount(post.likes)}</span>}
                        {post.comments > 0 && <span className="flex items-center gap-1"><CommentIcon className="w-3 h-3" /> {formatCount(post.comments)}</span>}
                        {post.reposts > 0 && <span className="flex items-center gap-1"><Share2 className="w-3 h-3" /> {formatCount(post.reposts)}</span>}
                        {post.likes === 0 && post.comments === 0 && post.reposts === 0 && <span className="opacity-50">No reactions yet</span>}
                      </div>
                    </div>

                    {/* Actions - LinkedIn style */}
                    <div className="px-2 py-1 flex items-center">
                      {/* Like button + reaction menu wrapper - single hover area */}
                      <div
                        className="flex-1 relative"
                        onMouseEnter={() => !likedPosts.has(post.activityUrn) && engagementData.communityConnected && showReactionMenu(post.activityUrn)}
                        onMouseLeave={hideReactionMenu}
                      >
                        {reactionMenuPost === post.activityUrn && (
                          <div className="absolute bottom-full left-0 mb-1 z-10">
                            <ReactionMenu onReact={(type) => handleReaction(post.activityUrn, type)} />
                          </div>
                        )}
                        {(() => {
                          const userReaction = likedPosts.get(post.activityUrn);
                          const reactionInfo = userReaction ? REACTIONS.find((r) => r.type === userReaction) : null;
                          return (
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`w-full text-xs ${userReaction ? "text-[#378fe9] font-semibold" : ""}`}
                              onClick={() => handleReaction(post.activityUrn)}
                              disabled={likingPost === post.activityUrn || !!userReaction || !engagementData.communityConnected}
                            >
                              {likingPost === post.activityUrn ? (
                                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                              ) : reactionInfo ? (
                                <img src={reactionInfo.src} alt={reactionInfo.label} className="w-4 h-4 mr-1.5" />
                              ) : (
                                <LikeIcon className="w-4 h-4 mr-1.5" />
                              )}
                              {reactionInfo ? reactionInfo.label : "Like"}
                            </Button>
                          );
                        })()}
                      </div>
                      <Button variant="ghost" size="sm" className={`flex-1 text-xs ${commentedPosts.has(post.activityUrn) ? "text-[#378fe9]" : ""}`} onClick={() => { if (commentingOn === post.activityUrn) { setCommentingOn(null); setCommentText(""); } else { setCommentingOn(post.activityUrn); setCommentText(""); } }} disabled={!engagementData.communityConnected}>
                        <CommentIcon className="w-4 h-4 mr-1.5" /> Comment
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="shrink-0" title="AI comment" onClick={() => handleGenerateComment(post.activityUrn, post.text)} disabled={generatingCommentFor === post.activityUrn || !engagementData.communityConnected}>
                        {generatingCommentFor === post.activityUrn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-500" />}
                      </Button>
                    </div>

                    {/* Comment form */}
                    {commentingOn === post.activityUrn && (
                      <div className="px-4 pb-4 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <Textarea placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} className="min-h-18 text-sm resize-none" autoFocus />
                        <div className="flex items-center justify-between">
                          <Button variant="ghost" size="sm" onClick={() => { setCommentingOn(null); setCommentText(""); }}><X className="w-3.5 h-3.5 mr-1" /> Cancel</Button>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleGenerateComment(post.activityUrn, post.text)} disabled={generatingCommentFor === post.activityUrn}>
                              {generatingCommentFor === post.activityUrn ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />} AI
                            </Button>
                            <Button variant="primary" size="sm" onClick={() => handleComment(post.activityUrn)} disabled={isCommenting || !commentText.trim()}>
                              {isCommenting ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />} Post
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {(hasMorePosts || isLoadingMore) && (
                <div ref={loadMoreRef} className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                </div>
              )}
            </>)}

            {/* Empty feed with profiles */}
            {!isFeedLoading && feedPosts.length === 0 && lists.length > 0 && totalProfiles === 0 && (
              <Card>
                <CardContent className="py-16 text-center">
                  <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Add profiles to your lists</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
                    Click the <strong>+</strong> button, select a list, and add LinkedIn profiles (e.g. lecocq-nicolas) to start seeing their posts here.
                  </p>
                  <Button variant="primary" onClick={openListDialog}>
                    <UserPlus className="w-4 h-4 mr-2" /> Add Profiles
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ============================================ */}
        {/* LIST MANAGEMENT DIALOG */}
        {/* ============================================ */}
        <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
          <DialogContent className="max-w-md">
            {dialogView === "lists" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Manage Lists</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  {/* Existing lists */}
                  {lists.length > 0 ? (
                    <div className="space-y-1">
                      {lists.map((list) => (
                        <div key={list.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          {renamingListId === list.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                className="h-8 flex-1 text-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleRenameList(list.id);
                                  if (e.key === "Escape") setRenamingListId(null);
                                }}
                              />
                              <Button variant="ghost" size="icon-sm" onClick={() => handleRenameList(list.id)}>
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" onClick={() => setRenamingListId(null)}>
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <button onClick={() => openListDetail(list.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                                <div className="w-9 h-9 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center shrink-0">
                                  <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold truncate">{list.name}</p>
                                  <p className="text-xs text-muted-foreground">{list.profiles.length} profile{list.profiles.length !== 1 ? "s" : ""}</p>
                                </div>
                              </button>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => { setRenamingListId(list.id); setRenameValue(list.name); }}
                                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                                  title="Rename list"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteList(list.id)}
                                  disabled={deletingListId === list.id}
                                  className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                                  title="Delete list"
                                >
                                  {deletingListId === list.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No lists yet. Create one to get started.</p>
                    </div>
                  )}

                  {/* Create new list */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Input
                      placeholder="New list name..."
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="flex-1"
                      onKeyDown={(e) => { if (e.key === "Enter") handleCreateList(); }}
                      autoFocus={lists.length === 0}
                    />
                    <Button variant="primary" onClick={handleCreateList} disabled={isCreatingList || !newListName.trim()}>
                      {isCreatingList ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                      Create
                    </Button>
                  </div>
                </div>
              </>
            ) : dialogView === "list-detail" && dialogList ? (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setDialogView("lists")} className="p-1 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <DialogTitle>{dialogList.name}</DialogTitle>
                  </div>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  {/* Add profile input */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="LinkedIn vanity name or URL..."
                        value={newVanityName}
                        onChange={(e) => { setNewVanityName(e.target.value); setAddProfileError(null); }}
                        className="flex-1"
                        onKeyDown={(e) => { if (e.key === "Enter" && dialogListId) handleAddProfile(dialogListId); }}
                        autoFocus
                      />
                      <Button variant="primary" onClick={() => dialogListId && handleAddProfile(dialogListId)} disabled={isAddingProfile || !newVanityName.trim()}>
                        {isAddingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 mr-1" />}
                        Add
                      </Button>
                    </div>
                    {addProfileError && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {addProfileError}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      Enter a vanity name (e.g. lecocq-nicolas) or paste a full LinkedIn profile URL
                    </p>
                  </div>

                  {/* Profiles in list */}
                  {dialogList.profiles.length > 0 ? (
                    <div className="space-y-1 max-h-72 overflow-y-auto">
                      {dialogList.profiles.map((profile) => (
                        <div key={profile.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          {profile.profilePictureUrl ? (
                            <img src={profile.profilePictureUrl} alt={profile.displayName || profile.vanityName} className="w-9 h-9 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-white">{(profile.displayName || profile.vanityName).split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase()}</span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{profile.displayName || profile.vanityName}</p>
                            <p className="text-[11px] text-muted-foreground">@{profile.vanityName}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveProfile(dialogList.id, profile.id)}
                            className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <UserPlus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Add LinkedIn profiles to this list</p>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Settings dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Engagement Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium flex items-center gap-2"><Heart className="w-4 h-4 text-cyan-500" /> Daily Likes Goal</label>
                  <span className="text-sm font-bold">{editLikes}</span>
                </div>
                <Slider value={[editLikes]} onValueChange={([v]) => setEditLikes(v)} min={1} max={100} step={1} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium flex items-center gap-2"><MessageCircle className="w-4 h-4 text-blue-500" /> Daily Comments Goal</label>
                  <span className="text-sm font-bold">{editComments}</span>
                </div>
                <Slider value={[editComments]} onValueChange={([v]) => setEditComments(v)} min={1} max={50} step={1} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium flex items-center gap-2"><Users className="w-4 h-4 text-emerald-500" /> Posts Per Profile</label>
                  <span className="text-sm font-bold">{editPostsPerProfile}</span>
                </div>
                <Slider value={[editPostsPerProfile]} onValueChange={([v]) => setEditPostsPerProfile(v)} min={1} max={10} step={1} />
                <p className="text-xs text-muted-foreground mt-1">Number of recent posts shown for each profile in your feed</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveSettings} disabled={isSavingSettings}>
                {isSavingSettings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </FeatureGate>
  );
}
