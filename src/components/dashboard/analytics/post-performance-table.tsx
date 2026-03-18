"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ArrowUpDown, Video, FileText, ExternalLink } from "lucide-react";

interface PostData {
  id: string;
  content: string | null;
  postType: string | null;
  publishedAt: string | null;
  linkedinPostUrl?: string | null;
  linkedinImageUrl?: string | null;
  syncedFromLinkedin?: boolean;
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
    .filter((p) => p.analytics && (p.analytics.impressions > 0 || p.analytics.reactions > 0 || p.analytics.comments > 0 || p.analytics.reshares > 0))
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
        <div className="space-y-3">
          {/* Sort controls */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">Sort by:</span>
            <SortButton field="impressions" label="Views" />
            <SortButton field="reactions" label="Reactions" />
            <SortButton field="comments" label="Comments" />
            <SortButton field="reshares" label="Shares" />
            <SortButton field="engagement" label="Rate" />
          </div>

          {/* Post cards */}
          <div className="space-y-3">
            {postsWithMetrics.slice(0, 30).map((post) => (
              <div
                key={post.id}
                className="flex gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                {/* Post thumbnail */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                  {post.linkedinImageUrl ? (
                    <img
                      src={post.linkedinImageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : post.postType === "video" ? (
                    <Video className="w-6 h-6 text-emerald-500" />
                  ) : post.postType === "carousel" ? (
                    <FileText className="w-6 h-6 text-purple-500" />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 flex items-center justify-center">
                      <span className="text-[10px] text-muted-foreground font-medium">TEXT</span>
                    </div>
                  )}
                </div>

                {/* Post info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-[10px] shrink-0 ${typeColors[post.postType || "text"] || typeColors.text}`}>
                      {post.postType || "text"}
                    </Badge>
                    {post.syncedFromLinkedin && (
                      <Badge className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                        LinkedIn
                      </Badge>
                    )}
                    {post.publishedAt && (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                    {post.linkedinPostUrl && (
                      <a
                        href={post.linkedinPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-cyan-600 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-sm truncate max-w-full mb-2">
                    {post.content || "No text content"}
                  </p>

                  {/* Metrics row */}
                  <div className="flex items-center gap-3 sm:gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Views </span>
                      <span className="font-semibold tabular-nums">{post.analytics!.impressions.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reactions </span>
                      <span className="font-semibold tabular-nums">{post.analytics!.reactions.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Comments </span>
                      <span className="font-semibold tabular-nums">{post.analytics!.comments.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Shares </span>
                      <span className="font-semibold tabular-nums">{post.analytics!.reshares.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rate </span>
                      <span className={`font-semibold tabular-nums ${post.engagementRate > 3 ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                        {post.engagementRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
