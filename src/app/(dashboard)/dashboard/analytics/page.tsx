"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Users,
  FileText,
  Calendar,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  Loader2,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import Link from "next/link";

// Types matching API response
interface AnalyticsSummary {
  totalPosts: number;
  totalImpressions: number;
  totalReactions: number;
  totalComments: number;
  totalShares: number;
  avgEngagement: string;
  followerCount?: number;
  followersGained?: number;
  membersReached?: number;
}

interface PostAnalyticsData {
  id: string;
  content: string | null;
  postType: string | null;
  status: string | null;
  publishedAt: string | null;
  createdAt: string | null;
  linkedinPostId?: string | null;
  analytics?: {
    impressions: number;
    reactions: number;
    comments: number;
    reshares: number;
    membersReached?: number;
  };
}

interface AnalyticsCapabilities {
  canFetchPostStats: boolean;
  canFetchFollowerCount: boolean;
  canFetchFollowerDemographics: boolean;
  canFetchPageViews: boolean;
  isOrganization: boolean;
  hasLinkedInConnected: boolean;
  postingTarget: "profile" | "organization" | null;
}

interface AnalyticsResponse {
  summary: AnalyticsSummary;
  posts: PostAnalyticsData[];
  capabilities: AnalyticsCapabilities;
  linkedinData?: {
    source: "linkedin_api";
    fetchedAt: string;
  };
  advanced?: {
    postTypePerformance: Array<{ type: string; count: number; avgEngagement: string }>;
    engagementTrend: Array<{ date: string; impressions: number; avgEngagement: string }>;
    bestPostingTimes?: {
      bestDay: string;
      bestHour: string;
      insight: string;
    };
    pageViews?: number;
    uniqueVisitors?: number;
  };
}

type DateRange = "7" | "30" | "90";

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

