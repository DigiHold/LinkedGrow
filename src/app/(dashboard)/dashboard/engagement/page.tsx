"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  ShieldX,
  HelpCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { DailyGoals } from "@/components/dashboard/engagement/daily-goals";
import { ActionLogger } from "@/components/dashboard/engagement/action-logger";
import { AiCommentHelper } from "@/components/dashboard/engagement/ai-comment-helper";
import { CommunityConnectBanner } from "@/components/dashboard/engagement/community-connect-banner";
import { FeedViewer } from "@/components/dashboard/engagement/feed-viewer";

interface EngagementData {
  objectives: {
    dailyLikes: number;
    dailyComments: number;
  };
  today: {
    likes: number;
    comments: number;
  };
  communityConnected: boolean;
  profileName: string;
  profileImage: string;
}

export default function EngagementPage() {
  const { data: session } = useSession();
  const isTeamMember = session?.user?.isTeamMember === true;

  const [data, setData] = useState<EngagementData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/linkedin/engagement");
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to fetch engagement data");
      }
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch engagement data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateGoals = async (likes: number, comments: number) => {
    const res = await fetch("/api/linkedin/engagement", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dailyLikes: likes, dailyComments: comments }),
    });
    if (res.ok) {
      setData((prev) =>
        prev ? { ...prev, objectives: { dailyLikes: likes, dailyComments: comments } } : prev
      );
    }
  };

  const handleLogAction = async (type: "like" | "comment", content?: string) => {
    const res = await fetch("/api/linkedin/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, commentContent: content }),
    });
    if (res.ok) {
      const result = await res.json();
      setData((prev) =>
        prev
          ? {
              ...prev,
              today: {
                likes: result.today?.likes ?? prev.today.likes,
                comments: result.today?.comments ?? prev.today.comments,
              },
            }
          : prev
      );
    }
  };

  const handleDisconnectCommunity = async () => {
    await fetch("/api/linkedin/community/disconnect", { method: "POST" });
  };

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
                This page contains the team owner&apos;s private LinkedIn engagement data and is not accessible to team members.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <FeatureGate feature="engagement">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              Engagement
            </h1>
            <p className="text-muted-foreground mt-1">
              Like and comment on posts to grow your network
            </p>
          </div>
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
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Engagement Content */}
        {data && !isLoading && (
          <>
            {/* Community App Connection */}
            <CommunityConnectBanner
              isConnected={data.communityConnected}
              profileName={data.profileName}
              onDisconnect={handleDisconnectCommunity}
            />

            {/* Two-column layout on desktop */}
            <div className="grid lg:grid-cols-5 gap-6">
              {/* Left column - Goals and actions */}
              <div className="lg:col-span-2 space-y-6">
                <DailyGoals
                  likesCount={data.today.likes}
                  likesGoal={data.objectives.dailyLikes}
                  commentsCount={data.today.comments}
                  commentsGoal={data.objectives.dailyComments}
                  onUpdateGoals={handleUpdateGoals}
                />
                <ActionLogger onLogAction={handleLogAction} />
                <AiCommentHelper />
              </div>

              {/* Right column - Feed */}
              <div className="lg:col-span-3">
                <FeedViewer
                  isConnected={data.communityConnected}
                  onLogAction={handleLogAction}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </FeatureGate>
  );
}
