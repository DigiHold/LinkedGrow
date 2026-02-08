"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { CMSPageData, ContentBlock, FAQItem } from "@/lib/cms";

// Supported languages for content editing
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "es", label: "Spanish" },
  { code: "it", label: "Italian" },
] as const;

type LangCode = (typeof LANGUAGES)[number]["code"];

interface PageEditorProps {
  page: CMSPageData;
}

export function PageEditor({ page }: PageEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "seo">("content");
  const [activeLang, setActiveLang] = useState<LangCode>("en");

  // SEO state
  const [seoTitle, setSeoTitle] = useState(page.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(page.seoDescription || "");
  const [seoKeywords, setSeoKeywords] = useState(page.seoKeywords || "");
  const [ogTitle, setOgTitle] = useState(page.ogTitle || "");
  const [ogDescription, setOgDescription] = useState(page.ogDescription || "");
  const [ogImage, setOgImage] = useState(page.ogImage || "");
  const [canonicalUrl, setCanonicalUrl] = useState(page.canonicalUrl || "");
  const [slug, setSlug] = useState(page.slug);
  const [status, setStatus] = useState(page.status);

  // Content state - per language
  // English is the primary content, other languages stored in translations JSON
  const tr = page.translations || {};
  const [contentByLang, setContentByLang] = useState<Record<LangCode, ContentBlock[]>>({
    en: page.content,
    fr: tr.fr?.content || [],
    de: tr.de?.content || [],
    es: tr.es?.content || [],
    it: tr.it?.content || [],
  });

  const [faqByLang, setFaqByLang] = useState<Record<LangCode, FAQItem[]>>({
    en: page.faq || [],
    fr: tr.fr?.faq || [],
    de: tr.de?.faq || [],
    es: tr.es?.faq || [],
    it: tr.it?.faq || [],
  });

  const blocks = contentByLang[activeLang];
  const faq = faqByLang[activeLang];

  const setBlocks = useCallback(
    (updater: ContentBlock[] | ((prev: ContentBlock[]) => ContentBlock[])) => {
      setContentByLang((prev) => ({
        ...prev,
        [activeLang]: typeof updater === "function" ? updater(prev[activeLang]) : updater,
      }));
    },
    [activeLang]
  );

  const setFaq = useCallback(
    (updater: FAQItem[] | ((prev: FAQItem[]) => FAQItem[])) => {
      setFaqByLang((prev) => ({
        ...prev,
        [activeLang]: typeof updater === "function" ? updater(prev[activeLang]) : updater,
      }));
    },
    [activeLang]
  );

  // Block operations
  function addBlock(type: ContentBlock["type"], afterIndex: number) {
    const newBlock = createEmptyBlock(type);
    setBlocks((prev) => {
      const copy = [...prev];
      copy.splice(afterIndex + 1, 0, newBlock);
      return copy;
    });
  }

  function updateBlock(index: number, data: Record<string, unknown>) {
    setBlocks((prev) =>
      prev.map((b, i) => (i === index ? ({ ...b, ...data } as ContentBlock) : b))
    );
  }

  function removeBlock(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, direction: "up" | "down") {
    setBlocks((prev) => {
      const copy = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= copy.length) return copy;
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  // FAQ operations
  function addFaqItem() {
    setFaq((prev) => [...prev, { question: "", answer: "" }]);
  }

  function updateFaqItem(index: number, data: Partial<FAQItem>) {
    setFaq((prev) => prev.map((item, i) => (i === index ? { ...item, ...data } : item)));
  }

  function removeFaqItem(index: number) {
    setFaq((prev) => prev.filter((_, i) => i !== index));
  }

  // Save
  async function handleSave() {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/admin/cms/pages/${encodeURIComponent(page.slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seoTitle,
          seoDescription,
          seoKeywords,
          ogTitle,
          ogDescription,
          ogImage,
          canonicalUrl,
          slug,
          status,
          content: contentByLang.en, // Primary content is always English
          faq: faqByLang.en, // Primary FAQ is always English
          // Store translations as a separate JSON field
          translations: {
            fr: { content: contentByLang.fr, faq: faqByLang.fr },
            de: { content: contentByLang.de, faq: faqByLang.de },
            es: { content: contentByLang.es, faq: faqByLang.es },
            it: { content: contentByLang.it, faq: faqByLang.it },
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to save");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        // If slug changed, redirect to new URL
        if (slug !== page.slug) {
          router.push(`/admin/pages/${encodeURIComponent(slug)}`);
        } else {
          router.refresh();
        }
      }
    } catch {
      alert("Failed to save");
    }

    setSaving(false);
  }

  // Delete
  async function handleDelete() {
    if (!confirm("Delete this page? This cannot be undone.")) return;

    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/cms/pages/${encodeURIComponent(page.slug)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/pages");
      } else {
        alert("Failed to delete");
      }
    } catch {
      alert("Failed to delete");
    }

    setDeleting(false);
  }

  // Image upload
  async function handleImageUpload(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/cms/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) return null;

      const data = await res.json();
      return data.url;
    } catch {
      return null;
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate max-w-lg">
            {seoTitle || slug}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">/{slug}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Status toggle */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>

          {/* Preview */}
          {status === "published" && (
            <a
              href={`/${slug}`}
              target="_blank"
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              View
            </a>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-1.5 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : saved ? "Saved" : "Save"}
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab("content")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "content"
              ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Content
        </button>
        <button
          onClick={() => setActiveTab("seo")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "seo"
              ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          SEO & Meta
        </button>
      </div>

      {/* Language Switcher (on content tab) */}
      {activeTab === "content" && (
        <div className="flex gap-1 mb-6">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setActiveLang(lang.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeLang === lang.code
                  ? "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {lang.label}
              {lang.code !== "en" && contentByLang[lang.code].length > 0 && (
                <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content Tab */}
      {activeTab === "content" && (
        <div className="space-y-3">
          {activeLang !== "en" && blocks.length === 0 && (
            <div className="text-center py-8 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                No {LANGUAGES.find((l) => l.code === activeLang)?.label} translation yet.
              </p>
              <button
                onClick={() => {
                  // Copy English content as starting point
                  setContentByLang((prev) => ({ ...prev, [activeLang]: [...prev.en] }));
                  setFaqByLang((prev) => ({ ...prev, [activeLang]: [...prev.en] }));
                }}
                className="mt-2 text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Copy from English to start translating
              </button>
            </div>
          )}

          {/* Block list */}
          {blocks.map((block, index) => (
            <div key={index} className="group">
              <BlockEditor
                block={block}
                index={index}
                total={blocks.length}
                onUpdate={(data) => updateBlock(index, data)}
                onRemove={() => removeBlock(index)}
                onMove={(dir) => moveBlock(index, dir)}
                onImageUpload={handleImageUpload}
              />
              {/* Add block button between blocks */}
              <AddBlockButton onAdd={(type) => addBlock(type, index)} />
            </div>
          ))}

          {/* Add first block if empty */}
          {blocks.length === 0 && (
            <AddBlockButton onAdd={(type) => addBlock(type, -1)} isFirst />
          )}

          {/* FAQ Section */}
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                FAQ Section
              </h2>
              <button
                onClick={addFaqItem}
                className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                + Add Question
              </button>
            </div>

            {faq.length === 0 && (
              <p className="text-sm text-slate-400 py-4">
                No FAQ items yet. FAQ is recommended for SEO and AI search.
              </p>
            )}

            <div className="space-y-3">
              {faq.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => updateFaqItem(index, { question: e.target.value })}
                      placeholder="Question..."
                      className="flex-1 text-sm font-medium bg-transparent border-none p-0 text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-300"
                    />
                    <button
                      onClick={() => removeFaqItem(index)}
                      className="text-slate-400 hover:text-red-500 shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <textarea
                    value={item.answer}
                    onChange={(e) => updateFaqItem(index, { answer: e.target.value })}
                    placeholder="Answer..."
                    rows={2}
                    className="w-full text-sm bg-transparent border-none p-0 text-slate-600 dark:text-slate-300 focus:outline-none resize-none placeholder:text-slate-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SEO Tab */}
      {activeTab === "seo" && (
        <div className="max-w-2xl space-y-6">
          {/* Permalink */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Permalink
            </label>
            <div className="flex items-center gap-0 rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
              <span className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-sm text-slate-500 shrink-0">
                linkedgrow.ai/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* SEO Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              SEO Title
            </label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Page Title | LinkedGrow"
              maxLength={70}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <p className={`text-xs mt-1 ${seoTitle.length > 60 ? "text-amber-500" : "text-slate-400"}`}>
              {seoTitle.length}/60 characters
            </p>
          </div>

          {/* SEO Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Meta Description
            </label>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Compelling description with primary keyword..."
              maxLength={170}
              rows={3}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
            <p className={`text-xs mt-1 ${seoDescription.length > 160 ? "text-amber-500" : "text-slate-400"}`}>
              {seoDescription.length}/160 characters
            </p>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Keywords
            </label>
            <input
              type="text"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              placeholder="keyword1, keyword2, keyword3"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* OG Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              OG Title (Social Media)
            </label>
            <input
              type="text"
              value={ogTitle}
              onChange={(e) => setOgTitle(e.target.value)}
              placeholder="Leave empty to use SEO title"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* OG Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              OG Description (Social Media)
            </label>
            <textarea
              value={ogDescription}
              onChange={(e) => setOgDescription(e.target.value)}
              placeholder="Leave empty to use meta description"
              rows={2}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
          </div>

          {/* OG Image */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Social Media Image
            </label>
            {ogImage && (
              <div className="mb-2 relative inline-block">
                <img src={ogImage} alt="OG Preview" className="h-32 rounded-lg object-cover" />
                <button
                  onClick={() => setOgImage("")}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
                >
                  x
                </button>
              </div>
            )}
            <input
              type="text"
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              placeholder="https://... or upload below"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <label className="mt-2 inline-flex items-center gap-2 text-sm text-cyan-600 dark:text-cyan-400 cursor-pointer hover:underline">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upload image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await handleImageUpload(file);
                  if (url) setOgImage(url);
                }}
              />
            </label>
          </div>

          {/* Canonical URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Canonical URL
            </label>
            <input
              type="text"
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              placeholder="https://linkedgrow.ai/..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* SEO Preview */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide">
              Google Preview
            </p>
            <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 space-y-1">
              <p className="text-sm text-cyan-700 dark:text-cyan-400 truncate">
                {canonicalUrl || `https://linkedgrow.ai/${slug}`}
              </p>
              <p className="text-base text-blue-700 dark:text-blue-400 font-medium truncate">
                {seoTitle || "Page Title | LinkedGrow"}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                {seoDescription || "Page description will appear here..."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// BLOCK EDITOR COMPONENT
// ============================================

interface BlockEditorProps {
  block: ContentBlock;
  index: number;
  total: number;
  onUpdate: (data: Record<string, unknown>) => void;
  onRemove: () => void;
  onMove: (direction: "up" | "down") => void;
  onImageUpload: (file: File) => Promise<string | null>;
}

function BlockEditor({ block, index, total, onUpdate, onRemove, onMove, onImageUpload }: BlockEditorProps) {
  const typeLabels: Record<string, string> = {
    heading: "Heading",
    text: "Text",
    image: "Image",
    faq: "FAQ",
    cta: "CTA Button",
    separator: "Separator",
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Block header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {typeLabels[block.type] || block.type}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMove("up")}
            disabled={index === 0}
            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
            title="Move up"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={() => onMove("down")}
            disabled={index === total - 1}
            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
            title="Move down"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={onRemove}
            className="p-1 text-slate-400 hover:text-red-500"
            title="Remove block"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Block content */}
      <div className="p-4">
        {block.type === "heading" && (
          <HeadingBlockEditor block={block} onUpdate={onUpdate} />
        )}
        {block.type === "text" && (
          <TextBlockEditor block={block} onUpdate={onUpdate} />
        )}
        {block.type === "image" && (
          <ImageBlockEditor block={block} onUpdate={onUpdate} onImageUpload={onImageUpload} />
        )}
        {block.type === "cta" && (
          <CTABlockEditor block={block} onUpdate={onUpdate} />
        )}
        {block.type === "separator" && (
          <p className="text-center text-sm text-slate-400">Visual separator</p>
        )}
      </div>
    </div>
  );
}

// ============================================
// INDIVIDUAL BLOCK EDITORS
// ============================================

function HeadingBlockEditor({
  block,
  onUpdate,
}: {
  block: Extract<ContentBlock, { type: "heading" }>;
  onUpdate: (data: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={() => onUpdate({ level: 2 } as Partial<ContentBlock>)}
          className={`px-2 py-1 text-xs rounded ${
            block.level === 2
              ? "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
          }`}
        >
          H2
        </button>
        <button
          onClick={() => onUpdate({ level: 3 } as Partial<ContentBlock>)}
          className={`px-2 py-1 text-xs rounded ${
            block.level === 3
              ? "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
          }`}
        >
          H3
        </button>
      </div>
      <input
        type="text"
        value={block.text}
        onChange={(e) => onUpdate({ text: e.target.value } as Partial<ContentBlock>)}
        placeholder="Heading text..."
        className={`w-full bg-transparent border-none p-0 focus:outline-none text-slate-900 dark:text-white ${
          block.level === 2 ? "text-xl font-bold" : "text-lg font-semibold"
        }`}
      />
    </div>
  );
}

function TextBlockEditor({
  block,
  onUpdate,
}: {
  block: Extract<ContentBlock, { type: "text" }>;
  onUpdate: (data: Record<string, unknown>) => void;
}) {
  return (
    <div>
      <div className="flex gap-1 mb-2">
        <button
          onClick={() => {
            const selection = window.getSelection()?.toString();
            if (selection) {
              const updated = block.html.replace(selection, `<strong>${selection}</strong>`);
              onUpdate({ html: updated } as Partial<ContentBlock>);
            }
          }}
          className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 font-bold"
          title="Bold selected text"
        >
          B
        </button>
        <button
          onClick={() => {
            const selection = window.getSelection()?.toString();
            if (selection) {
              const updated = block.html.replace(selection, `<em>${selection}</em>`);
              onUpdate({ html: updated } as Partial<ContentBlock>);
            }
          }}
          className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 italic"
          title="Italic selected text"
        >
          I
        </button>
        <button
          onClick={() => {
            const selection = window.getSelection()?.toString();
            if (selection) {
              const url = prompt("Enter URL:");
              if (url) {
                const updated = block.html.replace(selection, `<a href="${url}">${selection}</a>`);
                onUpdate({ html: updated } as Partial<ContentBlock>);
              }
            }
          }}
          className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700"
          title="Add link to selected text"
        >
          Link
        </button>
      </div>
      <textarea
        value={block.html}
        onChange={(e) => onUpdate({ html: e.target.value } as Partial<ContentBlock>)}
        placeholder="<p>Write your content here...</p>"
        rows={6}
        className="w-full bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-y font-mono"
      />
      <p className="text-xs text-slate-400 mt-1">
        Supports HTML: &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, &lt;ul&gt;, &lt;li&gt;
      </p>
    </div>
  );
}

function ImageBlockEditor({
  block,
  onUpdate,
  onImageUpload,
}: {
  block: Extract<ContentBlock, { type: "image" }>;
  onUpdate: (data: Record<string, unknown>) => void;
  onImageUpload: (file: File) => Promise<string | null>;
}) {
  const [uploading, setUploading] = useState(false);

  return (
    <div className="space-y-3">
      {block.src && (
        <img src={block.src} alt={block.alt} className="max-h-48 rounded-lg object-cover" />
      )}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={block.src}
          onChange={(e) => onUpdate({ src: e.target.value } as Partial<ContentBlock>)}
          placeholder="Image URL..."
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <label className="shrink-0 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700">
          {uploading ? "Uploading..." : "Upload"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              const url = await onImageUpload(file);
              if (url) onUpdate({ src: url } as Partial<ContentBlock>);
              setUploading(false);
            }}
          />
        </label>
      </div>
      <input
        type="text"
        value={block.alt}
        onChange={(e) => onUpdate({ alt: e.target.value } as Partial<ContentBlock>)}
        placeholder="Alt text (required for SEO)..."
        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />
      <input
        type="text"
        value={block.caption || ""}
        onChange={(e) => onUpdate({ caption: e.target.value } as Partial<ContentBlock>)}
        placeholder="Caption (optional)..."
        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />
    </div>
  );
}

function CTABlockEditor({
  block,
  onUpdate,
}: {
  block: Extract<ContentBlock, { type: "cta" }>;
  onUpdate: (data: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <input
        type="text"
        value={block.text}
        onChange={(e) => onUpdate({ text: e.target.value } as Partial<ContentBlock>)}
        placeholder="Button text..."
        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />
      <input
        type="text"
        value={block.href}
        onChange={(e) => onUpdate({ href: e.target.value } as Partial<ContentBlock>)}
        placeholder="Link URL (e.g. /pricing or /sign-up)..."
        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onUpdate({ variant: "primary" } as Partial<ContentBlock>)}
          className={`px-3 py-1.5 text-xs rounded-lg ${
            block.variant === "primary"
              ? "bg-cyan-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
          }`}
        >
          Primary
        </button>
        <button
          onClick={() => onUpdate({ variant: "secondary" } as Partial<ContentBlock>)}
          className={`px-3 py-1.5 text-xs rounded-lg ${
            block.variant === "secondary"
              ? "bg-slate-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
          }`}
        >
          Secondary
        </button>
      </div>
    </div>
  );
}

// ============================================
// ADD BLOCK BUTTON
// ============================================

function AddBlockButton({
  onAdd,
  isFirst = false,
}: {
  onAdd: (type: ContentBlock["type"]) => void;
  isFirst?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const blockTypes: { type: ContentBlock["type"]; label: string; icon: string }[] = [
    { type: "heading", label: "Heading", icon: "H" },
    { type: "text", label: "Text", icon: "T" },
    { type: "image", label: "Image", icon: "I" },
    { type: "cta", label: "CTA Button", icon: "B" },
    { type: "separator", label: "Separator", icon: "-" },
  ];

  return (
    <div className={`flex justify-center ${isFirst ? "py-8" : "py-1"}`}>
      {open ? (
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg p-1">
          {blockTypes.map((bt) => (
            <button
              key={bt.type}
              onClick={() => {
                onAdd(bt.type);
                setOpen(false);
              }}
              className="px-3 py-1.5 text-xs rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium"
            >
              {bt.label}
            </button>
          ))}
          <button
            onClick={() => setOpen(false)}
            className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600"
          >
            x
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:border-cyan-500 hover:text-cyan-500 flex items-center justify-center transition-colors"
          title="Add block"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

function createEmptyBlock(type: ContentBlock["type"]): ContentBlock {
  switch (type) {
    case "heading":
      return { type: "heading", level: 2, text: "" };
    case "text":
      return { type: "text", html: "" };
    case "image":
      return { type: "image", src: "", alt: "" };
    case "faq":
      return { type: "faq", items: [{ question: "", answer: "" }] };
    case "cta":
      return { type: "cta", text: "Get Started", href: "/sign-up", variant: "primary" };
    case "separator":
      return { type: "separator" };
    default:
      return { type: "text", html: "" };
  }
}
