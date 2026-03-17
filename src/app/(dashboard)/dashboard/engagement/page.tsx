"use client";

import { useState, useEffect, useCallback } from "react";
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
  Pencil,
  Check,
} from "lucide-react";
import Link from "next/link";
import { CommunityConnectBanner } from "@/components/dashboard/engagement/community-connect-banner";

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
  authorVanityName: string;
  authorDisplayName: string;
  authorHeadline: string;
  authorProfilePictureUrl: string;
}

interface EngagementData {
  objectives: { dailyLikes: number; dailyComments: number };
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

// ============================================
// PAGE
// ============================================

export default function EngagementPage() {
  const { data: session } = useSession();
  const isTeamMember = session?.user?.isTeamMember === true;

  // Data states
  const [engagementData, setEngagementData] = useState<EngagementData | null>(null);
  const [lists, setLists] = useState<EngagementList[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [feedErrors, setFeedErrors] = useState<{ vanityName: string; error: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFeedLoading, setIsFeedLoading] = useState(false);

  // List management
  const [activeListId, setActiveListId] = useState<string | null>(null); // null = "All"
  const [newListName, setNewListName] = useState("");
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [addingProfileToList, setAddingProfileToList] = useState<string | null>(null);
  const [newVanityName, setNewVanityName] = useState("");
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [addProfileError, setAddProfileError] = useState<string | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editListName, setEditListName] = useState("");
  const [deletingListId, setDeletingListId] = useState<string | null>(null);

  // Goals dialog
  const [showGoals, setShowGoals] = useState(false);
  const [editLikes, setEditLikes] = useState(10);
  const [editComments, setEditComments] = useState(5);
  const [isSavingGoals, setIsSavingGoals] = useState(false);

  // Post interaction states
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likingPost, setLikingPost] = useState<string | null>(null);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [generatingCommentFor, setGeneratingCommentFor] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  // ============================================
  // FETCHERS
  // ============================================

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