function AnalyticsContent() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("30");

  const fetchAnalytics = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await fetch(`/api/analytics?days=${dateRange}${refresh ? "&refresh=true" : ""}`);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch analytics");
      }

      const data: AnalyticsResponse = await res.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const handleRefresh = () => fetchAnalytics(true);

  // Build stats cards based on available data
  const buildStatsCards = () => {
    if (!analytics) return [];

    const cards = [];

    // Total Impressions - always show
    cards.push({
      label: "Total Impressions",
      value: formatNumber(analytics.summary.totalImpressions),
      icon: Eye,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    });

    // Engagement Rate - always show
    cards.push({
      label: "Engagement Rate",
      value: `${analytics.summary.avgEngagement}%`,
      icon: Heart,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    });

    // Followers - show if available
    if (analytics.summary.followerCount !== undefined) {
      cards.push({
        label: "Total Followers",
        value: formatNumber(analytics.summary.followerCount),
        change: analytics.summary.followersGained
          ? `+${formatNumber(analytics.summary.followersGained)}`
          : undefined,
        trend: analytics.summary.followersGained && analytics.summary.followersGained > 0 ? "up" : undefined,
        icon: Users,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
      });
    }

    // Members Reached - show for profiles if available
    if (analytics.summary.membersReached !== undefined && analytics.summary.membersReached > 0) {
      cards.push({
        label: "Members Reached",
        value: formatNumber(analytics.summary.membersReached),
        icon: UserPlus,
        color: "text-indigo-500",
        bgColor: "bg-indigo-500/10",
      });
    }

    // Posts This Period - always show
    cards.push({
      label: `Posts (${dateRange}d)`,
      value: analytics.summary.totalPosts.toString(),
      icon: FileText,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    });

    return cards;
  };

  // Sort posts by impressions for top posts
  const getTopPosts = () => {
    if (!analytics) return [];
    return [...analytics.posts]
      .filter(p => p.analytics || p.linkedinPostId)
      .sort((a, b) => (b.analytics?.impressions || 0) - (a.analytics?.impressions || 0))
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-linkedin" />
              Analytics
            </h1>
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 sm:p-6">
                <Skeleton className="h-10 w-10 rounded-lg mb-3" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800">
          <CardContent className="p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 dark:text-red-200">
                Failed to load analytics
              </h3>
              <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => fetchAnalytics()}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statsCards = buildStatsCards();
  const topPosts = getTopPosts();
  const hasLinkedIn = analytics?.capabilities.hasLinkedInConnected;
  const postingTarget = analytics?.capabilities.postingTarget;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-linkedin" />
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            {hasLinkedIn ? (
              postingTarget === "organization" ? (
                "Company page performance and growth"
              ) : (
                "Your LinkedIn profile performance"
              )
            ) : (
              "Connect LinkedIn to see real-time analytics"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Community Management API Notice */}
      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
        <CardContent className="py-4 px-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Full analytics features require LinkedIn&apos;s Community Management API approval. We&apos;re in the process of getting access and will notify you when it&apos;s ready.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* LinkedIn Connection CTA - show if not connected */}
      {!hasLinkedIn && (
        <Card className="border-linkedin/20 bg-linkedin/5">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">Connect LinkedIn for real analytics</h3>
                <p className="text-muted-foreground mt-1">
                  Get impressions, reactions, comments, and follower growth from your actual LinkedIn data
                </p>
              </div>
              <Button variant="linkedin" asChild>
                <Link href="/dashboard/settings">
                  Connect LinkedIn
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Source Indicator */}
      {analytics?.linkedinData && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Live data from LinkedIn</span>
          <span className="text-xs">
            - Last updated: {new Date(analytics.linkedinData.fetchedAt).toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Stats Grid */}
      <div className={cn(
        "grid gap-3 sm:gap-4",
        statsCards.length <= 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 lg:grid-cols-5"
      )}>
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                {stat.change && stat.trend && (
                  <span
                    className={cn(
                      "flex items-center gap-1 text-xs font-medium",
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {stat.trend === "up" ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Engagement Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Engagement Breakdown</CardTitle>
            <CardDescription>Last {dateRange} days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/10">
                <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{formatNumber(analytics?.summary.totalReactions || 0)}</p>
                <p className="text-sm text-muted-foreground">Reactions</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                <MessageSquare className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{formatNumber(analytics?.summary.totalComments || 0)}</p>
                <p className="text-sm text-muted-foreground">Comments</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/10">
                <Share2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{formatNumber(analytics?.summary.totalShares || 0)}</p>
                <p className="text-sm text-muted-foreground">Shares</p>
              </div>
            </div>

            {/* Engagement insights */}
            {analytics?.advanced?.bestPostingTimes && (
              <div className="mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Best Time to Post
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {analytics.advanced.bestPostingTimes.insight}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>Key metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Posts</span>
              <span className="font-semibold">{analytics?.summary.totalPosts || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg. Engagement</span>
              <span className="font-semibold">{analytics?.summary.avgEngagement || "0"}%</span>
            </div>
            {analytics?.summary.followerCount !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Followers</span>
                <span className="font-semibold">{formatNumber(analytics.summary.followerCount)}</span>
              </div>
            )}
            {analytics?.summary.followersGained !== undefined && analytics.summary.followersGained > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New Followers</span>
                <span className="font-semibold text-green-600">+{formatNumber(analytics.summary.followersGained)}</span>
              </div>
            )}

            {/* Advanced analytics link for Business users */}
            <hr className="my-4" />
            <Link
              href="/dashboard/analytics/advanced"
              className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
            >
              <span className="text-sm font-medium">View Advanced Analytics</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Posts */}
      {topPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Posts</CardTitle>
            <CardDescription>Posts with the highest impressions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPosts.map((post, index) => (
                <div
                  key={post.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold",
                      index === 0
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : index === 1
                        ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    )}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-1">
                      {post.content || "Post content not available"}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                      {post.analytics && (
                        <>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {formatNumber(post.analytics.impressions)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {formatNumber(post.analytics.reactions)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {formatNumber(post.analytics.comments)}
                          </span>
                        </>
                      )}
                      {post.publishedAt && (
                        <span>
                          {new Date(post.publishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  {post.linkedinPostId && (
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Posts State */}
      {analytics?.posts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No posts yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Create and publish posts to see your analytics
            </p>
            <Button asChild>
              <Link href="/dashboard/generator">Create Post</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <FeatureGate feature="analytics">
      <AnalyticsContent />
    </FeatureGate>
  );
}
