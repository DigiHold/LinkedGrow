"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PAGE_TYPE_LABELS, PAGE_TYPE_PREFIXES, type PageType } from "@/lib/cms";

const PAGE_TYPES = Object.entries(PAGE_TYPE_LABELS) as [PageType, string][];

export default function NewPageForm() {
  const router = useRouter();
  const [pageType, setPageType] = useState<PageType>("audience");
  const [slugSegment, setSlugSegment] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fullSlug = `${PAGE_TYPE_PREFIXES[pageType]}/${slugSegment}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slugSegment.trim()) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/cms/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageType, slugSegment: slugSegment.trim(), seoTitle }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create page");
        setSaving(false);
        return;
      }

      const data = await res.json();
      router.push(`/admin/pages/${encodeURIComponent(data.slug)}`);
    } catch {
      setError("Failed to create page");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">New Page</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Page Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Page Type
          </label>
          <select
            value={pageType}
            onChange={(e) => setPageType(e.target.value as PageType)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {PAGE_TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            URL Slug
          </label>
          <div className="flex items-center gap-0 rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden focus-within:ring-2 focus-within:ring-cyan-500">
            <span className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-sm text-slate-500 dark:text-slate-400 shrink-0">
              linkedgrow.ai/{PAGE_TYPE_PREFIXES[pageType]}/
            </span>
            <input
              type="text"
              value={slugSegment}
              onChange={(e) =>
                setSlugSegment(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")
                )
              }
              placeholder="my-page-slug"
              className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none"
              required
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">Full URL: linkedgrow.ai/{fullSlug}</p>
        </div>

        {/* SEO Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            SEO Title (optional - can be set later)
          </label>
          <input
            type="text"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            placeholder="Page Title | LinkedGrow"
            maxLength={70}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <p className="text-xs text-slate-400 mt-1">{seoTitle.length}/60 characters</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || !slugSegment.trim()}
            className="px-6 py-2 rounded-lg bg-cyan-600 text-white font-medium text-sm hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Creating..." : "Create Page"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
