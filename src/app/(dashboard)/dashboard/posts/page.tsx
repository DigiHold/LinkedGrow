"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Star,
  Calendar,
  Copy,
  Check,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PostStatus = "all" | "draft" | "scheduled" | "published";

interface Post {
  id: string;
  content: string;
  status: "draft" | "scheduled" | "published";
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  isFavorite: boolean;
  hasImage: boolean;
}

const samplePosts: Post[] = [
  {
    id: "1",
    content: "5 lessons I learned from building my first startup. Thread...",
    status: "published",
    publishedAt: "2024-01-10T14:00:00",
    createdAt: "2024-01-10T10:00:00",
    isFavorite: true,
    hasImage: true,
  },
  {
    id: "2",
    content: "The biggest mistake I see junior developers make is...",
    status: "scheduled",
    scheduledAt: "2024-01-15T09:00:00",
    createdAt: "2024-01-08T15:00:00",
    isFavorite: false,
    hasImage: false,
  },
  {
    id: "3",
    content: "Why I stopped chasing perfection and started shipping...",
    status: "draft",
    createdAt: "2024-01-07T11:00:00",
    isFavorite: false,
    hasImage: false,
  },
  {
    id: "4",
    content: "After interviewing 100+ candidates, here are the red flags I look for...",
    status: "published",
    publishedAt: "2024-01-05T10:00:00",
    createdAt: "2024-01-05T08:00:00",
    isFavorite: true,
    hasImage: true,
  },
  {
    id: "5",
    content: "The uncomfortable truth about 'hustle culture'...",
    status: "draft",
    createdAt: "2024-01-03T16:00:00",
    isFavorite: false,
    hasImage: false,
  },
];

const tabs: { id: PostStatus; label: string; count: number }[] = [
  { id: "all", label: "All", count: 5 },
  { id: "draft", label: "Drafts", count: 2 },
  { id: "scheduled", label: "Scheduled", count: 1 },
  { id: "published", label: "Published", count: 2 },
];

export default function PostsPage() {
  const [activeTab, setActiveTab] = useState<PostStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredPosts = samplePosts.filter((post) => {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My Posts</h1>
          <p className="text-muted-foreground mt-1">
            Manage all your LinkedIn content in one place
          </p>
        </div>
        <Button variant="linkedin">
          <FileText className="w-4 h-4 mr-2" />
          New Post
        </Button>
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
                      ? "bg-linkedin text-white"
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
                      className="p-1.5 rounded-md hover:bg-accent flex-shrink-0"
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
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      )}
                    >
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </span>

                    {/* Date */}
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.status === "scheduled" && post.scheduledAt
                        ? formatDate(post.scheduledAt)
                        : post.status === "published" && post.publishedAt
                        ? formatDate(post.publishedAt)
                        : formatDate(post.createdAt)}
                    </span>

                    {/* Has Image */}
                    {post.hasImage && (
                      <span className="text-muted-foreground text-xs">
                        + Image
                      </span>
                    )}

                    {/* Favorite */}
                    {post.isFavorite && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button variant="ghost" size="icon-sm" title="View">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </Button>
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
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredPosts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No posts found</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery
                  ? "Try a different search term"
                  : "Create your first post to get started"}
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
          <button className="text-sm hover:text-linkedin transition-colors">
            Delete
          </button>
          <button className="text-sm hover:text-linkedin transition-colors">
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
    </div>
  );
}
