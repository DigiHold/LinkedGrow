"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Star,
  Calendar,
  Copy,
  Check,
  Clock,
  Loader2,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
  metadata?: Record<string, unknown> | null;
  media?: Array<{
    id: string;
    storageUrl: string;
    mimeType: string;
  }>;
}

interface PostsResponse {
  posts: Post[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export default function PostsPage() {
  const [activeTab, setActiveTab] = useState<PostStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);

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

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setPosts(posts.filter((p) => p.id !== postId));
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 flex items-center justify-center min-h-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your posts...</p>
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
            <FileText className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Failed to load posts</h3>
          <p className="text-muted-foreground text-sm mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Empty state - no posts at all
  if (posts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">My Posts</h1>
            <p className="text-muted-foreground mt-1">
              Manage all your LinkedIn content in one place
            </p>
          </div>
        </div>

        {/* Empty State */}
        <Card className="border-dashed">
          <CardContent className="py-16 px-8">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                <FileText className="w-10 h-10 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first LinkedIn post using AI-powered content generation or start from scratch.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/dashboard/ideas">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My Posts</h1>
          <p className="text-muted-foreground mt-1">
            Manage all your LinkedIn content in one place
          </p>
        </div>
        <Link href="/dashboard/editor">
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-2 sm:pb-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                      : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "ml-2 px-1.5 py-0.5 rounded-full text-xs",
                      activeTab === tab.id
                        ? "bg-white/20"
                        : "bg-gray-100 dark:bg-gray-800"
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 sm:max-w-xs">
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-3">
        {filteredPosts.map((post) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
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
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
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

                    {/* Post Type */}
                    {post.postType !== "text" && (
                      <span className="text-muted-foreground text-xs capitalize">
                        {post.postType}
                      </span>
                    )}

                    {/* Date */}
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.status === "scheduled" && post.scheduledAt
                        ? formatDate(post.scheduledAt)
                        : post.status === "published" && post.publishedAt
                        ? formatDate(post.publishedAt)
                        : formatDate(post.createdAt)}
                    </span>

                    {/* Has Media */}
                    {post.media && post.media.length > 0 && (
                      <span className="text-muted-foreground text-xs">
                        + {post.media.length} media
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="View"
                    onClick={() => setPreviewPost(post)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Link href={`/dashboard/editor?edit=${post.id}`}>
                    <Button variant="ghost" size="icon-sm" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </Link>
                  {post.status === "draft" && (
                    <Button variant="ghost" size="icon-sm" title="Schedule">
                      <Calendar className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Delete"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(post.id)}
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
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No posts found</h3>
              <p className="text-muted-foreground text-sm">
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
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-4 z-50">
          <span className="text-sm">
            {selectedPosts.length} post{selectedPosts.length > 1 ? "s" : ""} selected
          </span>
          <div className="w-px h-4 bg-gray-700" />
          <button className="text-sm hover:text-cyan-400 transition-colors">
            Delete
          </button>
          <button className="text-sm hover:text-cyan-400 transition-colors">
            Schedule
          </button>
          <button
            onClick={() => setSelectedPosts([])}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
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
            <div className="flex items-center justify-between px-6 py-4 border-b">
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
              <div className="bg-white dark:bg-gray-800 border rounded-xl p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                    <span className="text-white font-semibold">U</span>
                  </div>
                  <div>
                    <p className="font-semibold">Your Name</p>
                    <p className="text-sm text-muted-foreground">Your headline</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
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
                {previewPost.media && previewPost.media.length > 0 && (
                  <div className="mt-4 grid gap-2">
                    {previewPost.media.map((media) => (
                      <img
                        key={media.id}
                        src={media.storageUrl}
                        alt="Post media"
                        className="rounded-lg max-h-80 object-cover w-full"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Character count */}
              <div className="mt-4 text-sm text-muted-foreground text-center">
                {previewPost.content.length} characters
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 dark:bg-gray-800/50">
              <Button variant="outline" onClick={() => setPreviewPost(null)}>
                Close
              </Button>
              <Link href={`/dashboard/editor?edit=${previewPost.id}`}>
                <Button>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Post
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
