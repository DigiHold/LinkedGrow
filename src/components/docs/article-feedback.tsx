"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Check, Send } from "lucide-react";

interface ArticleFeedbackProps {
  articleSlug: string;
  categorySlug: string;
}

function storageKey(categorySlug: string, articleSlug: string) {
  return `docs-fb-${categorySlug}-${articleSlug}`;
}

export function ArticleFeedback({ articleSlug, categorySlug }: ArticleFeedbackProps) {
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);
  const [reasonSubmitted, setReasonSubmitted] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);

  // Load existing feedback ID from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey(categorySlug, articleSlug));
      if (stored) setFeedbackId(stored);
    } catch {
      // localStorage unavailable
    }
  }, [categorySlug, articleSlug]);

  function saveFeedbackId(id: string) {
    setFeedbackId(id);
    try {
      localStorage.setItem(storageKey(categorySlug, articleSlug), id);
    } catch {
      // localStorage unavailable
    }
  }

  async function submitVote(helpful: boolean) {
    try {
      setSubmitting(true);

      if (feedbackId) {
        // Update existing entry
        await fetch("/api/docs/feedback", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: feedbackId, helpful }),
        });
      } else {
        // Create new entry
        const res = await fetch("/api/docs/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleSlug, categorySlug, helpful }),
        });
        const data = await res.json();
        if (data.id) saveFeedbackId(data.id);
      }
    } catch {
      // Silently fail
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReason() {
    if (!feedbackId || !reason.trim()) return;
    try {
      setSubmitting(true);
      await fetch("/api/docs/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: feedbackId, reason: reason.trim() }),
      });
    } catch {
      // Silently fail
    } finally {
      setSubmitting(false);
      setReasonSubmitted(true);
    }
  }

  async function handleYes() {
    setFeedback("yes");
    await submitVote(true);
  }

  async function handleNo() {
    setFeedback("no");
    await submitVote(false);
  }

  // After thumbs up
  if (feedback === "yes") {
    return (
      <div className="flex items-center gap-2 py-6 border-t border-slate-200 dark:border-slate-800 mt-12">
        <Check className="w-4 h-4 text-emerald-500" />
        <span className="text-sm text-slate-600 dark:text-slate-400">
          Thanks for your feedback!
        </span>
      </div>
    );
  }

  // After thumbs down - show optional reason field
  if (feedback === "no") {
    if (reasonSubmitted) {
      return (
        <div className="flex items-center gap-2 py-6 border-t border-slate-200 dark:border-slate-800 mt-12">
          <Check className="w-4 h-4 text-emerald-500" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Thanks for your feedback! We will use it to improve this article.
          </span>
        </div>
      );
    }

    return (
      <div className="py-6 border-t border-slate-200 dark:border-slate-800 mt-12 space-y-3">
        <div className="flex items-center gap-2">
          <ThumbsDown className="w-4 h-4 text-red-500" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Feedback recorded. Want to tell us what could be improved? <span className="text-slate-400 dark:text-slate-500">(optional)</span>
          </span>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Missing information, unclear instructions, outdated content..."
          className="w-full max-w-md px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 resize-none"
          rows={3}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={submitReason}
            disabled={submitting || !reason.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            Submit
          </button>
          <button
            onClick={() => setReasonSubmitted(true)}
            className="px-4 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  // Initial state - show thumbs up/down
  return (
    <div className="flex items-center gap-4 py-6 border-t border-slate-200 dark:border-slate-800 mt-12">
      <span className="text-sm text-slate-600 dark:text-slate-400">Was this helpful?</span>
      <div className="flex gap-2">
        <button
          onClick={handleYes}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors disabled:opacity-50"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          Yes
        </button>
        <button
          onClick={handleNo}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
        >
          <ThumbsDown className="w-3.5 h-3.5" />
          No
        </button>
      </div>
    </div>
  );
}
