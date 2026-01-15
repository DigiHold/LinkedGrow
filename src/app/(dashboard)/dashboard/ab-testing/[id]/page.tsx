"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GitBranch,
  ArrowLeft,
  Loader2,
  Play,
  Pause,
  CheckCircle,
  Trophy,
  ExternalLink,
  BarChart3,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

interface AbTest {
  id: string;
  name: string;
  status: "draft" | "running" | "paused" | "completed";
  variantAContent: string;
  variantBContent: string;
  variantAPostId: string | null;
  variantBPostId: string | null;
  winningVariant: "a" | "b" | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

interface VariantStats {
  impressions: number;
  reactions: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

export default function ABTestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const userPlan = (session?.user?.plan || "free") as PlanId;
  const router = useRouter();

  const [test, setTest] = useState<AbTest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual stats input (since LinkedIn API doesn't provide real-time data)
  const [variantAStats, setVariantAStats] = useState<VariantStats>({
    impressions: 0,
    reactions: 0,
    comments: 0,
    shares: 0,
    engagementRate: 0,
  });
  const [variantBStats, setVariantBStats] = useState<VariantStats>({
    impressions: 0,
    reactions: 0,
    comments: 0,
    shares: 0,
    engagementRate: 0,
  });

  useEffect(() => {
    fetchTest();
  }, [id]);

  const fetchTest = async () => {
    try {
      const response = await fetch(`/api/ab-tests/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push("/dashboard/ab-testing");
          return;
        }
        throw new Error("Failed to fetch test");
      }
      const data = await response.json();
      setTest(data);

      // Load saved stats if available
      if (data.variantAStats) setVariantAStats(data.variantAStats);
      if (data.variantBStats) setVariantBStats(data.variantBStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load test");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: AbTest["status"]) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/ab-tests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updated = await response.json();
        setTest((prev) => (prev ? { ...prev, ...updated } : null));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveStats = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/ab-tests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantAStats,
          variantBStats,
        }),
      });

      if (!response.ok) throw new Error("Failed to save stats");
    } catch (err) {
      console.error("Failed to save stats:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeclareWinner = async (winner: "a" | "b") => {
    if (!confirm(`Are you sure you want to declare Variant ${winner.toUpperCase()} as the winner?`)) {
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/ab-tests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          winningVariant: winner,
          variantAStats,
          variantBStats,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setTest((prev) => (prev ? { ...prev, ...updated } : null));
      }
    } catch (err) {
      console.error("Failed to declare winner:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const calculateEngagement = (stats: VariantStats): string => {
    if (stats.impressions === 0) return "0.00";
    return ((stats.reactions + stats.comments + stats.shares) / stats.impressions * 100).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-red-500">{error || "Test not found"}</p>
        <Link href="/dashboard/ab-testing">
          <Button className="mt-4">Back to A/B Tests</Button>
        </Link>
      </div>
    );
  }

  const variantAEngagement = calculateEngagement(variantAStats);
  const variantBEngagement = calculateEngagement(variantBStats);
  const aIsWinning = parseFloat(variantAEngagement) > parseFloat(variantBEngagement);
  const bIsWinning = parseFloat(variantBEngagement) > parseFloat(variantAEngagement);

  return (
    <FeatureGate
      feature="abTesting"
      userPlan={userPlan}
      userEmail={session?.user?.email || ""}
    >
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/dashboard/ab-testing"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to A/B Tests
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <GitBranch className="w-5 h-5 text-white" />
                </div>
                {test.name}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white",
                    test.status === "draft" && "bg-slate-500",
                    test.status === "running" && "bg-green-500",
                    test.status === "paused" && "bg-yellow-500",
                    test.status === "completed" && "bg-blue-500"
                  )}
                >
                  {test.status === "running" ? <Play className="w-3 h-3" /> :
                   test.status === "paused" ? <Pause className="w-3 h-3" /> :
                   test.status === "completed" ? <CheckCircle className="w-3 h-3" /> :
                   <Clock className="w-3 h-3" />}
                  {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                </span>
                {test.winningVariant && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    <Trophy className="w-3 h-3" />
                    Variant {test.winningVariant.toUpperCase()} won
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {test.status === "draft" && (
                <Button onClick={() => handleStatusChange("running")} disabled={isUpdating}>
                  <Play className="w-4 h-4 mr-2" />
                  Start Test
                </Button>
              )}
              {test.status === "running" && (
                <>
                  <Button variant="outline" onClick={() => handleStatusChange("paused")} disabled={isUpdating}>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                </>
              )}
              {test.status === "paused" && (
                <Button onClick={() => handleStatusChange("running")} disabled={isUpdating}>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Variants Comparison */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Variant A */}
          <Card className={cn(
            "relative",
            test.winningVariant === "a" && "ring-2 ring-amber-400"
          )}>
            {test.winningVariant === "a" && (
              <div className="absolute -top-3 -right-3 bg-amber-400 text-amber-900 rounded-full p-2">
                <Trophy className="w-4 h-4" />
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center">
                  A
                </span>
                Variant A
                {!test.winningVariant && aIsWinning && parseFloat(variantAEngagement) > 0 && (
                  <span className="text-xs text-green-600 ml-2">Currently winning</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 max-h-40 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{test.variantAContent}</p>
              </div>

              {/* Stats Input */}
              {(test.status === "running" || test.status === "completed") && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Performance Stats</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Impressions</label>
                      <Input
                        type="number"
                        value={variantAStats.impressions}
                        onChange={(e) => setVariantAStats({...variantAStats, impressions: parseInt(e.target.value) || 0})}
                        disabled={test.status === "completed"}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Reactions</label>
                      <Input
                        type="number"
                        value={variantAStats.reactions}
                        onChange={(e) => setVariantAStats({...variantAStats, reactions: parseInt(e.target.value) || 0})}
                        disabled={test.status === "completed"}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Comments</label>
                      <Input
                        type="number"
                        value={variantAStats.comments}
                        onChange={(e) => setVariantAStats({...variantAStats, comments: parseInt(e.target.value) || 0})}
                        disabled={test.status === "completed"}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Shares</label>
                      <Input
                        type="number"
                        value={variantAStats.shares}
                        onChange={(e) => setVariantAStats({...variantAStats, shares: parseInt(e.target.value) || 0})}
                        disabled={test.status === "completed"}
                      />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Engagement Rate: {variantAEngagement}%
                    </p>
                  </div>
                </div>
              )}

              {test.status === "running" && !test.winningVariant && (
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  onClick={() => handleDeclareWinner("a")}
                  disabled={isUpdating}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Declare A as Winner
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Variant B */}
          <Card className={cn(
            "relative",
            test.winningVariant === "b" && "ring-2 ring-amber-400"
          )}>
            {test.winningVariant === "b" && (
              <div className="absolute -top-3 -right-3 bg-amber-400 text-amber-900 rounded-full p-2">
                <Trophy className="w-4 h-4" />
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-green-500 text-white text-sm font-bold flex items-center justify-center">
                  B
                </span>
                Variant B
                {!test.winningVariant && bIsWinning && parseFloat(variantBEngagement) > 0 && (
                  <span className="text-xs text-green-600 ml-2">Currently winning</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 max-h-40 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{test.variantBContent}</p>
              </div>

              {/* Stats Input */}
              {(test.status === "running" || test.status === "completed") && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Performance Stats</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Impressions</label>
                      <Input
                        type="number"
                        value={variantBStats.impressions}
                        onChange={(e) => setVariantBStats({...variantBStats, impressions: parseInt(e.target.value) || 0})}
                        disabled={test.status === "completed"}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Reactions</label>
                      <Input
                        type="number"
                        value={variantBStats.reactions}
                        onChange={(e) => setVariantBStats({...variantBStats, reactions: parseInt(e.target.value) || 0})}
                        disabled={test.status === "completed"}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Comments</label>
                      <Input
                        type="number"
                        value={variantBStats.comments}
                        onChange={(e) => setVariantBStats({...variantBStats, comments: parseInt(e.target.value) || 0})}
                        disabled={test.status === "completed"}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Shares</label>
                      <Input
                        type="number"
                        value={variantBStats.shares}
                        onChange={(e) => setVariantBStats({...variantBStats, shares: parseInt(e.target.value) || 0})}
                        disabled={test.status === "completed"}
                      />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Engagement Rate: {variantBEngagement}%
                    </p>
                  </div>
                </div>
              )}

              {test.status === "running" && !test.winningVariant && (
                <Button
                  className="w-full bg-green-500 hover:bg-green-600"
                  onClick={() => handleDeclareWinner("b")}
                  disabled={isUpdating}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Declare B as Winner
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Save Stats Button */}
        {test.status === "running" && (
          <div className="flex justify-center">
            <Button onClick={handleSaveStats} disabled={isUpdating} variant="outline">
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Save Stats
            </Button>
          </div>
        )}

        {/* Instructions */}
        {test.status === "draft" && (
          <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Next Steps</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Click "Start Test" to begin the experiment</li>
                <li>Copy each variant and post them to LinkedIn at similar times</li>
                <li>Wait 48-72 hours for engagement data to accumulate</li>
                <li>Enter the stats from LinkedIn into the fields above</li>
                <li>Declare a winner based on the engagement rate</li>
              </ol>
            </CardContent>
          </Card>
        )}

        {test.status === "running" && (
          <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">How to Get Stats from LinkedIn</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Go to your LinkedIn profile and find each post</li>
                <li>Click on the post to see detailed analytics</li>
                <li>Note down impressions, reactions, comments, and shares</li>
                <li>Enter the numbers above and click "Save Stats"</li>
                <li>When ready, click "Declare as Winner" on the better-performing variant</li>
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </FeatureGate>
  );
}
