"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  PenLine,
  FileText,
  Calendar,
  ArrowRight,
  Zap,
  Target,
  Loader2,
  Settings,
  Key,
  CheckCircle2,
  Clock,
} from "lucide-react";

const quickActions = [
  {
    title: "Generate Post",
    description: "Create a viral post with AI",
    href: "/dashboard/generator",
    icon: Sparkles,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    title: "Write Post",
    description: "Start from scratch",
    href: "/dashboard/editor",
    icon: PenLine,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    title: "Import Reddit",
    description: "Convert viral content",
    href: "/dashboard/reddit",
    icon: Zap,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    title: "Get Ideas",
    description: "Browse content ideas",
    href: "/dashboard/ideas",
    icon: Target,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
];

interface Post {
  id: string;
  content: string;
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
}

interface PostsResponse {
  posts: Post[];
}

interface SettingsResponse {
  hasApiKey: boolean;
  aiProvider: string | null;
  linkedinConnected: boolean;
}

interface DashboardStats {
  totalPosts: number;
  drafts: number;
  scheduled: number;
  published: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    drafts: 0,
    scheduled: 0,
    published: 0,
  });
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get user's first name
  const userName = session?.user?.name?.split(" ")[0] ||
                   session?.user?.email?.split("@")[0] ||
                   "there";

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch posts and settings in parallel
        const [postsRes, settingsRes] = await Promise.all([
          fetch("/api/posts?limit=10"),
          fetch("/api/user/settings"),
        ]);

        if (postsRes.ok) {
          const postsData: PostsResponse = await postsRes.json();
          const posts = postsData.posts || [];

          // Calculate stats
          setStats({
            totalPosts: posts.length,
            drafts: posts.filter(p => p.status === "draft").length,
            scheduled: posts.filter(p => p.status === "scheduled").length,
            published: posts.filter(p => p.status === "published").length,
          });

          // Get recent posts (last 3)
          setRecentPosts(posts.slice(0, 3));

          // Get scheduled posts
          setScheduledPosts(
            posts
              .filter(p => p.status === "scheduled" && p.scheduledAt)
              .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
              .slice(0, 3)
          );
        }

        if (settingsRes.ok) {
          const settingsData: SettingsResponse = await settingsRes.json();
          setHasApiKey(settingsData.hasApiKey);
          setLinkedinConnected(settingsData.linkedinConnected);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    } else if (diffDays === 1) {
      return `Tomorrow at ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    } else if (diffDays > 1 && diffDays < 7) {
      return `${date.toLocaleDateString("en-US", { weekday: "short" })} at ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 flex items-center justify-center min-h-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6 sm:space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {userName}!</h1>
          <p className="text-muted-foreground mt-1">
            {hasApiKey
              ? "Ready to create some viral content today?"
              : "Set up your AI API key to get started"}
          </p>
        </div>
        <Link href="/dashboard/editor">
          <Button className="w-full sm:w-auto bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
            <Sparkles className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm text-muted-foreground">Total Posts</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1">{stats.totalPosts}</p>
            <p className="text-xs mt-1 text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm text-muted-foreground">Drafts</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1">{stats.drafts}</p>
            <p className="text-xs mt-1 text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm text-muted-foreground">Scheduled</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1">{stats.scheduled}</p>
            <p className="text-xs mt-1 text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm text-muted-foreground">Published</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1">{stats.published}</p>
            <p className="text-xs mt-1 text-muted-foreground">Live on LinkedIn</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="h-full hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group">
                <CardContent className="p-4 sm:p-5">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${action.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                  >
                    <action.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${action.color}`} />
                  </div>
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Recent Posts</CardTitle>
            <Link
              href="/dashboard/posts"
              className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentPosts.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No posts yet</p>
                <Link href="/dashboard/editor">
                  <Button variant="outline" size="sm" className="mt-3">
                    Create your first post
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {post.content.substring(0, 50)}...
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            post.status === "published"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : post.status === "scheduled"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(post.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Upcoming Schedule</CardTitle>
            <Link
              href="/dashboard/calendar"
              className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              Calendar <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {scheduledPosts.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No scheduled posts</p>
                <Link href="/dashboard/editor">
                  <Button variant="outline" size="sm" className="mt-3">
                    Schedule a post
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {post.content.substring(0, 40)}...
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {post.scheduledAt && formatDate(post.scheduledAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Setup Status / API Key Reminder */}
      {!hasApiKey ? (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Key className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Connect Your AI Provider</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add your OpenAI, Claude, or Gemini API key to start generating posts.
                  </p>
                </div>
              </div>
              <Link href="/dashboard/settings/ai-api">
                <Button className="w-full sm:w-auto bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                  <Key className="w-4 h-4 mr-2" />
                  Add API Key
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200">AI Provider Connected</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You're all set! Start creating content with AI-powered generation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
