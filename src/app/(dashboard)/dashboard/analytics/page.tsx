"use client";

import dynamic from "next/dynamic";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  Heart,
  Users,
  TrendingUp,
  ShieldX,
  HelpCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DateRangeSelector } from "@/components/dashboard/analytics/date-range-selector";
import { VideoModal } from "@/components/dashboard/video-modal";
import { StatCard } from "@/components/dashboard/analytics/stat-card";
import { AnalyticsEmptyState } from "@/components/dashboard/analytics/empty-state";
// recharts is ~400 KB and only renders below the fold. Loading it lazily takes
// it out of the analytics page bundle; ssr:false because it measures the DOM.
const FollowerChart = dynamic(
  () => import("@/components/dashboard/analytics/follower-chart").then((m) => m.FollowerChart),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" /> }
);
import { BestTimeCard } from "@/components/dashboard/analytics/best-time-card";
import { PostPerformanceTable } from "@/components/dashboard/analytics/post-performance-table";

interface AnalyticsData {
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
    createdAt: string | null;
    linkedinPostId?: string | null;
    linkedinPostUrl?: string | null;
    linkedinImageUrl?: string | null;
    syncedFromLinkedin?: boolean;
    analytics?: {
      impressions: number;
      reactions: number;
      comments: number;
      reshares: number;
      membersReached?: number;
    };
  }>;
  followerGrowth?: Array<{ date: string; count: number }>;
  capabilities: {
    canFetchPostStats: boolean;
    canFetchFollowerCount: boolean;
    canFetchFollowerDemographics: boolean;
    canFetchPageViews: boolean;
    isOrganization: boolean;
    hasLinkedInConnected: boolean;
    postingTarget: "profile" | "organization" | null;
  };
  advanced?: {
    bestPostingTimes?: {
      bestDay: string;
      bestHour: string;
      insight: string;
      source: "industry" | "hybrid" | "personal";
      postCount: number;
    };
  };
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const isTeamMember = session?.user?.isTeamMember === true;
  const teamRole = session?.user?.teamRole;
  const isBusinessPlan = session?.user?.plan === "business";

  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (refresh = false) => {
    try {
      // Only show full loading spinner on initial load (no data yet)
      if (!data && !refresh) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);

      const tz = encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
      const res = await fetch(`/api/analytics?days=${days}&tz=${tz}${refresh ? "&refresh=true" : ""}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to fetch analytics");
      }

      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analytics");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto-refresh when posting target changes (profile <-> company page)
  useEffect(() => {
    const handleTargetChange = () => fetchAnalytics(true);
    window.addEventListener("linkedin-target-changed", handleTargetChange);
    return () => window.removeEventListener("linkedin-target-changed", handleTargetChange);
  }, [fetchAnalytics]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/analytics/sync", { method: "POST" });
      const result = await res.json();
      if (res.ok) {
        setSyncMessage(`Synced ${result.synced} new posts, ${result.imagesDownloaded} images downloaded`);
        // Refresh analytics after sync
        await fetchAnalytics(true);
        setTimeout(() => setSyncMessage(null), 5000);
      } else {
        setSyncMessage(result.error || "Sync failed");
        setTimeout(() => setSyncMessage(null), 5000);
      }
    } catch {
      setSyncMessage("Sync failed");
      setTimeout(() => setSyncMessage(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Only "member" role is restricted - admins can view analytics
  if (isTeamMember && teamRole === "member") {
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
                This page contains the team owner&apos;s private LinkedIn analytics data and is not accessible to team members.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <FeatureGate feature="analytics">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">
              Analytics
            </h1>
            <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">
              Track your LinkedIn performance and growth
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangeSelector value={days} onChange={setDays} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              title="Sync all LinkedIn posts"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
              Sync
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => fetchAnalytics(true)}
              disabled={isRefreshing}
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
            <VideoModal videoId="u3glQrlzhHs" />
            <Link
              href="/docs/getting-started/understanding-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 inline-flex items-center gap-1 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Help?
            </Link>
          </div>
        </div>

        {/* Sync Message */}
        {syncMessage && (
          <div className="p-3 rounded-lg text-sm flex items-center gap-2 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400">
            <Download className="w-4 h-4 shrink-0" />
            {syncMessage}
          </div>
        )}

        {/* Advanced Analytics Link */}
        {isBusinessPlan && (
          <Link
            href="/dashboard/analytics/advanced"
            className="block p-3 rounded-xl bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Advanced Analytics available
                </span>
                <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                  Demographics, content performance, export reports
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </Link>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="min-h-[50vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="py-8 px-6 text-center">
              <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={() => fetchAnalytics()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No LinkedIn Connected */}
        {data && !data.capabilities.hasLinkedInConnected && !isLoading && (
          <AnalyticsEmptyState type="no-linkedin" />
        )}

        {/* Analytics Content */}
        {data && data.capabilities.hasLinkedInConnected && !isLoading && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Eye}
                iconColor="text-blue-600"
                iconBg="bg-blue-100 dark:bg-blue-900/30"
                label="Total Impressions"
                value={data.summary.totalImpressions}
              />
              <StatCard
                icon={Heart}
                iconColor="text-emerald-600"
                iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                label="Total Reactions"
                value={data.summary.totalReactions}
              />
              <StatCard
                icon={Users}
                iconColor="text-purple-600"
                iconBg="bg-purple-100 dark:bg-purple-900/30"
                label="Followers"
                value={data.summary.followerCount || 0}
                change={data.summary.followersGained ? `+${data.summary.followersGained} gained` : undefined}
                changeType="positive"
              />
              <StatCard
                icon={TrendingUp}
                iconColor="text-amber-600"
                iconBg="bg-amber-100 dark:bg-amber-900/30"
                label="Engagement Rate"
                value={`${data.summary.avgEngagement}%`}
              />
            </div>

            {/* Follower Growth Chart */}
            <FollowerChart data={data.followerGrowth || []} />

            {/* Best Time to Post */}
            <BestTimeCard
              bestDay={data.advanced?.bestPostingTimes?.bestDay}
              bestHour={data.advanced?.bestPostingTimes?.bestHour}
              insight={data.advanced?.bestPostingTimes?.insight}
              source={data.advanced?.bestPostingTimes?.source}
              postCount={data.advanced?.bestPostingTimes?.postCount}
            />

            {/* Post Performance Table */}
            <PostPerformanceTable posts={data.posts} />

            {/* No Posts State */}
            {data.summary.totalPosts === 0 && (
              <AnalyticsEmptyState type="no-data" />
            )}

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground/70 text-center pt-4">
              Overall statistics reflect all your LinkedIn activity. Per-post analytics are fully available for posts published through LinkedGrow. Posts published directly on LinkedIn may appear with limited or no individual metrics.
            </p>
          </>
        )}
      </div>
    </FeatureGate>
  );
}
