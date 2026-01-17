"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FeatureGate } from "@/components/dashboard/feature-gate";
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
  const [tests, setTests] = useState<AbTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      console.error("Failed to fetch A/B tests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this A/B test?")) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/ab-tests/${id}`, { method: "DELETE" });
      if (response.ok) {
        setTests(tests.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete test:", error);
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
      console.error("Failed to update test status:", error);
    }
  };

  return (
    <FeatureGate feature="abTesting">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-white" />
              </div>
              A/B Testing
            </h1>
            <p className="text-muted-foreground mt-1">
              Test different versions of your posts to see what works best
            </p>
          </div>
          <Link href="/dashboard/ab-testing/new">
            <Button className="bg-linear-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              New A/B Test
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Tests", value: tests.length, color: "text-violet-500" },
            { label: "Running", value: tests.filter((t) => t.status === "running").length, color: "text-green-500" },
            { label: "Completed", value: tests.filter((t) => t.status === "completed").length, color: "text-blue-500" },
            { label: "Drafts", value: tests.filter((t) => t.status === "draft").length, color: "text-slate-500" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <p className={cn("text-3xl font-bold", stat.color)}>{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tests List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : tests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <GitBranch className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No A/B tests yet</h3>
              <p className="text-muted-foreground mb-4">
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
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{test.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
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
                        <div className="flex items-center gap-2">
                          <Link href={`/dashboard/ab-testing/${test.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(test.id)}
                            disabled={deletingId === test.id}
                          >
                            {deletingId === test.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-500" />
                            )}
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
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {test.variantAContent}
                          </p>
                          {test.variantAStats && (
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
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
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {test.variantBContent}
                          </p>
                          {test.variantBStats && (
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{test.variantBStats.impressions.toLocaleString()} impressions</span>
                              <span>{test.variantBStats.engagement}% engagement</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="lg:w-48 p-4 lg:p-6 bg-slate-50 dark:bg-slate-800/50 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-muted-foreground mb-3">
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
        <Card className="bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800">
          <CardContent className="p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-violet-600" />
              How A/B Testing Works
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-violet-700 dark:text-violet-300">1. Create variants</p>
                <p className="text-muted-foreground">Write two different versions of your post content</p>
              </div>
              <div>
                <p className="font-medium text-violet-700 dark:text-violet-300">2. Publish both</p>
                <p className="text-muted-foreground">Post both variants to LinkedIn at similar times</p>
              </div>
              <div>
                <p className="font-medium text-violet-700 dark:text-violet-300">3. Pick the winner</p>
                <p className="text-muted-foreground">After a few days, compare engagement and declare a winner</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  );
}
