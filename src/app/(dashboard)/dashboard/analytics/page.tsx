"use client";

import { useSession } from "next-auth/react";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  Lightbulb,
  PartyPopper,
  TrendingUp,
  Eye,
  PieChart,
  Calendar,
  ShieldX,
} from "lucide-react";

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const isTeamMember = session?.user?.isTeamMember === true;

  // Team members cannot access this page - owner's private data
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
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your LinkedIn performance and growth
          </p>
        </div>

        {/* Coming Soon Banner */}
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="py-12 px-8">
            <div className="text-center max-w-lg mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Lightbulb className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
              <p className="text-muted-foreground mb-4">
                We&apos;re working hard to bring you LinkedIn analytics. This feature will allow you to track impressions, engagement, follower growth, and post performance - all from LinkedGrow.
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 rounded-lg p-3">
                This feature requires LinkedIn&apos;s Community Management API approval. We&apos;re in the process of getting access and will notify you when it&apos;s ready.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview of what's coming */}
        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-cyan-500" />
              What to expect
            </h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Eye className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Impressions Tracking</p>
                  <p className="text-xs text-muted-foreground">See how many people view your posts</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Engagement Metrics</p>
                  <p className="text-xs text-muted-foreground">Track likes, comments, and shares</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                  <PieChart className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Top Performing Posts</p>
                  <p className="text-xs text-muted-foreground">Discover what content resonates best</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Best Posting Times</p>
                  <p className="text-xs text-muted-foreground">Learn when your audience is most active</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  );
}
