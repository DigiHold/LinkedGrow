"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VideoModal } from "@/components/dashboard/video-modal";
import {
  FileText,
  Search,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  Copy,
  Check,
  Clock,
  Loader2,
  Plus,
  Sparkles,
  X,
  HelpCircle,
  MessageSquare,
  Video,
  LayoutGrid,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatInTimezone, resolveTimezone } from "@/lib/timezone";
import Link from "next/link";
import { PdfCarouselPreview } from "@/components/dashboard/pdf-carousel-preview";

type PostStatus = "all" | "draft" | "scheduled" | "published";

interface Post {
  id: string;
  content: string;
  status: "draft" | "scheduled" | "published" | "failed";
  postType: "text" | "image" | "carousel" | "video";
  scheduledAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  firstComment?: string | null;
  metadata?: Record<string, unknown> | null;
  media?: Array<{
    id: string;
    storageUrl: string;
    mimeType: string;
  }>;
  author?: {
    name: string;
    email: string;
    image: string | null;
    isOwner: boolean;
  } | null;
}

interface PostsResponse {
  posts: Post[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
  isTeamView?: boolean;
}

export default function PostsPage() {
  const [activeTab, setActiveTab] = useState<PostStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTeamView, setIsTeamView] = useState(false);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const [deletePost, setDeletePost] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [schedulePost, setSchedulePost] = useState<Post | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [userTimezone, setUserTimezone] = useState<string | null>(null);

  // LinkedIn profile data for preview
  const [linkedInProfile, setLinkedInProfile] = useState<{
    name: string;
    headline: string;
    image: string | null;
  } | null>(null);

