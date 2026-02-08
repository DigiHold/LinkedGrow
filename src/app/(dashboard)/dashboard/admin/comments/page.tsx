"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { MessageSquare, Check, Trash2, X, ExternalLink, Mail, User } from "lucide-react";

interface AdminComment {
  id: string;
  blogSlug: string;
  authorName: string;
  authorEmail: string;
  content: string;
  isApproved: boolean;
  createdAt: string;
}

function CommentsContent() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  useEffect(() => {
    fetchComments();
  }, []);

  // Auto-scroll to highlighted comment
  useEffect(() => {
    if (highlightId && !loading) {
      setTimeout(() => {
        const el = document.getElementById(`comment-${highlightId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }, [highlightId, loading]);

  async function fetchComments() {
    try {
      const res = await fetch("/api/blog/comments/admin");
      const data = await res.json();
      if (data.comments) setComments(data.comments);
    } catch {
      console.error("Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: "approve" | "reject") {
    setActionLoading(id);
    try {
      const res = await fetch("/api/blog/comments/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, isApproved: action === "approve" } : c
          )
        );
      }
    } catch {
      console.error("Failed to update comment");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to permanently delete this comment?")) return;
    setActionLoading(id);
    try {
      const res = await fetch("/api/blog/comments/admin", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      console.error("Failed to delete comment");
    } finally {
      setActionLoading(null);
    }
  }

  const filteredComments = comments.filter((c) => {
    if (filter === "pending") return !c.isApproved;
    if (filter === "approved") return c.isApproved;
    return true;
  });

  const pendingCount = comments.filter((c) => !c.isApproved).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-slate-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Blog Comments
          </h1>
          {pendingCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
              {pendingCount} pending
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(["all", "pending", "approved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "pending" && pendingCount > 0 && ` (${pendingCount})`}
            {f === "all" && ` (${comments.length})`}
          </button>
        ))}
      </div>

      {/* Comments list */}
      {filteredComments.length === 0 ? (
        <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-12">
          No comments found.
        </p>
      ) : (
        <div className="space-y-4">
          {filteredComments.map((comment) => {
            const isPending = !comment.isApproved;
            const isHighlighted = comment.id === highlightId;

            return (
              <div
                key={comment.id}
                id={`comment-${comment.id}`}
                className={`rounded-xl border p-5 transition-colors ${
                  isHighlighted && isPending
                    ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700"
                    : isPending
                    ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800/50"
                    : "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {comment.authorName}
                        </span>
                        {isPending && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                            Pending
                          </span>
                        )}
                        {!isPending && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                            Approved
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Mail className="w-3 h-3" />
                        <span>{comment.authorEmail}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <time dateTime={comment.createdAt}>
                          {new Date(comment.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`/blog/${comment.blogSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 hover:underline shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {comment.blogSlug}
                  </a>
                </div>

                {/* Content */}
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line mb-4 pl-12">
                  {comment.content}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 pl-12">
                  {isPending && (
                    <button
                      onClick={() => handleAction(comment.id, "approve")}
                      disabled={actionLoading === comment.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  )}
                  {!isPending && (
                    <button
                      onClick={() => handleAction(comment.id, "reject")}
                      disabled={actionLoading === comment.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Unapprove
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(comment.id)}
                    disabled={actionLoading === comment.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminCommentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
        </div>
      }
    >
      <CommentsContent />
    </Suspense>
  );
}
