"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  TrendingUp,
  Download,
  Calendar,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  FileSpreadsheet,
  FileText,
  Loader2,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Users,
  Globe,
  Briefcase,
  Building2,
  UserCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Types matching API response
interface AnalyticsResponse {
  summary: {
    totalPosts: number;
    totalImpressions: number;
    totalReactions: number;
    totalComments: number;
    totalShares: number;
    avgEngagement: string;
    followerCount?: number;
    followersGained?: number;
    membersReached?: number;
  };
  posts: Array<{
    id: string;
    content: string | null;
    postType: string | null;
    status: string | null;
    publishedAt: string | null;
    analytics?: {
      impressions: number;
      reactions: number;
      comments: number;
      reshares: number;
    };
  }>;
  capabilities: {
    canFetchPostStats: boolean;
    canFetchFollowerCount: boolean;
    canFetchFollowerDemographics: boolean;
    canFetchPageViews: boolean;
    isOrganization: boolean;
    hasLinkedInConnected: boolean;
    postingTarget: "profile" | "organization" | null;
  };
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
    followerDemographics?: {
      byCountry?: Array<{ country: string; count: number; percentage: number }>;
      byIndustry?: Array<{ industry: string; count: number; percentage: number }>;
      byFunction?: Array<{ function: string; count: number; percentage: number }>;
      bySeniority?: Array<{ seniority: string; count: number; percentage: number }>;
    };
  };
}

type DateRange = "7" | "30" | "90";

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

