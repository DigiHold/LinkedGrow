"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense } from "react";
import { MessageSquare, Check, Trash2, X, ExternalLink, Mail, User, Reply, Send } from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface AdminComment {
  id: string;
  blogSlug: string;
  authorName: string;
  authorEmail: string;
  content: string;
  isApproved: boolean;
  parentId: string | null;
  isTeam: boolean | null;
  createdAt: string;
}

function CommentsContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const highlightId = searchParams.get("highlight");
  const adminName = session?.user?.name || "Admin";

  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

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
} finally {
      setActionLoading(null);
    }
  }

  async function handleReply(parentId: string, blogSlug: string) {
    if (!replyContent.trim()) return;
    setActionLoading(parentId);
    try {
      const res = await fetch("/api/blog/comments/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: parentId,
          action: "reply",
          content: replyContent.trim(),
          blogSlug,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.comment) {
          setComments((prev) => {
            // Insert reply right after the parent and its existing replies
            const parentIndex = prev.findIndex((c) => c.id === parentId);
            if (parentIndex === -1) return [data.comment, ...prev];
            // Find last reply belonging to this parent
            let insertAt = parentIndex + 1;
            while (insertAt < prev.length && prev[insertAt].parentId === parentId) {
              insertAt++;
            }
            const updated = [...prev];
            updated.splice(insertAt, 0, data.comment);
            return updated;
          });
        }
        setReplyContent("");
        setReplyingTo(null);
      }
    } catch {
} finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch("/api/blog/comments/admin", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id && c.parentId !== id));
      }
    } catch {
    } finally {
      setActionLoading(null);
      setPendingDeleteId(null);
    }
  }

  function getParentAuthor(parentId: string | null): string | null {
    if (!parentId) return null;
    const parent = comments.find((c) => c.id === parentId);
    return parent?.authorName || null;
  }

  // Build threaded structure: top-level comments with replies grouped underneath
  const threadedComments: AdminComment[] = [];
  const replyMap = new Map<string, AdminComment[]>();

  for (const comment of comments) {
    if (comment.parentId) {
      const existing = replyMap.get(comment.parentId) || [];
      existing.push(comment);
      replyMap.set(comment.parentId, existing);
    }
  }

  for (const comment of comments) {
    if (!comment.parentId) {
      threadedComments.push(comment);
      const replies = replyMap.get(comment.id);
      if (replies) {
        threadedComments.push(...replies);
      }
    }
  }

  const filteredComments = threadedComments.filter((c) => {
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
            const isTeam = !!comment.isTeam;
            const parentAuthor = getParentAuthor(comment.parentId);

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
                } ${comment.parentId ? "ml-8 border-l-2 border-l-cyan-300 dark:border-l-cyan-700" : ""}`}
              >
                {/* Reply context */}
                {parentAuthor && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-2 pl-12">
                    <Reply className="w-3 h-3" />
                    Reply to {parentAuthor}
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 ${
                      isTeam
                        ? "bg-linear-to-br from-cyan-500 to-blue-600 text-white"
                        : "bg-linear-to-br from-slate-400 to-slate-500 dark:from-slate-500 dark:to-slate-600"
                    }`}>
                      {isTeam ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 379 230" className="w-4 h-4 text-white" fill="currentColor">
                          <path d="M205.9185,32.0339c.9512,8.7484,8.8874,15.128,17.6358,14.1767l88.8761-9.6638-93.389,116.1758-93.3595-75.0479c-6.8339-5.4935-16.9741-4.3909-22.4676,2.443L3.9774,203.5681c-5.4935,6.8339-4.3909,16.9741,2.443,22.4676,6.8339,5.4935,16.9741,4.3909,22.4676-2.443l89.2246-110.9953,93.3595,75.0479c6.8339,5.4935,16.9741,4.3909,22.4676-2.443l103.4013-128.631,9.6638,88.8761c.9512,8.7484,8.8874,15.128,17.6358,14.1767s15.128-8.8874,14.1767-17.6358l-13.8363-127.25c-.9512-8.7484-8.8874-15.128-17.6358-14.1767l-127.25,13.8363c-8.7484.9512-15.128,8.8874-14.1767,17.6358Z" />
                        </svg>
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {comment.authorName}
                        </span>
                        {isTeam && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400">
                            Team
                          </span>
                        )}
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
                  {!comment.parentId && (
                    <button
                      onClick={() => {
                        setReplyingTo(replyingTo === comment.id ? null : comment.id);
                        setReplyContent("");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      Reply
                    </button>
                  )}
                  <button
                    onClick={() => setPendingDeleteId(comment.id)}
                    disabled={actionLoading === comment.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>

                {/* Admin reply form */}
                {replyingTo === comment.id && (
                  <div className="mt-4 pl-12">
                    <div className="rounded-lg border border-cyan-200 dark:border-cyan-800 p-3 bg-cyan-50/50 dark:bg-cyan-950/20">
                      <div className="flex items-center gap-2 mb-2 text-xs font-medium text-cyan-700 dark:text-cyan-400">
                        <Reply className="w-3.5 h-3.5" />
                        Replying as {adminName} (LinkedGrow Team)
                      </div>
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={3}
                        placeholder="Write your reply..."
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm resize-none mb-2"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent("");
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReply(comment.id, comment.blogSlug)}
                          disabled={!replyContent.trim() || actionLoading === comment.id}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-linear-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send Reply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={!!pendingDeleteId}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={() => { if (pendingDeleteId) handleDelete(pendingDeleteId); }}
        title="Delete this comment?"
        description="This permanently removes the comment and any replies. This cannot be undone."
        confirmText="Delete"
        variant="destructive"
        loading={actionLoading === pendingDeleteId}
      />
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
