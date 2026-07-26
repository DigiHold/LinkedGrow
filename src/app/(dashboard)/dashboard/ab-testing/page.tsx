"use client";

import { useState, useEffect } from "react";
import { PageShell } from "@/components/dashboard/ui/page";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  GitBranch,
  Plus,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Trash2,
  Eye,
  Trophy,
  Loader2,
  BarChart3,
  AlertCircle,
  ShieldX,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FeatureGate } from "@/components/dashboard/feature-gate";
import { cn } from "@/lib/utils";
import { VideoModal } from "@/components/dashboard/video-modal";

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
  // Computed stats from posts
  variantAStats?: { impressions: number; engagement: number };
  variantBStats?: { impressions: number; engagement: number };
}

const statusConfig = {
  draft: { label: "Draft", color: "bg-slate-500", icon: Clock },
  running: { label: "Running", color: "bg-green-500", icon: Play },
  paused: { label: "Paused", color: "bg-yellow-500", icon: Pause },
  completed: { label: "Completed", color: "bg-blue-500", icon: CheckCircle },
};

export default function ABTestingPage() {
  const { data: session } = useSession();
  const isTeamMember = session?.user?.isTeamMember === true;

  const [tests, setTests] = useState<AbTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTest, setDeleteTest] = useState<AbTest | null>(null);

  // Team members cannot manage A/B tests - owner only
  if (isTeamMember) {
    return (
      <FeatureGate feature="abTesting">
        <PageShell>
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
            <CardContent className="py-12 px-8">
              <div className="text-center max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <ShieldX className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Access restricted</h3>
                <p className="text-slate-500 dark:text-slate-400">
                  A/B testing management is only available to team owners. Contact the team owner to set up A/B tests.
                </p>
              </div>
            </CardContent>
          </Card>
        </PageShell>
      </FeatureGate>
    );
  }

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await fetch("/api/ab-tests");
      if (response.ok) {
        const data = await response.json();
        setTests(data.tests || []);
      }
    } catch (error) {
} finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTest) return;

    setDeletingId(deleteTest.id);
    try {
      const response = await fetch(`/api/ab-tests/${deleteTest.id}`, { method: "DELETE" });
      if (response.ok) {
        setTests(tests.filter((t) => t.id !== deleteTest.id));
        setDeleteTest(null);
      }
    } catch (error) {
} finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: AbTest["status"]) => {
    try {
      const response = await fetch(`/api/ab-tests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updated = await response.json();
        setTests(tests.map((t) => (t.id === id ? { ...t, ...updated } : t)));
      }
    } catch (error) {
}
  };

  return (
    <FeatureGate feature="abTesting">
      <div className="mx-auto w-full max-w-7xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">
              A/B testing
            </h1>
            <p className="mt-2 text-[15px] text-slate-500 dark:text-slate-400">
              Run two versions of a post and keep the one that performs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <VideoModal videoId="al7K5HK8hxc" />
            <Link href="/docs/business-features/ab-testing" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-white">
              <HelpCircle className="w-3.5 h-3.5" />
              Docs
            </Link>
            <Link href="/dashboard/ab-testing/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New A/B Test
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Tests", value: tests.length, color: "text-cyan-500" },
            { label: "Running", value: tests.filter((t) => t.status === "running").length, color: "text-green-500" },
            { label: "Completed", value: tests.filter((t) => t.status === "completed").length, color: "text-blue-500" },
            { label: "Drafts", value: tests.filter((t) => t.status === "draft").length, color: "text-slate-500" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <p className={cn("text-3xl font-bold", stat.color)}>{stat.value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tests List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        ) : tests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <GitBranch className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No A/B tests yet</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Create your first A/B test to compare different versions of your posts
              </p>
              <Link href="/dashboard/ab-testing/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create A/B Test
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tests.map((test) => {
              const StatusIcon = statusConfig[test.status].icon;
              const hasWinner = test.status === "completed" && test.winningVariant;

              return (
                <Card key={test.id} className="overflow-hidden">
                  <div className="flex flex-col lg:flex-row">
                    {/* Test Info */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-lg">{test.name}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white",
                                statusConfig[test.status].color
                              )}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig[test.status].label}
                            </span>
                            {hasWinner && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                <Trophy className="w-3 h-3" />
                                Variant {test.winningVariant?.toUpperCase()} won
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link href={`/dashboard/ab-testing/${test.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteTest(test)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>

                      {/* Variant Previews */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Variant A */}
                        <div
                          className={cn(
                            "p-4 rounded-lg border-2",
                            hasWinner && test.winningVariant === "a"
                              ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10"
                              : "border-slate-200 dark:border-slate-700"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">Variant A</span>
                            {hasWinner && test.winningVariant === "a" && (
                              <Trophy className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                            {test.variantAContent}
                          </p>
                          {test.variantAStats && (
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                              <span>{test.variantAStats.impressions.toLocaleString()} impressions</span>
                              <span>{test.variantAStats.engagement}% engagement</span>
                            </div>
                          )}
                        </div>

                        {/* Variant B */}
                        <div
                          className={cn(
                            "p-4 rounded-lg border-2",
                            hasWinner && test.winningVariant === "b"
                              ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10"
                              : "border-slate-200 dark:border-slate-700"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">Variant B</span>
                            {hasWinner && test.winningVariant === "b" && (
                              <Trophy className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                            {test.variantBContent}
                          </p>
                          {test.variantBStats && (
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                              <span>{test.variantBStats.impressions.toLocaleString()} impressions</span>
                              <span>{test.variantBStats.engagement}% engagement</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="lg:w-48 p-4 lg:p-6 bg-slate-50 dark:bg-slate-800/50 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        Created {new Date(test.createdAt).toLocaleDateString()}
                      </p>

                      {test.status === "draft" && (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleStatusChange(test.id, "running")}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start Test
                        </Button>
                      )}

                      {test.status === "running" && (
                        <div className="space-y-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => handleStatusChange(test.id, "paused")}
                          >
                            <Pause className="w-4 h-4 mr-1" />
                            Pause
                          </Button>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleStatusChange(test.id, "completed")}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            End Test
                          </Button>
                        </div>
                      )}

                      {test.status === "paused" && (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleStatusChange(test.id, "running")}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Resume
                        </Button>
                      )}

                      {test.status === "completed" && (
                        <Link href={`/dashboard/ab-testing/${test.id}`}>
                          <Button size="sm" variant="outline" className="w-full">
                            <BarChart3 className="w-4 h-4 mr-1" />
                            View Results
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* How it works */}
        <Card className="bg-cyan-50 dark:bg-cyan-900/10 border-cyan-200 dark:border-cyan-800">
          <CardContent className="p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-cyan-600" />
              How A/B Testing Works
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-cyan-700 dark:text-cyan-300">1. Create variants</p>
                <p className="text-slate-500 dark:text-slate-400">Write two different versions of your post content</p>
              </div>
              <div>
                <p className="font-medium text-cyan-700 dark:text-cyan-300">2. Publish both</p>
                <p className="text-slate-500 dark:text-slate-400">Post both variants to LinkedIn at similar times</p>
              </div>
              <div>
                <p className="font-medium text-cyan-700 dark:text-cyan-300">3. Pick the winner</p>
                <p className="text-slate-500 dark:text-slate-400">After a few days, compare engagement and declare a winner</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Modal */}
        {deleteTest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => !deletingId && setDeleteTest(null)}
            />
            <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden z-10">
              <div className="p-6">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-lg font-semibold text-center mb-2">Delete A/B Test</h2>
                <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-2">
                  Are you sure you want to delete this A/B test?
                </p>
                <p className="text-sm font-medium text-center mb-6 text-foreground">
                  "{deleteTest.name}"
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setDeleteTest(null)}
                    disabled={!!deletingId}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleDeleteConfirm}
                    disabled={!!deletingId}
                  >
                    {deletingId ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