function AdvancedAnalyticsContent() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("30");
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf" | null>(null);

  const fetchAnalytics = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await fetch(`/api/analytics?days=${dateRange}&advanced=true${refresh ? "&refresh=true" : ""}`);

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

  const handleExport = async (format: "csv" | "pdf") => {
    if (!analytics) return;

    setIsExporting(true);
    setExportFormat(format);

    try {
      if (format === "csv") {
        const csvContent = generateCSV(analytics);
        downloadFile(csvContent, `analytics-${dateRange}days.csv`, "text/csv");
      } else {
        alert("PDF export coming soon. CSV export is available now.");
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  const generateCSV = (data: AnalyticsResponse) => {
    const rows = [
      ["Metric", "Value"],
      ["Total Posts", data.summary.totalPosts.toString()],
      ["Total Impressions", data.summary.totalImpressions.toString()],
      ["Total Reactions", data.summary.totalReactions.toString()],
      ["Total Comments", data.summary.totalComments.toString()],
      ["Total Shares", data.summary.totalShares.toString()],
      ["Avg Engagement", data.summary.avgEngagement + "%"],
      data.summary.followerCount !== undefined ? ["Followers", data.summary.followerCount.toString()] : null,
      data.summary.followersGained !== undefined ? ["Followers Gained", data.summary.followersGained.toString()] : null,
      ["", ""],
      ["Post Type Performance", ""],
      ...(data.advanced?.postTypePerformance || []).map(p => [p.type, `${p.count} posts, ${p.avgEngagement}% avg`]),
    ].filter(Boolean) as string[][];

    return rows.map((row) => row.join(",")).join("\n");
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calculate post type stats from posts
  const getPostTypeStats = () => {
    if (!analytics?.posts) return [];

    // If we have advanced data, use it
    if (analytics.advanced?.postTypePerformance?.length) {
      return analytics.advanced.postTypePerformance.map(p => ({
        type: p.type.charAt(0).toUpperCase() + p.type.slice(1),
        count: p.count,
        avgEngagement: parseFloat(p.avgEngagement),
        color: getTypeColor(p.type),
      }));
    }

    // Otherwise calculate from posts
    const stats: Record<string, { count: number; totalEngagement: number }> = {};
    analytics.posts.forEach(post => {
      const type = post.postType || "text";
      if (!stats[type]) stats[type] = { count: 0, totalEngagement: 0 };
      stats[type].count++;
      if (post.analytics && post.analytics.impressions > 0) {
        const engagement = ((post.analytics.reactions + post.analytics.comments + post.analytics.reshares) / post.analytics.impressions) * 100;
        stats[type].totalEngagement += engagement;
      }
    });

    return Object.entries(stats).map(([type, data]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count: data.count,
      avgEngagement: data.count > 0 ? data.totalEngagement / data.count : 0,
      color: getTypeColor(type),
    }));
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      text: "bg-blue-500",
      image: "bg-green-500",
      carousel: "bg-purple-500",
      video: "bg-red-500",
      article: "bg-orange-500",
      document: "bg-cyan-500",
    };
    return colors[type.toLowerCase()] || "bg-gray-500";
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              Advanced Analytics
            </h1>
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
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

  const postTypeStats = getPostTypeStats();
  const maxEngagement = Math.max(...postTypeStats.map(p => p.avgEngagement), 1);
  const isOrganization = analytics?.capabilities.isOrganization;
  const hasDemographics = analytics?.advanced?.followerDemographics;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            Advanced Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            {isOrganization ? "Company page deep insights" : "Deep insights into your LinkedIn performance"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {(["7", "30", "90"] as DateRange[]).map((days) => (
              <button
                key={days}
                onClick={() => setDateRange(days)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors",
                  dateRange === days
                    ? "bg-white dark:bg-slate-700 shadow-sm font-medium"
                    : "hover:bg-white/50 dark:hover:bg-slate-700/50"
                )}
              >
                {days}d
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("csv")}
            disabled={isExporting}
          >
            {isExporting && exportFormat === "csv" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            Export
          </Button>
        </div>
      </div>

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

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{formatNumber(analytics?.summary.totalImpressions || 0)}</p>
            <p className="text-sm text-muted-foreground">Total Impressions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold">{formatNumber(analytics?.summary.totalReactions || 0)}</p>
            <p className="text-sm text-muted-foreground">Total Reactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{formatNumber(analytics?.summary.totalComments || 0)}</p>
            <p className="text-sm text-muted-foreground">Total Comments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Share2 className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold">{formatNumber(analytics?.summary.totalShares || 0)}</p>
            <p className="text-sm text-muted-foreground">Total Shares</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Post Type Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              Content Performance by Type
            </CardTitle>
            <CardDescription>
              Which content formats work best for you
            </CardDescription>
          </CardHeader>
          <CardContent>
            {postTypeStats.length > 0 ? (
              <div className="space-y-4">
                {postTypeStats.map((item) => (
                  <div key={item.type} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.type}</span>
                      <span className="text-muted-foreground">
                        {item.count} posts - {item.avgEngagement.toFixed(1)}% avg
                      </span>
                    </div>
                    <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                      <div
                        className={cn("h-full rounded-lg transition-all flex items-center justify-end pr-2", item.color)}
                        style={{ width: `${Math.max((item.avgEngagement / maxEngagement) * 100, 10)}%` }}
                      >
                        <span className="text-white text-xs font-medium">
                          {item.avgEngagement.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No post data available yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Best Posting Times */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-500" />
              Best Times to Post
            </CardTitle>
            <CardDescription>
              When your audience is most engaged
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.advanced?.bestPostingTimes ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-sm text-muted-foreground">Best Day</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                      {analytics.advanced.bestPostingTimes.bestDay}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-muted-foreground">Best Time</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {analytics.advanced.bestPostingTimes.bestHour}
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-sm text-muted-foreground">
                    {analytics.advanced.bestPostingTimes.insight}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Post more content to discover your best posting times</p>
                <p className="text-xs mt-1">Need at least 3 published posts with analytics</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Organization-only: Page Statistics */}
      {isOrganization && (analytics?.advanced?.pageViews !== undefined || analytics?.advanced?.uniqueVisitors !== undefined) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              Company Page Statistics
            </CardTitle>
            <CardDescription>Page views and visitor metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                <p className="text-sm text-muted-foreground">Page Views</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                  {formatNumber(analytics?.advanced?.pageViews || 0)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/10">
                <p className="text-sm text-muted-foreground">Unique Visitors</p>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                  {formatNumber(analytics?.advanced?.uniqueVisitors || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organization-only: Follower Demographics */}
      {isOrganization && hasDemographics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              Follower Demographics
            </CardTitle>
            <CardDescription>
              Understand who follows your company page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* By Country */}
              {hasDemographics?.byCountry && hasDemographics.byCountry.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-blue-500" />
                    By Country
                  </h4>
                  <div className="space-y-2">
                    {hasDemographics.byCountry.slice(0, 5).map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="truncate">{item.country}</span>
                        <span className="text-muted-foreground">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* By Industry */}
              {hasDemographics?.byIndustry && hasDemographics.byIndustry.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-green-500" />
                    By Industry
                  </h4>
                  <div className="space-y-2">
                    {hasDemographics.byIndustry.slice(0, 5).map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="truncate">{item.industry}</span>
                        <span className="text-muted-foreground">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* By Function */}
              {hasDemographics?.byFunction && hasDemographics.byFunction.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                    <Briefcase className="w-4 h-4 text-purple-500" />
                    By Function
                  </h4>
                  <div className="space-y-2">
                    {hasDemographics.byFunction.slice(0, 5).map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="truncate">{item.function}</span>
                        <span className="text-muted-foreground">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* By Seniority */}
              {hasDemographics?.bySeniority && hasDemographics.bySeniority.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                    <UserCircle className="w-4 h-4 text-orange-500" />
                    By Seniority
                  </h4>
                  <div className="space-y-2">
                    {hasDemographics.bySeniority.slice(0, 5).map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="truncate">{item.seniority}</span>
                        <span className="text-muted-foreground">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organization notice for personal profiles */}
      {!isOrganization && analytics?.capabilities.hasLinkedInConnected && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                  Want more detailed analytics?
                </h3>
                <p className="text-blue-700 dark:text-blue-300 mt-1 text-sm">
                  Company pages have access to follower demographics, page views, and visitor insights.
                  Switch to posting as a company page in Settings to unlock these features.
                </p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/dashboard/settings">
                    Go to Settings
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audience Growth */}
      {analytics?.summary.followerCount !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-orange-500" />
              Audience Summary
            </CardTitle>
            <CardDescription>
              Your follower metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="text-sm text-muted-foreground">Total Followers</p>
                <p className="text-3xl font-bold">{formatNumber(analytics.summary.followerCount)}</p>
              </div>
              {analytics.summary.followersGained !== undefined && analytics.summary.followersGained > 0 && (
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/10">
                  <p className="text-sm text-muted-foreground">New Followers ({dateRange}d)</p>
                  <p className="text-3xl font-bold text-emerald-600">+{formatNumber(analytics.summary.followersGained)}</p>
                </div>
              )}
              {analytics.summary.membersReached !== undefined && analytics.summary.membersReached > 0 && (
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                  <p className="text-sm text-muted-foreground">Members Reached</p>
                  <p className="text-3xl font-bold text-blue-600">{formatNumber(analytics.summary.membersReached)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back to basic analytics */}
      <div className="text-center">
        <Link href="/dashboard/analytics" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Back to Basic Analytics
        </Link>
      </div>
    </div>
  );
}

export default function AdvancedAnalyticsPage() {
  const { data: session } = useSession();
  const userPlan = (session?.user as { plan?: string } | undefined)?.plan || "free";

  return (
    <FeatureGate
      feature="advancedAnalytics"
      userPlan={userPlan as "free" | "starter" | "pro" | "business"}
      userEmail={session?.user?.email || ""}
    >
      <AdvancedAnalyticsContent />
    </FeatureGate>
  );
}
