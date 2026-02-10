"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  Globe,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Send,
  Clock,
  Eye,
  Loader2,
  ExternalLink,
  Zap,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface UrlStatus {
  url: string;
  status: number;
  ok: boolean;
  responseTime: number;
}

interface BlogPostData {
  slug: string;
  title: string;
  url: string;
  status: "draft" | "scheduled" | "published";
  publishedAt: string;
  scheduledAt: string | null;
  category: string;
  keywords: string[];
}

interface IndexingConfig {
  indexnow: boolean;
  googleIndexingApi: boolean;
}

interface SeoData {
  pages: UrlStatus[];
  blogPosts: BlogPostData[];
  blogUrlStatuses: UrlStatus[];
  allUrlStatuses: UrlStatus[];
  indexingConfig: IndexingConfig;
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  scheduledPosts: number;
  totalPages: number;
}

export default function AdminSeoPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SeoData | null>(null);
  const [indexingUrls, setIndexingUrls] = useState<Set<string>>(new Set());
  const [indexingAll, setIndexingAll] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const isAdmin = session?.user?.isAdmin;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/seo");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch SEO data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const triggerIndexing = async (urls: string[]) => {
    const newSet = new Set(indexingUrls);
    urls.forEach((u) => newSet.add(u));
    setIndexingUrls(newSet);

    try {
      const res = await fetch("/api/admin/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls, action: "index" }),
      });
      const json = await res.json();
      if (json.success) {
        alert(
          `Indexing requested!\n\nIndexNow: ${json.result.indexnow.success ? `${json.result.indexnow.endpoints}/3 endpoints` : "skipped"}\nGoogle: ${json.result.google.success ? "submitted" : json.result.google.error || "skipped"}`
        );
      }
    } catch (error) {
      console.error("Indexing failed:", error);
    } finally {
      const cleared = new Set(indexingUrls);
      urls.forEach((u) => cleared.delete(u));
      setIndexingUrls(cleared);
    }
  };

  const triggerIndexAll = async () => {
    if (!data) return;
    setIndexingAll(true);
    const allPublishedUrls = [
      ...data.pages.map((p) => p.url),
      ...data.blogPosts
        .filter((p) => p.status === "published")
        .map((p) => p.url),
    ];
    await triggerIndexing(allPublishedUrls);
    setIndexingAll(false);
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Checking all pages and indexing status...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Failed to load SEO data.</p>
        <Button onClick={fetchData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const errorPages = data.allUrlStatuses.filter((u) => !u.ok);
  const slowPages = data.allUrlStatuses.filter(
    (u) => u.ok && u.responseTime > 3000
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Search className="w-6 h-6 text-cyan-600" />
            SEO Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor indexing, page health, and search engine visibility
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={triggerIndexAll}
            disabled={indexingAll}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {indexingAll ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-1" />
            )}
            Index All Pages
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard
          label="Total Pages"
          value={data.totalPages}
          icon={<Globe className="w-4 h-4" />}
        />
        <StatCard
          label="Healthy"
          value={data.allUrlStatuses.filter((u) => u.ok).length}
          icon={<CheckCircle2 className="w-4 h-4 text-green-600" />}
          color="green"
        />
        <StatCard
          label="Errors"
          value={errorPages.length}
          icon={<XCircle className="w-4 h-4 text-red-600" />}
          color={errorPages.length > 0 ? "red" : undefined}
        />
        <StatCard
          label="Published"
          value={data.publishedPosts}
          icon={<Eye className="w-4 h-4 text-cyan-600" />}
        />
        <StatCard
          label="Drafts"
          value={data.draftPosts}
          icon={<FileText className="w-4 h-4 text-amber-600" />}
        />
        <StatCard
          label="Scheduled"
          value={data.scheduledPosts}
          icon={<Clock className="w-4 h-4 text-violet-600" />}
        />
      </div>

      {/* Indexing Configuration */}
      <div className="border rounded-xl p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Settings2 className="w-4 h-4" />
          Indexing Configuration
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ConfigStatus
            label="IndexNow (Bing, Yandex, Naver)"
            configured={data.indexingConfig.indexnow}
          />
          <ConfigStatus
            label="Google Indexing API"
            configured={data.indexingConfig.googleIndexingApi}
          />
        </div>
      </div>

      {/* Error Pages Alert */}
      {errorPages.length > 0 && (
        <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 rounded-xl p-4 space-y-3">
          <h2 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Pages with Errors ({errorPages.length})
          </h2>
          <div className="space-y-2">
            {errorPages.map((page) => (
              <div
                key={page.url}
                className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {page.status || "ERR"}
                  </span>
                  <span className="text-sm truncate">
                    {page.url.replace("https://linkedgrow.ai", "")}
                  </span>
                </div>
                <a
                  href={page.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slow Pages Warning */}
      {slowPages.length > 0 && (
        <div className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 space-y-3">
          <h2 className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Slow Pages ({slowPages.length}) - over 3s response
          </h2>
          <div className="space-y-2">
            {slowPages.map((page) => (
              <div
                key={page.url}
                className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg"
              >
                <span className="text-sm truncate">
                  {page.url.replace("https://linkedgrow.ai", "")}
                </span>
                <span className="text-xs font-mono text-amber-600">
                  {(page.responseTime / 1000).toFixed(1)}s
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Public Pages */}
      <div className="border rounded-xl overflow-hidden">
        <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/50">
          <h2 className="font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Public Pages
          </h2>
        </div>
        <div className="divide-y">
          {data.pages.map((page) => (
            <PageRow
              key={page.url}
              page={page}
              onIndex={() => triggerIndexing([page.url])}
              isIndexing={indexingUrls.has(page.url)}
            />
          ))}
        </div>
      </div>

      {/* Blog Posts */}
      <div className="border rounded-xl overflow-hidden">
        <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/50">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Blog Posts ({data.totalPosts})
          </h2>
        </div>
        <div className="divide-y">
          {data.blogPosts.map((post) => {
            const urlStatus = data.blogUrlStatuses.find(
              (u) => u.url === post.url
            );
            return (
              <BlogPostRow
                key={post.slug}
                post={post}
                urlStatus={urlStatus}
                onIndex={() => triggerIndexing([post.url])}
                isIndexing={indexingUrls.has(post.url)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
}) {
  const colorClasses =
    color === "red"
      ? "border-red-200 dark:border-red-800"
      : color === "green"
        ? "border-green-200 dark:border-green-800"
        : "";

  return (
    <div className={`border rounded-xl p-3 ${colorClasses}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function ConfigStatus({
  label,
  configured,
}: {
  label: string;
  configured: boolean;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
      {configured ? (
        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
      )}
      <span className="text-sm">{label}</span>
      <span
        className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
          configured
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        }`}
      >
        {configured ? "Active" : "Not configured"}
      </span>
    </div>
  );
}

function PageRow({
  page,
  onIndex,
  isIndexing,
}: {
  page: UrlStatus;
  onIndex: () => void;
  isIndexing: boolean;
}) {
  const path = page.url.replace("https://linkedgrow.ai", "") || "/";

  return (
    <div className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-900/30">
      <div className="flex items-center gap-3 min-w-0">
        <StatusBadge status={page.status} ok={page.ok} />
        <span className="text-sm font-medium truncate">{path}</span>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {page.responseTime}ms
        </span>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={page.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <Button
          variant="ghost"
          size="sm"
          onClick={onIndex}
          disabled={isIndexing || !page.ok}
          title="Request indexing"
        >
          {isIndexing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

function BlogPostRow({
  post,
  urlStatus,
  onIndex,
  isIndexing,
}: {
  post: BlogPostData;
  urlStatus?: UrlStatus;
  onIndex: () => void;
  isIndexing: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-900/30">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {urlStatus ? (
          <StatusBadge status={urlStatus.status} ok={urlStatus.ok} />
        ) : (
          <span className="px-2 py-0.5 text-xs font-mono rounded bg-slate-100 text-slate-500 dark:bg-slate-800">
            ---
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{post.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <PublishBadge status={post.status} />
            <span className="text-xs text-muted-foreground">
              {post.category}
            </span>
            {urlStatus?.ok && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {urlStatus.responseTime}ms
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <Button
          variant="ghost"
          size="sm"
          onClick={onIndex}
          disabled={isIndexing || post.status !== "published"}
          title={
            post.status !== "published"
              ? "Only published posts can be indexed"
              : "Request indexing"
          }
        >
          {isIndexing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status, ok }: { status: number; ok: boolean }) {
  if (status === 0) {
    return (
      <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        ERR
      </span>
    );
  }

  const color = ok
    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    : status >= 300 && status < 400
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

  return (
    <span
      className={`px-2 py-0.5 text-xs font-mono font-bold rounded ${color}`}
    >
      {status}
    </span>
  );
}

function PublishBadge({
  status,
}: {
  status: "draft" | "scheduled" | "published";
}) {
  const config = {
    draft: {
      label: "Draft",
      color:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    scheduled: {
      label: "Scheduled",
      color:
        "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    },
    published: {
      label: "Published",
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
  };

  const { label, color } = config[status];
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${color}`}>{label}</span>
  );
}
