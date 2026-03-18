"use client";

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
  Eye,
  Users as UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DateRangeSelector } from "@/components/dashboard/analytics/date-range-selector";
import { StatCard } from "@/components/dashboard/analytics/stat-card";
import { PostTypeChart } from "@/components/dashboard/analytics/post-type-chart";
import { EngagementTrendChart } from "@/components/dashboard/analytics/engagement-trend-chart";
import { PostingHeatmap } from "@/components/dashboard/analytics/posting-heatmap";
import { DemographicsCharts } from "@/components/dashboard/analytics/demographics-charts";
import { ExportReport } from "@/components/dashboard/analytics/export-report";

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
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const res = await fetch(`/api/analytics?days=${days}&advanced=true${refresh ? "&refresh=true" : ""}`);
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
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Team members cannot access this page
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
                Advanced analytics contains the team owner&apos;s private LinkedIn data and is not accessible to team members.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
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
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Analytics
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              Advanced Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Deep insights into your LinkedIn performance
            </p>
          </div>
          <div className="flex items-center gap-3">
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
            <p className="text-xs text-muted-foreground/70 text-center pt-4">
              Overall statistics reflect all your LinkedIn activity. Per-post analytics are fully available for posts published through LinkedGrow. Posts published directly on LinkedIn may appear with limited or no individual metrics.
            </p>
          </>
        )}

        {/* No data */}
        {data && !data.advanced && !isLoading && (
          <Card>
            <CardContent className="py-16 px-8 text-center">
              <p className="text-muted-foreground">
                No advanced analytics data available yet. Start publishing posts to see insights.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </FeatureGate>
  );
}
