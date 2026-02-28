"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Check, Send } from "lucide-react";

interface ArticleFeedbackProps {
  articleSlug: string;
  categorySlug: string;
}

export function ArticleFeedback({ articleSlug, categorySlug }: ArticleFeedbackProps) {
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitFeedback(helpful: boolean, feedbackReason?: string) {
    try {
      setSubmitting(true);
      await fetch("/api/docs/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleSlug,
          categorySlug,
          helpful,
          reason: feedbackReason || null,
        }),
      });
    } catch {
      // Silently fail - don't block the user
    } finally {
      setSubmitting(false);
    }
  }

  async function handleYes() {
    setFeedback("yes");
    setSubmitted(true);
    await submitFeedback(true);
  }

  async function handleNo() {
    setFeedback("no");
  }

  async function handleSubmitReason() {
    setSubmitted(true);
    await submitFeedback(false, reason);
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 py-6 border-t border-slate-200 dark:border-slate-800 mt-12">
        <Check className="w-4 h-4 text-emerald-500" />
        <span className="text-sm text-slate-600 dark:text-slate-400">
          Thanks for your feedback!
        </span>
      </div>
    );
  }

  if (feedback === "no") {
    return (
      <div className="py-6 border-t border-slate-200 dark:border-slate-800 mt-12 space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Sorry to hear that. What could be improved?
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Missing information, unclear instructions, outdated content..."
          className="w-full max-w-md px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 resize-none"
          rows={3}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleSubmitReason}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            Submit
          </button>
          <button
            onClick={() => { setSubmitted(true); submitFeedback(false); }}
            className="px-4 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <ThumbsDown className="w-3.5 h-3.5" />
          No
        </button>
      </div>
    </div>
  );
}