  const fetchFeed = useCallback(
    async (listId?: string | null) => {
      setIsFeedLoading(true);
      setFeedErrors([]);
      try {
        const url = listId
          ? `/api/engagement/feed?listId=${listId}`
          : "/api/engagement/feed";
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setFeedPosts(data.posts || []);
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
    },
    []
  );

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchEngagement(), fetchLists()]).finally(() => setIsLoading(false));
  }, [fetchEngagement, fetchLists]);

  // Fetch feed when lists are loaded or active list changes
  useEffect(() => {
    if (!isLoading && lists.length > 0) {
      fetchFeed(activeListId);
    }
  }, [isLoading, lists.length, activeListId, fetchFeed]);

  // ============================================
  // LIST MANAGEMENT
  // ============================================

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
        if (activeListId === listId) {
          setActiveListId(null);
        }
      }
    } finally {
      setDeletingListId(null);
    }
  };

  const handleRenameList = async (listId: string) => {
    if (!editListName.trim()) return;
    try {
      const res = await fetch(`/api/engagement/lists/${listId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editListName.trim() }),
      });
      if (res.ok) {
        setLists((prev) =>
          prev.map((l) => (l.id === listId ? { ...l, name: editListName.trim() } : l))
        );
        setEditingListId(null);
      }
    } catch {
      // ignore
    }
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
          prev.map((l) =>
            l.id === listId
              ? { ...l, profiles: [...l.profiles, data.profile] }
              : l
          )
        );
        setNewVanityName("");
        setAddingProfileToList(null);
        // Refresh feed to include new profile's posts
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
      const res = await fetch(
        `/api/engagement/lists/${listId}/profiles?profileId=${profileId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setLists((prev) =>
          prev.map((l) =>
            l.id === listId
              ? { ...l, profiles: l.profiles.filter((p) => p.id !== profileId) }
              : l
          )
        );
      }
    } catch {
      // ignore
    }
  };

  // ============================================
  // POST INTERACTIONS
  // ============================================

  const handleLike = async (postUrn: string) => {
    setLikingPost(postUrn);
    try {
      const res = await fetch("/api/engagement/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like", postUrn }),
      });
      if (res.ok) {
        const data = await res.json();
        setLikedPosts((prev) => new Set([...prev, postUrn]));
        setFeedPosts((prev) =>
          prev.map((p) =>
            p.activityUrn === postUrn ? { ...p, likes: p.likes + 1 } : p
          )
        );
        if (data.today) {
          setEngagementData((prev) =>
            prev ? { ...prev, today: data.today } : prev
          );
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
      const res = await fetch("/api/engagement/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment",
          postUrn,
          text: commentText.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCommentingOn(null);
        setCommentText("");
        setFeedPosts((prev) =>
          prev.map((p) =>
            p.activityUrn === postUrn ? { ...p, comments: p.comments + 1 } : p
          )
        );
        if (data.today) {
          setEngagementData((prev) =>
            prev ? { ...prev, today: data.today } : prev
          );
        }
      }
    } finally {
      setIsCommenting(false);
    }
  };

  const handleGenerateComment = async (
    postUrn: string,
    postContent: string
  ) => {
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
        body: JSON.stringify({
          dailyLikes: editLikes,
          dailyComments: editComments,
        }),
      });
      if (res.ok) {
        setEngagementData((prev) =>
          prev
            ? {
                ...prev,
                objectives: {
                  dailyLikes: editLikes,
                  dailyComments: editComments,
                },
              }
            : prev
        );
        setShowGoals(false);
      }
    } finally {
      setIsSavingGoals(false);
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
              <p className="text-muted-foreground">
                This page contains the team owner&apos;s private LinkedIn
                engagement data and is not accessible to team members.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const likesProgress = engagementData
    ? Math.min(
        100,
        (engagementData.today.likes /
          Math.max(1, engagementData.objectives.dailyLikes)) *
          100
      )
    : 0;
  const commentsProgress = engagementData
    ? Math.min(
        100,
        (engagementData.today.comments /
          Math.max(1, engagementData.objectives.dailyComments)) *
          100
      )
    : 0;

  const totalProfiles = lists.reduce((sum, l) => sum + l.profiles.length, 0);

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
              <p className="text-muted-foreground text-sm">
                Follow LinkedIn profiles and engage with their posts
              </p>
            </div>
          </div>

          {engagementData && (
            <div className="flex items-center gap-3 flex-wrap">
              {/* Likes progress */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <Heart className="w-4 h-4 text-cyan-500" />
                <span className="text-sm font-bold">
                  {engagementData.today.likes}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {engagementData.objectives.dailyLikes}
                </span>
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${likesProgress}%` }}
                  />
                </div>
              </div>
              {/* Comments progress */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <MessageCircle className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-bold">
                  {engagementData.today.comments}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {engagementData.objectives.dailyComments}
                </span>
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${commentsProgress}%` }}
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setEditLikes(engagementData.objectives.dailyLikes);
                  setEditComments(engagementData.objectives.dailyComments);
                  setShowGoals(true);
                }}
                title="Edit daily goals"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => fetchFeed(activeListId)}
                disabled={isFeedLoading}
                title="Refresh feed"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isFeedLoading ? "animate-spin" : ""}`}
                />
              </Button>
              <Link
                href="/docs/getting-started/understanding-dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-cyan-600 transition-colors"
              >
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

        {!isLoading && engagementData && (
          <>
            {/* Community App connection */}
            {!engagementData.communityConnected ? (
              <CommunityConnectBanner
                isConnected={false}
                profileName={engagementData.profileName}
              />
            ) : (
              <CommunityConnectBanner
                isConnected={true}
                profileName={engagementData.profileName}
                onDisconnect={async () => {
                  await fetch("/api/linkedin/community/disconnect", {
                    method: "POST",
                  });
                  window.location.reload();
                }}
              />
            )}

            {/* Lists Management */}
            <div className="space-y-4">
              {/* List tabs */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* "All" tab */}
                <button
                  onClick={() => setActiveListId(null)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeListId === null
                      ? "bg-cyan-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  All ({totalProfiles})
                </button>

                {/* List tabs */}
                {lists.map((list) => (
                  <div key={list.id} className="flex items-center gap-0.5">
                    {editingListId === list.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editListName}
                          onChange={(e) => setEditListName(e.target.value)}
                          className="h-8 w-32 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameList(list.id);
                            if (e.key === "Escape") setEditingListId(null);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRenameList(list.id)}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditingListId(null)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setActiveListId(list.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            activeListId === list.id
                              ? "bg-cyan-500 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          {list.name} ({list.profiles.length})
                        </button>
                        <button
                          onClick={() => {
                            setEditingListId(list.id);
                            setEditListName(list.name);
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                          title="Rename list"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteList(list.id)}
                          disabled={deletingListId === list.id}
                          className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Delete list"
                        >
                          {deletingListId === list.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                ))}

                {/* New list input */}
                <div className="flex items-center gap-1">
                  <Input
                    placeholder="New list..."
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    className="h-8 w-28 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateList();
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleCreateList}
                    disabled={isCreatingList || !newListName.trim()}
                    title="Create list"
                  >
                    {isCreatingList ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Profiles in active list + Add profile */}
              {lists.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Show profiles for active list (or all) */}
                  {(activeListId
                    ? lists.find((l) => l.id === activeListId)?.profiles || []
                    : lists.flatMap((l) => l.profiles)
                  )
                    .filter(
                      (p, i, arr) =>
                        arr.findIndex((x) => x.vanityName === p.vanityName) === i
                    )
                    .map((profile) => (
                      <div
                        key={profile.id}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 group"
                      >
                        {profile.profilePictureUrl ? (
                          <img
                            src={profile.profilePictureUrl}
                            alt={profile.displayName || profile.vanityName}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">
                              {(profile.displayName || profile.vanityName)
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .substring(0, 2)
                                .toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="text-xs font-medium">
                          {profile.displayName || profile.vanityName}
                        </span>
                        <button
                          onClick={() =>
                            handleRemoveProfile(profile.listId, profile.id)
                          }
                          className="p-0.5 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                  {/* Add profile button */}
                  {activeListId && (
                    <>
                      {addingProfileToList === activeListId ? (
                        <div className="flex items-center gap-1">
                          <Input
                            placeholder="vanity name or LinkedIn URL..."
                            value={newVanityName}
                            onChange={(e) => {
                              setNewVanityName(e.target.value);
                              setAddProfileError(null);
                            }}
                            className="h-8 w-56 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                handleAddProfile(activeListId);
                              if (e.key === "Escape") {
                                setAddingProfileToList(null);
                                setNewVanityName("");
                                setAddProfileError(null);
                              }
                            }}
                          />
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAddProfile(activeListId)}
                            disabled={
                              isAddingProfile || !newVanityName.trim()
                            }
                          >
                            {isAddingProfile ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Add"
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setAddingProfileToList(null);
                              setNewVanityName("");
                              setAddProfileError(null);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          {addProfileError && (
                            <span className="text-xs text-red-500">
                              {addProfileError}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAddingProfileToList(activeListId)}
                          className="text-xs"
                        >
                          <UserPlus className="w-3.5 h-3.5 mr-1" />
                          Add Profile
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Empty state - no lists */}
            {lists.length === 0 && !isFeedLoading && (
              <Card>
                <CardContent className="py-16 text-center">
                  <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Create your first engagement list
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                    Organize LinkedIn profiles into lists (e.g. &quot;Marketing&quot;,
                    &quot;AI&quot;, &quot;Founders&quot;). We&apos;ll fetch their latest posts so you can
                    like and comment directly from here.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Input
                      placeholder="List name (e.g. Marketing)"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="w-48"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateList();
                      }}
                    />
                    <Button
                      variant="primary"
                      onClick={handleCreateList}
                      disabled={isCreatingList || !newListName.trim()}
                    >
                      {isCreatingList ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Create List
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Feed errors */}
            {feedErrors.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-sm">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-amber-700 dark:text-amber-300">
                  {feedErrors.map((e, i) => (
                    <p key={i}>
                      {e.vanityName
                        ? `${e.vanityName}: ${e.error}`
                        : e.error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Feed loading */}
            {isFeedLoading && feedPosts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                <p className="text-muted-foreground text-sm">
                  Fetching posts from LinkedIn profiles...
                </p>
              </div>
            )}

            {/* Post Feed Grid */}
            {feedPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {feedPosts.map((post) => (
                  <div
                    key={post.activityUrn}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all flex flex-col"
                  >
                    {/* Author row */}
                    <div className="p-4 pb-0">
                      <div className="flex items-start gap-3 mb-3">
                        {post.authorProfilePictureUrl ? (
                          <img
                            src={post.authorProfilePictureUrl}
                            alt={post.authorDisplayName}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-white">
                              {post.authorDisplayName
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .substring(0, 2)
                                .toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <a
                            href={`https://www.linkedin.com/in/${post.authorVanityName}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold truncate block hover:text-cyan-600 transition-colors"
                          >
                            {post.authorDisplayName}
                          </a>
                          {post.authorHeadline && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {post.authorHeadline}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {timeAgo(post.datePublished)}
                          </p>
                        </div>
                      </div>

                      {/* Post text with see more/less */}
                      {post.text ? (
                        <div className="text-sm leading-relaxed">
                          <p
                            className={`whitespace-pre-wrap ${
                              expandedPosts.has(post.activityUrn)
                                ? ""
                                : "line-clamp-4"
                            }`}
                          >
                            {post.text}
                          </p>
                          {post.text.length > 200 && (
                            <button
                              onClick={() =>
                                setExpandedPosts((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(post.activityUrn))
                                    next.delete(post.activityUrn);
                                  else next.add(post.activityUrn);
                                  return next;
                                })
                              }
                              className="text-muted-foreground hover:text-foreground font-medium text-xs mt-1 transition-colors"
                            >
                              {expandedPosts.has(post.activityUrn)
                                ? "...see less"
                                : "...see more"}
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          (Shared content)
                        </p>
                      )}
                    </div>

                    {/* Post image */}
                    {post.imageUrl && (
                      <div className="mt-3">
                        <img
                          src={post.imageUrl}
                          alt=""
                          className="w-full max-h-64 object-cover"
                        />
                      </div>
                    )}

                    {/* Social counts */}
                    <div className="px-4 pt-3 mt-auto">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pb-2 border-b border-slate-100 dark:border-slate-800">
                        {post.likes > 0 && (
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />{" "}
                            {formatCount(post.likes)}
                          </span>
                        )}
                        {post.comments > 0 && (
                          <span>
                            {formatCount(post.comments)} comments
                          </span>
                        )}
                        {post.reposts > 0 && (
                          <span className="flex items-center gap-1">
                            <Share2 className="w-3 h-3" />{" "}
                            {formatCount(post.reposts)}
                          </span>
                        )}
                        {post.likes === 0 &&
                          post.comments === 0 &&
                          post.reposts === 0 && (
                            <span className="opacity-50">No reactions yet</span>
                          )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="px-2 py-1 flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex-1 text-xs ${
                          likedPosts.has(post.activityUrn)
                            ? "text-cyan-600 dark:text-cyan-400"
                            : ""
                        }`}
                        onClick={() => handleLike(post.activityUrn)}
                        disabled={
                          likingPost === post.activityUrn ||
                          likedPosts.has(post.activityUrn) ||
                          !engagementData.communityConnected
                        }
                      >
                        {likingPost === post.activityUrn ? (
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        ) : (
                          <ThumbsUp
                            className={`w-4 h-4 mr-1.5 ${
                              likedPosts.has(post.activityUrn)
                                ? "fill-cyan-500 text-cyan-500"
                                : ""
                            }`}
                          />
                        )}
                        {likedPosts.has(post.activityUrn) ? "Liked" : "Like"}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => {
                          if (commentingOn === post.activityUrn) {
                            setCommentingOn(null);
                            setCommentText("");
                          } else {
                            setCommentingOn(post.activityUrn);
                            setCommentText("");
                          }
                        }}
                        disabled={!engagementData.communityConnected}
                      >
                        <MessageCircle className="w-4 h-4 mr-1.5" />
                        Comment
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0"
                        title="AI-generate a comment"
                        onClick={() =>
                          handleGenerateComment(
                            post.activityUrn,
                            post.text
                          )
                        }
                        disabled={
                          generatingCommentFor === post.activityUrn ||
                          !engagementData.communityConnected
                        }
                      >
                        {generatingCommentFor === post.activityUrn ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-amber-500" />
                        )}
                      </Button>
                    </div>

                    {/* Inline comment form */}
                    {commentingOn === post.activityUrn && (
                      <div className="px-4 pb-4 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <Textarea
                          placeholder="Write a comment..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="min-h-18 text-sm resize-none"
                          autoFocus
                        />
                        <div className="flex items-center justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCommentingOn(null);
                              setCommentText("");
                            }}
                          >
                            <X className="w-3.5 h-3.5 mr-1" /> Cancel
                          </Button>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleGenerateComment(
                                  post.activityUrn,
                                  post.text
                                )
                              }
                              disabled={
                                generatingCommentFor === post.activityUrn
                              }
                            >
                              {generatingCommentFor === post.activityUrn ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
                              )}
                              AI
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleComment(post.activityUrn)}
                              disabled={isCommenting || !commentText.trim()}
                            >
                              {isCommenting ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5 mr-1" />
                              )}
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

            {/* Empty feed with lists but no profiles */}
            {!isFeedLoading &&
              feedPosts.length === 0 &&
              lists.length > 0 &&
              totalProfiles === 0 && (
                <Card>
                  <CardContent className="py-16 text-center">
                    <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Add profiles to your lists
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      Click on a list tab above, then click &quot;Add Profile&quot; to
                      start following LinkedIn profiles. Enter their vanity name
                      (e.g. justinwelsh) or paste a full LinkedIn URL.
                    </p>
                  </CardContent>
                </Card>
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
                <Slider
                  value={[editLikes]}
                  onValueChange={([v]) => setEditLikes(v)}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-blue-500" /> Daily
                    Comments
                  </label>
                  <span className="text-sm font-bold">{editComments}</span>
                </div>
                <Slider
                  value={[editComments]}
                  onValueChange={([v]) => setEditComments(v)}
                  min={1}
                  max={50}
                  step={1}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowGoals(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveGoals}
                disabled={isSavingGoals}
              >
                {isSavingGoals && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </FeatureGate>
  );
}
