"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";

export function ArticleFeedback() {
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);

  if (feedback) {
    return (
      <div className="flex items-center gap-2 py-6 border-t border-slate-200 dark:border-slate-800 mt-12">
        <Check className="w-4 h-4 text-emerald-500" />
        <span className="text-sm text-slate-600 dark:text-slate-400">
          Thanks for your feedback!
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 py-6 border-t border-slate-200 dark:border-slate-800 mt-12">
      <span className="text-sm text-slate-600 dark:text-slate-400">Was this helpful?</span>
      <div className="flex gap-2">
        <button
          onClick={() => setFeedback("yes")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          Yes
        </button>
        <button
          onClick={() => setFeedback("no")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <ThumbsDown className="w-3.5 h-3.5" />
          No
        </button>
      </div>
    </div>
  );
}
