"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ArrowUpDown } from "lucide-react";

interface PostData {
  id: string;
  content: string | null;
  postType: string | null;
  publishedAt: string | null;
  analytics?: {
    impressions: number;
    reactions: number;
    comments: number;
    reshares: number;
  };
}

interface PostPerformanceTableProps {
  posts: PostData[];
}

type SortKey = "impressions" | "reactions" | "comments" | "reshares" | "engagement";

export function PostPerformanceTable({ posts }: PostPerformanceTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>("impressions");

  const postsWithMetrics = posts
    .filter((p) => p.analytics)
    .map((p) => {
      const a = p.analytics!;
      const engagementRate = a.impressions > 0
        ? ((a.reactions + a.comments + a.reshares) / a.impressions) * 100
        : 0;
      return { ...p, engagementRate };
    })
    .sort((a, b) => {
      if (sortBy === "engagement") return b.engagementRate - a.engagementRate;
      return (b.analytics![sortBy] || 0) - (a.analytics![sortBy] || 0);
    });

  if (postsWithMetrics.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            Post Performance
          </h3>
          <p className="text-muted-foreground text-sm">
            No published posts with analytics data yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const typeColors: Record<string, string> = {
    text: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    image: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    carousel: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    video: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  };

  const SortButton = ({ field, label }: { field: SortKey; label: string }) => (
    <button
      onClick={() => setSortBy(field)}
      className={`flex items-center gap-1 text-xs font-medium transition-colors ${
        sortBy === field ? "text-cyan-600 dark:text-cyan-400" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-500" />
          Post Performance
        </h3>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left pb-3 text-xs font-medium text-muted-foreground w-[40%]">Post</th>
                <th className="text-right pb-3 pr-3"><SortButton field="impressions" label="Views" /></th>
                <th className="text-right pb-3 pr-3"><SortButton field="reactions" label="Reactions" /></th>
                <th className="text-right pb-3 pr-3"><SortButton field="comments" label="Comments" /></th>
                <th className="text-right pb-3 pr-3"><SortButton field="reshares" label="Shares" /></th>
                <th className="text-right pb-3"><SortButton field="engagement" label="Rate" /></th>
              </tr>
            </thead>
            <tbody>
              {postsWithMetrics.slice(0, 20).map((post) => (
                <tr key={post.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] shrink-0 ${typeColors[post.postType || "text"] || typeColors.text}`}>
                        {post.postType || "text"}
                      </Badge>
                      <span className="text-sm truncate max-w-[200px]">
                        {post.content || "Untitled post"}
                      </span>
                    </div>
                    {post.publishedAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </td>
                  <td className="text-right py-3 pr-3 text-sm tabular-nums">{post.analytics!.impressions.toLocaleString()}</td>
                  <td className="text-right py-3 pr-3 text-sm tabular-nums">{post.analytics!.reactions.toLocaleString()}</td>
                  <td className="text-right py-3 pr-3 text-sm tabular-nums">{post.analytics!.comments.toLocaleString()}</td>
                  <td className="text-right py-3 pr-3 text-sm tabular-nums">{post.analytics!.reshares.toLocaleString()}</td>
                  <td className="text-right py-3 text-sm font-medium tabular-nums">
                    <span className={post.engagementRate > 3 ? "text-emerald-600 dark:text-emerald-400" : ""}>
                      {post.engagementRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