  // Fetch LinkedIn profile for preview
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          setLinkedInProfile({
            name: data.linkedinProfileName || data.name || "Your Name",
            headline: data.linkedinHeadline || "",
            image: data.image || null,
          });
        }
      } catch {
        // Silently fail - will use default values
      }
    };
    fetchProfile();
  }, []);

  // Fetch user timezone
  useEffect(() => {
    const fetchTimezone = async () => {
      try {
        const response = await fetch("/api/user/settings");
        if (response.ok) {
          const data = await response.json();
          if (data.timezone) {
            setUserTimezone(data.timezone);
          }
        }
      } catch {
        // Silently fail - will use browser timezone
      }
    };
    fetchTimezone();
  }, []);

  // Fetch posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/posts");
        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }
        const data: PostsResponse = await response.json();
        setPosts(data.posts || []);
        setIsTeamView(data.isTeamView || false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load posts");
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Calculate counts for tabs
  const counts = {
    all: posts.length,
    draft: posts.filter((p) => p.status === "draft").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    published: posts.filter((p) => p.status === "published").length,
  };

  const tabs: { id: PostStatus; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "draft", label: "Drafts", count: counts.draft },
    { id: "scheduled", label: "Scheduled", count: counts.scheduled },
    { id: "published", label: "Published", count: counts.published },
  ];

  const filteredPosts = posts.filter((post) => {
    const matchesTab = activeTab === "all" || post.status === activeTab;
    const matchesSearch = post.content
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteConfirm = async () => {
    if (!deletePost) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/posts/${deletePost.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setPosts(posts.filter((p) => p.id !== deletePost.id));
        setDeletePost(null);
      }
    } catch (err) {
} finally {
      setIsDeleting(false);
    }
  };

  const handleScheduleConfirm = async () => {
    if (!schedulePost || !scheduleDate || !scheduleTime) return;
    setIsScheduling(true);

    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      const response = await fetch(`/api/posts/${schedulePost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "scheduled", scheduledAt }),
      });
      if (response.ok) {
        setPosts(posts.map((p) =>
          p.id === schedulePost.id ? { ...p, status: "scheduled" as const, scheduledAt } : p
        ));
        setSchedulePost(null);
        setScheduleDate("");
        setScheduleTime("");
      }
    } catch (err) {
} finally {
      setIsScheduling(false);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    setIsBulkDeleting(true);

    try {
      await Promise.all(
        selectedPosts.map((postId) =>
          fetch(`/api/posts/${postId}`, { method: "DELETE" })
        )
      );
      setPosts(posts.filter((p) => !selectedPosts.includes(p.id)));
      setSelectedPosts([]);
      setBulkDeleteModal(false);
    } catch (err) {
} finally {
      setIsBulkDeleting(false);
    }
  };

  const handleOpenScheduleModal = (post: Post) => {
    // Set default date/time to tomorrow at 9 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setScheduleDate(tomorrow.toISOString().split("T")[0]);
    setScheduleTime("09:00");
    setSchedulePost(post);
  };

  const formatDate = (dateString: string) => {
    // resolveTimezone handles "auto" by returning browser timezone
    const tz = resolveTimezone(userTimezone);
    return formatInTimezone(dateString, tz, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-10">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
        <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-slate-100 dark:bg-white/5" />
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 flex items-center justify-center min-h-100">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <FileText className="w-6 h-6 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Failed to load posts</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Empty state - no posts at all
  if (posts.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">
              My Posts
            </h1>
            <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">
              Manage all your LinkedIn content in one place
            </p>
          </div>
          <div className="flex items-center gap-3">
            <VideoModal videoId="8jGzpoWUSC4" />
            <Link href="/docs/scheduling/scheduling-posts" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 inline-flex items-center gap-1 transition-colors">
              <HelpCircle className="w-3.5 h-3.5" />
              Help?
            </Link>
          </div>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="py-16 px-8">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                <FileText className="w-10 h-10 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Create your first LinkedIn post using AI-powered content generation or start from scratch.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/dashboard/ideas">
                  <Button className="w-full sm:w-auto bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </Button>
                </Link>
                <Link href="/dashboard/editor">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Manually
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">
            {isTeamView ? "Team Posts" : "My Posts"}
          </h1>
          <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">
            {isTeamView
              ? "View and manage posts from all team members"
              : "Manage all your LinkedIn content in one place"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <VideoModal videoId="8jGzpoWUSC4" />
          <Link href="/docs/scheduling/scheduling-posts" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 inline-flex items-center gap-1 transition-colors">
            <HelpCircle className="w-3.5 h-3.5" />
            Help?
          </Link>
          <Link href="/dashboard/editor">
            <Button className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters stay reachable while a long list scrolls, which is the whole
          point of having them. */}
      <div className="sticky top-16 z-20 -mx-4 border-b border-border bg-slate-50/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 dark:bg-background/90">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                    activeTab === tab.id
                      ? "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300"
                      : "text-slate-400 dark:text-slate-500"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="sm:ml-auto sm:w-64">
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {filteredPosts.map((post) => (
          <Card key={post.id} className="transition-colors hover:border-slate-300 dark:hover:border-white/20">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Checkbox (Desktop) */}
                <div className="hidden sm:flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedPosts.includes(post.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPosts([...selectedPosts, post.id]);
                      } else {
                        setSelectedPosts(
                          selectedPosts.filter((id) => id !== post.id)
                        );
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium line-clamp-2">{post.content}</p>
                    <button
                      onClick={() => handleCopy(post.id, post.content)}
                      className="p-1.5 rounded-md hover:bg-accent shrink-0"
                    >
                      {copiedId === post.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                    {/* Author badge (team view only) */}
                    {isTeamView && post.author && (
                      <span className={cn(
                        "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                        post.author.isOwner
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                      )}>
                        {post.author.image ? (
                          <img
                            src={post.author.image}
                            alt={post.author.name}
                            className="w-4 h-4 rounded-full"
                          />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[10px]">
                            {post.author.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        {post.author.name}
                        {post.author.isOwner && " (You)"}
                      </span>
                    )}
                    {/* Status Badge */}
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        post.status === "published"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : post.status === "scheduled"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : post.status === "failed"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      )}
                    >
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </span>

                    {/* Post Type Badge */}
                    {post.postType === "video" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        <Video className="w-3 h-3" />
                        Video
                      </span>
                    )}
                    {post.postType === "image" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                        <ImageIcon className="w-3 h-3" />
                        Image
                      </span>
                    )}
                    {post.postType === "carousel" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <LayoutGrid className="w-3 h-3" />
                        Carousel
                      </span>
                    )}

                    {/* Date */}
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.status === "scheduled" && post.scheduledAt
                        ? formatDate(post.scheduledAt)
                        : post.status === "published" && post.publishedAt
                        ? formatDate(post.publishedAt)
                        : formatDate(post.createdAt)}
                    </span>

                    {/* Has Media */}
                    {post.media && post.media.length > 0 && (
                      <span className="text-slate-500 dark:text-slate-400 text-xs">
                        + {post.media.length} media
                      </span>
                    )}

                    {/* Has First Comment */}
                    {post.firstComment && (
                      <span className="text-cyan-600 dark:text-cyan-400 text-xs flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        Auto-comment
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="View"
                    onClick={() => setPreviewPost(post)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {post.status !== "published" && (
                    <Link href={`/dashboard/editor?edit=${post.id}`}>
                      <Button variant="ghost" size="icon-sm" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                  {(post.status === "published" || post.status === "failed") && (
                    <Link href={`/dashboard/editor?duplicate=${post.id}`}>
                      <Button variant="ghost" size="icon-sm" title="Reuse this post">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                  {post.status === "draft" && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Schedule"
                      onClick={() => handleOpenScheduleModal(post)}
                    >
                      <Calendar className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Delete"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeletePost(post)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredPosts.length === 0 && posts.length > 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-slate-500 dark:text-slate-400 mb-4" />
              <h3 className="font-semibold mb-2">No posts found</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {searchQuery
                  ? "Try a different search term"
                  : `No ${activeTab} posts yet`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bulk Actions (when posts selected) */}
      {selectedPosts.length > 0 && (
        <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 bg-gray-900 text-white px-4 sm:px-6 py-3 rounded-full shadow-xl flex items-center justify-center gap-3 sm:gap-4 z-50">
          <span className="text-sm whitespace-nowrap">
            {selectedPosts.length} selected
          </span>
          <div className="w-px h-4 bg-gray-700" />
          <button
            onClick={() => setBulkDeleteModal(true)}
            className="text-sm hover:text-red-400 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => setSelectedPosts([])}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => !isDeleting && setDeletePost(null)}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden z-10">
            <div className="p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-center mb-2">Delete Post</h2>
              <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDeletePost(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Post Modal */}
      {schedulePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => !isScheduling && setSchedulePost(null)}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden z-10">
            <div className="p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-center mb-2">Schedule Post</h2>
              <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6">
                Choose when you want this post to be published.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSchedulePost(null)}
                  disabled={isScheduling}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                  onClick={handleScheduleConfirm}
                  disabled={isScheduling || !scheduleDate || !scheduleTime}
                >
                  {isScheduling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {bulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => !isBulkDeleting && setBulkDeleteModal(false)}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden z-10">
            <div className="p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-center mb-2">Delete {selectedPosts.length} Post{selectedPosts.length > 1 ? "s" : ""}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6">
                Are you sure you want to delete {selectedPosts.length} selected post{selectedPosts.length > 1 ? "s" : ""}? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setBulkDeleteModal(false)}
                  disabled={isBulkDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleBulkDeleteConfirm}
                  disabled={isBulkDeleting}
                >
                  {isBulkDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Preview Modal */}
      {previewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setPreviewPost(null)}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden z-10">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Post Preview</h2>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    previewPost.status === "published"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : previewPost.status === "scheduled"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : previewPost.status === "failed"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  )}
                >
                  {previewPost.status.charAt(0).toUpperCase() + previewPost.status.slice(1)}
                </span>
              </div>
              <button
                onClick={() => setPreviewPost(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* LinkedIn-style preview card */}
              <div className="bg-white dark:bg-gray-800 border border-border rounded-xl p-4">
                <div className="flex items-start gap-3 mb-4">
                  {(isTeamView && previewPost.author?.image) || linkedInProfile?.image ? (
                    <img
                      src={(isTeamView && previewPost.author?.image) || linkedInProfile?.image || ""}
                      alt={(isTeamView && previewPost.author?.name) || linkedInProfile?.name || ""}
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                      <span className="text-white font-semibold">
                        {((isTeamView && previewPost.author?.name) || linkedInProfile?.name || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">
                      {(isTeamView && previewPost.author?.name) || linkedInProfile?.name || "Your Name"}
                      {isTeamView && previewPost.author?.isOwner && (
                        <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">(You)</span>
                      )}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {isTeamView && previewPost.author && !previewPost.author.isOwner
                        ? "Team Member"
                        : linkedInProfile?.headline || ""}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {previewPost.status === "scheduled" && previewPost.scheduledAt
                        ? `Scheduled for ${formatDate(previewPost.scheduledAt)}`
                        : previewPost.status === "published" && previewPost.publishedAt
                        ? `Published ${formatDate(previewPost.publishedAt)}`
                        : `Created ${formatDate(previewPost.createdAt)}`}
                    </p>
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {previewPost.content}
                </div>
                {/* Video posts: show a placeholder card (the file is gone from
                    R2 after publish, and was never displayed as a real player). */}
                {previewPost.postType === "video" ? (
                  <div className="mt-4 flex items-center justify-center h-48 rounded-lg bg-linear-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-900/10 border border-purple-200 dark:border-purple-800">
                    <div className="flex flex-col items-center gap-2 text-purple-700 dark:text-purple-300">
                      <Video className="w-10 h-10" />
                      <span className="text-sm font-medium">Video post</span>
                    </div>
                  </div>
                ) : previewPost.media && previewPost.media.length > 0 && (
                  <div className="mt-4 grid gap-2">
                    {previewPost.media.map((media) => (
                      media.mimeType === 'application/pdf' ? (
                        <PdfCarouselPreview
                          key={media.id}
                          url={media.storageUrl}
                        />
                      ) : media.mimeType?.startsWith('video/') ? (
                        <div
                          key={media.id}
                          className="flex items-center justify-center h-48 rounded-lg bg-linear-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-900/10 border border-purple-200 dark:border-purple-800"
                        >
                          <div className="flex flex-col items-center gap-2 text-purple-700 dark:text-purple-300">
                            <Video className="w-10 h-10" />
                            <span className="text-sm font-medium">Video post</span>
                          </div>
                        </div>
                      ) : (
                        <img
                          key={media.id}
                          src={media.storageUrl}
                          alt="Post media"
                          className="rounded-lg max-h-80 object-cover w-full"
                        />
                      )
                    ))}
                  </div>
                )}
              </div>

              {/* First Comment Preview */}
              {previewPost.firstComment && (
                <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-sm font-medium">First Comment</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">- auto-posted 1-5 min after publication</span>
                  </div>
                  <div className="flex items-start gap-3">
                    {(isTeamView && previewPost.author?.image) || linkedInProfile?.image ? (
                      <img
                        src={(isTeamView && previewPost.author?.image) || linkedInProfile?.image || ""}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-semibold">
                          {((isTeamView && previewPost.author?.name) || linkedInProfile?.name || "U").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-foreground whitespace-pre-wrap">{previewPost.firstComment}</p>
                  </div>
                </div>
              )}

              {/* Character count */}
              <div className="mt-4 text-sm text-slate-500 dark:text-slate-400 text-center">
                {previewPost.content.length} characters
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-gray-50 dark:bg-gray-800/50">
              <Button variant="outline" onClick={() => setPreviewPost(null)}>
                Close
              </Button>
              {previewPost.status === "published" || previewPost.status === "failed" ? (
                <Link href={`/dashboard/editor?duplicate=${previewPost.id}`}>
                  <Button>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reuse Post
                  </Button>
                </Link>
              ) : (
                <Link href={`/dashboard/editor?edit=${previewPost.id}`}>
                  <Button>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Post
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
