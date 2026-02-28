"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,
} from "lucide-react";

interface FeedbackEntry {
  id: string;
  articleSlug: string;
  categorySlug: string;
  helpful: boolean;
  reason: string | null;
  createdAt: string;
}

interface ArticleStat {
  articleSlug: string;
  categorySlug: string;
  totalVotes: number;
  helpfulVotes: number;
  notHelpfulVotes: number;
  commentCount: number;
}

interface Summary {
  totalFeedback: number;
  totalHelpful: number;
  totalNotHelpful: number;
  totalComments: number;
}

function slugToTitle(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DocsFeedbackPage() {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [stats, setStats] = useState<ArticleStat[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalFeedback: 0, totalHelpful: 0, totalNotHelpful: 0, totalComments: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<"all" | "helpful" | "not-helpful">("all");
  const [tab, setTab] = useState<"overview" | "feedback">("overview");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedback();
  }, [page, filter]);

  async function fetchFeedback() {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), limit: "50" });
      if (filter !== "all") params.set("filter", filter);

      const res = await fetch(`/api/docs/feedback?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setEntries(data.entries);
      setStats(data.stats);
      setSummary(data.summary);
      setTotalPages(data.totalPages);
    } catch {
      console.error("Failed to fetch docs feedback");
    } finally {
      setLoading(false);
    }
  }

  if (!session?.user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Unauthorized</p>
      </div>
    );
  }

  const helpfulRate = summary.totalFeedback > 0
    ? Math.round((summary.totalHelpful / summary.totalFeedback) * 100)
    : 0;

  // Get feedback comments for a specific article
  function getArticleComments(categorySlug: string, articleSlug: string) {
    return entries.filter(
      (e) => e.categorySlug === categorySlug && e.articleSlug === articleSlug && e.reason
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Docs Feedback
        </h1>
        <p className="text-muted-foreground mt-1">
          See which documentation articles are helpful and which need improvement.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border bg-card p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-muted-foreground">Total Feedback</div>
          <div className="text-xl sm:text-2xl font-bold mt-1">{summary.totalFeedback}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" /> Helpful
          </div>
          <div className="text-xl sm:text-2xl font-bold mt-1 text-emerald-600">{summary.totalHelpful}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
            <ThumbsDown className="w-3.5 h-3.5 text-red-500" /> Not Helpful
          </div>
          <div className="text-xl sm:text-2xl font-bold mt-1 text-red-600">{summary.totalNotHelpful}</div>
        </div>
        <div className="rounded-xl border bg-card p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Helpful Rate
          </div>
          <div className={`text-xl sm:text-2xl font-bold mt-1 ${helpfulRate >= 70 ? "text-emerald-600" : helpfulRate >= 40 ? "text-amber-600" : "text-red-600"}`}>
            {helpfulRate}%
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setTab("overview")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "overview"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Article Rankings
        </button>
        <button
          onClick={() => setTab("feedback")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "feedback"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All Feedback
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : tab === "overview" ? (
        <>
          {stats.length === 0 ? (
            <div className="rounded-xl border p-8 text-center text-muted-foreground">
              No feedback yet. Feedback will appear here as users interact with docs.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Article</th>
                      <th className="text-left p-3 font-medium">Category</th>
                      <th className="text-center p-3 font-medium">
                        <ThumbsUp className="w-3.5 h-3.5 inline" />
                      </th>
                      <th className="text-center p-3 font-medium">
                        <ThumbsDown className="w-3.5 h-3.5 inline" />
                      </th>
                      <th className="text-center p-3 font-medium">Total</th>
                      <th className="text-center p-3 font-medium">Score</th>
                      <th className="text-center p-3 font-medium">
                        <MessageSquare className="w-3.5 h-3.5 inline" />
                      </th>
                      <th className="text-center p-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((stat) => {
                      const key = `${stat.categorySlug}-${stat.articleSlug}`;
                      const score = stat.totalVotes > 0 ? Math.round((stat.helpfulVotes / stat.totalVotes) * 100) : 0;
                      const isExpanded = expandedRow === key;
                      const comments = getArticleComments(stat.categorySlug, stat.articleSlug);

                      return (
                        <DesktopRow
                          key={key}
                          stat={stat}
                          score={score}
                          isExpanded={isExpanded}
                          comments={comments}
                          onToggle={() => setExpandedRow(isExpanded ? null : key)}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {stats.map((stat) => {
                  const key = `${stat.categorySlug}-${stat.articleSlug}`;
                  const score = stat.totalVotes > 0 ? Math.round((stat.helpfulVotes / stat.totalVotes) * 100) : 0;
                  const isExpanded = expandedRow === key;
                  const comments = getArticleComments(stat.categorySlug, stat.articleSlug);

                  return (
                    <MobileCard
                      key={key}
                      stat={stat}
                      score={score}
                      isExpanded={isExpanded}
                      comments={comments}
                      onToggle={() => setExpandedRow(isExpanded ? null : key)}
                    />
                  );
                })}
              </div>
            </>
          )}
        </>
      ) : (
        /* All Feedback List */
        <>
          {/* Filter */}
          <div className="flex gap-2">
            {(["all", "helpful", "not-helpful"] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "All" : f === "helpful" ? "Helpful" : "Not Helpful"}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {entries.length === 0 ? (
              <div className="rounded-xl border p-8 text-center text-muted-foreground">
                No feedback entries found.
              </div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="rounded-xl border p-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.helpful ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <ThumbsUp className="w-3 h-3" /> Helpful
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          <ThumbsDown className="w-3 h-3" /> Not Helpful
                        </span>
                      )}
                      <a
                        href={`/docs/${entry.categorySlug}/${entry.articleSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:underline flex items-center gap-1"
                      >
                        {slugToTitle(entry.articleSlug)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {entry.reason && (
                    <div className="flex items-start gap-2 pl-1 mt-2 p-3 rounded-lg bg-muted/50">
                      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-sm text-foreground">{entry.reason}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* Desktop expandable row */
function DesktopRow({
  stat,
  score,
  isExpanded,
  comments,
  onToggle,
}: {
  stat: ArticleStat;
  score: number;
  isExpanded: boolean;
  comments: FeedbackEntry[];
  onToggle: () => void;
}) {
  const hasComments = stat.commentCount > 0;

  return (
    <>
      <tr
        className={`border-b last:border-0 transition-colors ${hasComments ? "cursor-pointer hover:bg-muted/30" : ""} ${isExpanded ? "bg-muted/20" : ""}`}
        onClick={hasComments ? onToggle : undefined}
      >
        <td className="p-3 font-medium">
          <div className="flex items-center gap-2">
            {hasComments && (
              <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            )}
            {slugToTitle(stat.articleSlug)}
          </div>
        </td>
        <td className="p-3 text-muted-foreground">{slugToTitle(stat.categorySlug)}</td>
        <td className="p-3 text-center text-emerald-600 font-medium">{stat.helpfulVotes}</td>
        <td className="p-3 text-center text-red-600 font-medium">{stat.notHelpfulVotes}</td>
        <td className="p-3 text-center">{stat.totalVotes}</td>
        <td className="p-3 text-center">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            score >= 70
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : score >= 40
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}>
            {score >= 70 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {score}%
          </span>
        </td>
        <td className="p-3 text-center">
          {stat.commentCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              {stat.commentCount}
            </span>
          )}
        </td>
        <td className="p-3 text-center">
          <a
            href={`/docs/${stat.categorySlug}/${stat.articleSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </td>
      </tr>
      {isExpanded && comments.length > 0 && (
        <tr>
          <td colSpan={8} className="p-0">
            <div className="bg-muted/30 px-6 py-4 space-y-3 border-b">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                User Comments ({comments.length})
              </div>
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3 p-3 rounded-lg bg-background border">
                  <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{comment.reason}</p>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {new Date(comment.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* Mobile card with expandable comments */
function MobileCard({
  stat,
  score,
  isExpanded,
  comments,
  onToggle,
}: {
  stat: ArticleStat;
  score: number;
  isExpanded: boolean;
  comments: FeedbackEntry[];
  onToggle: () => void;
}) {
  const hasComments = stat.commentCount > 0;

  return (
    <div className={`rounded-xl border overflow-hidden ${isExpanded ? "ring-1 ring-primary/20" : ""}`}>
      <div
        className={`p-4 ${hasComments ? "cursor-pointer" : ""}`}
        onClick={hasComments ? onToggle : undefined}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <div className="font-medium text-sm flex items-center gap-1.5">
              {hasComments && (
                <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              )}
              {slugToTitle(stat.articleSlug)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{slugToTitle(stat.categorySlug)}</div>
          </div>
          <a
            href={`/docs/${stat.categorySlug}/${stat.articleSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-medium text-emerald-600">{stat.helpfulVotes}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsDown className="w-3.5 h-3.5 text-red-500" />
            <span className="font-medium text-red-600">{stat.notHelpfulVotes}</span>
          </div>
          <span className="text-muted-foreground">{stat.totalVotes} total</span>
          <span className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            score >= 70
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : score >= 40
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}>
            {score}%
          </span>
          {stat.commentCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              {stat.commentCount}
            </span>
          )}
        </div>
      </div>

      {isExpanded && comments.length > 0 && (
        <div className="border-t bg-muted/30 px-4 py-3 space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Comments ({comments.length})
          </div>
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2 p-3 rounded-lg bg-background border">
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm">{comment.reason}</p>
                <span className="text-xs text-muted-foreground mt-1 block">
                  {new Date(comment.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
