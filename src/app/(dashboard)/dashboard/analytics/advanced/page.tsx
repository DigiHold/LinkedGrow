"use client";

import dynamic from "next/dynamic";
import { PageShell } from "@/components/dashboard/ui/page";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  ShieldX,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Users as UsersIcon,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DateRangeSelector } from "@/components/dashboard/analytics/date-range-selector";
import { StatCard } from "@/components/dashboard/analytics/stat-card";
// Both charts pull recharts. Lazy so the page shell paints without it.
const chartSkeleton = () => (
  <div className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" />
);
const PostTypeChart = dynamic(
  () => import("@/components/dashboard/analytics/post-type-chart").then((m) => m.PostTypeChart),
  { ssr: false, loading: chartSkeleton }
);
const EngagementTrendChart = dynamic(
  () => import("@/components/dashboard/analytics/engagement-trend-chart").then((m) => m.EngagementTrendChart),
  { ssr: false, loading: chartSkeleton }
);
import { PostingHeatmap } from "@/components/dashboard/analytics/posting-heatmap";
import { DemographicsCharts } from "@/components/dashboard/analytics/demographics-charts";
import { ExportReport } from "@/components/dashboard/analytics/export-report";
import { VideoModal } from "@/components/dashboard/video-modal";

interface AdvancedAnalyticsData {
  summary: {
    totalPosts: number;
    totalImpressions: number;
    totalReactions: number;
    totalComments: number;
    totalShares: number;
    avgEngagement: string;
    followerCount?: number;
    followersGained?: number;
  };
  posts: Array<{
    id: string;
    content: string | null;
    postType: string | null;
    status: string | null;
    publishedAt: string | null;
    createdAt: string | null;
    analytics?: {
      impressions: number;
      reactions: number;
      comments: number;
      reshares: number;
    };
  }>;
  capabilities: {
    isOrganization: boolean;
    hasLinkedInConnected: boolean;
    postingTarget: "profile" | "organization" | null;
  };
  advanced?: {
    postTypePerformance: Array<{ type: string; count: number; avgEngagement: string }>;
    engagementTrend: Array<{ date: string; impressions: number; avgEngagement: string }>;
    bestPostingTimes?: {
      bestDay: string;
      bestHour: string;
      insight: string;
      source: "industry" | "hybrid" | "personal";
      postCount: number;
    };
    postingTimeHeatmap?: Array<{ day: number; hour: number; avgEngagement: number; postCount: number }>;
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

export default function AdvancedAnalyticsPage() {
  const { data: session } = useSession();
  const isTeamMember = session?.user?.isTeamMember === true;

  const [days, setDays] = useState(30);
  const [data, setData] = useState<AdvancedAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (refresh = false) => {
    try {
      // Only show full loading spinner on initial load (no data yet)
      if (!data && !refresh) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);

      const tz = encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
      const res = await fetch(`/api/analytics?days=${days}&advanced=true&tz=${tz}${refresh ? "&refresh=true" : ""}`);
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

  // Team members cannot access this page
  if (isTeamMember) {
    return (
      <PageShell>
        <Card >
          <CardContent className="py-12 px-8">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                <ShieldX className="w-10 h-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Access restricted</h3>
              <p className="text-slate-500 dark:text-slate-400">
                Advanced analytics contains the team owner&apos;s private LinkedIn data and is not accessible to team members.
              </p>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const dateRangeLabel = days === 7 ? "7 days" : days === 30 ? "30 days" : days === 90 ? "90 days" : "1 year";

  return (
    <FeatureGate feature="advancedAnalytics">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/dashboard/analytics"
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-foreground inline-flex items-center gap-1 mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Analytics
            </Link>
            <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              Advanced Analytics
            </h1>
            <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">
              Deep insights into your LinkedIn performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <VideoModal videoId="ytS6de-s704" />
            <DateRangeSelector value={days} onChange={setDays} />
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => fetchAnalytics(true)}
              disabled={isRefreshing}
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="min-h-[50vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
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

        {/* Analytics Content */}
        {data && data.advanced && !isLoading && (
          <>
            {/* Page Views (organization only) */}
            {data.capabilities.isOrganization && (data.advanced.pageViews !== undefined || data.advanced.uniqueVisitors !== undefined) && (
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  icon={Eye}
                  iconColor="text-cyan-600"
                  iconBg="bg-cyan-100 dark:bg-cyan-900/30"
                  label="Page Views"
                  value={data.advanced.pageViews || 0}
                />
                <StatCard
                  icon={UsersIcon}
                  iconColor="text-blue-600"
                  iconBg="bg-blue-100 dark:bg-blue-900/30"
                  label="Unique Visitors"
                  value={data.advanced.uniqueVisitors || 0}
                />
              </div>
            )}

            {/* Content Performance by Type */}
            <PostTypeChart data={data.advanced.postTypePerformance} />

            {/* Engagement Trends */}
            <EngagementTrendChart data={data.advanced.engagementTrend} />

            {/* Posting Times Heatmap */}
            <PostingHeatmap data={data.advanced.postingTimeHeatmap || []} />

            {/* Follower Demographics */}
            {data.advanced.followerDemographics && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-blue-500" />
                  Follower Demographics
                </h2>
                <DemographicsCharts
                  data={data.advanced.followerDemographics}
                  isOrganization={data.capabilities.isOrganization}
                />
              </div>
            )}

            {/* Non-org demographics message */}
            {!data.capabilities.isOrganization && !data.advanced.followerDemographics && (
              <DemographicsCharts
                data={{}}
                isOrganization={false}
              />
            )}

            {/* Export Report */}
            <ExportReport
              data={{
                summary: data.summary,
                posts: data.posts,
                dateRange: dateRangeLabel,
              }}
            />

            {/* Disclaimer */}
            <p className="text-xs text-slate-500 dark:text-slate-400/70 text-center pt-4">
              Overall statistics reflect all your LinkedIn activity. Per-post analytics are fully available for posts published through LinkedGrow. Posts published directly on LinkedIn may appear with limited or no individual metrics.
            </p>
          </>
        )}

        {/* No data */}
        {data && !data.advanced && !isLoading && (
          <Card>
            <CardContent className="py-16 px-8 text-center">
              <p className="text-slate-500 dark:text-slate-400">
                No advanced analytics data available yet. Start publishing posts to see insights.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </FeatureGate>
  );
}
