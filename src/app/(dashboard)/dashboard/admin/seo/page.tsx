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
  MousePointerClick,
  TrendingUp,
  BarChart3,
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

interface SearchConsoleData {
  dateRange: { start: string; end: string };
  totals: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  dailyTrend: {
    date: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[];
  pages: {
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[];
  topQueries: {
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[];
}

export default function AdminSeoPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SeoData | null>(null);
  const [indexingUrls, setIndexingUrls] = useState<Set<string>>(new Set());
  const [indexingAll, setIndexingAll] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [scData, setScData] = useState<SearchConsoleData | null>(null);
  const [scLoading, setScLoading] = useState(false);
  const [scError, setScError] = useState<string | null>(null);

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

  const fetchSearchConsole = async () => {
    setScLoading(true);
    setScError(null);
    try {
      const res = await fetch("/api/admin/seo/search-console");
      if (res.ok) {
        const json = await res.json();
        setScData(json);
      } else {
        const json = await res.json();
        setScError(json.error || "Failed to load");
      }
    } catch (error) {
      console.error("Failed to fetch Search Console data:", error);
      setScError("Failed to connect");
    } finally {
      setScLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
      fetchSearchConsole();
    }
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Search className="w-5 sm:w-6 h-5 sm:h-6 text-cyan-600 shrink-0" />
            SEO Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor indexing, page health, and search engine visibility
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            Index All
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        <StatCard
          label="Total URLs"
          value={data.totalPages}
          icon={<Globe className="w-4 h-4" />}
        />
        <StatCard
          label="Live Pages"
          value={data.pages.length}
          icon={<Globe className="w-4 h-4 text-blue-600" />}
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
          label="Published Posts"
          value={data.publishedPosts}
          icon={<Eye className="w-4 h-4 text-cyan-600" />}
        />
        <StatCard
          label="Draft Posts"
          value={data.draftPosts}
          icon={<FileText className="w-4 h-4 text-amber-600" />}
        />
        <StatCard
          label="Scheduled Posts"
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

      {/* Search Console Performance */}
      <div className="border rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="font-semibold flex items-center gap-2 flex-wrap">
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Google Search Performance</span>
            {scData && (
              <span className="text-xs font-normal text-muted-foreground">
                {scData.dateRange.start} to {scData.dateRange.end}
              </span>
            )}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSearchConsole}
            disabled={scLoading}
            className="shrink-0 self-end sm:self-auto"
          >
            {scLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>

        {scLoading && !scData && (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading Search Console data...</span>
          </div>
        )}

        {scError && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg p-3">
            {scError}
          </div>
        )}

        {scData && (
          <>
            {/* Performance Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <MousePointerClick className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  Total Clicks
                </div>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  {scData.totals.clicks.toLocaleString()}
                </p>
              </div>
              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Eye className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                  Impressions
                </div>
                <p className="text-xl sm:text-2xl font-bold text-violet-600">
                  {scData.totals.impressions.toLocaleString()}
                </p>
              </div>
              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Avg CTR
                </div>
                <p className="text-xl sm:text-2xl font-bold text-emerald-600">
                  {(scData.totals.ctr * 100).toFixed(1)}%
                </p>
              </div>
              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <BarChart3 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  Avg Position
                </div>
                <p className="text-xl sm:text-2xl font-bold text-amber-600">
                  {scData.totals.position.toFixed(1)}
                </p>
              </div>
            </div>

            {/* Top Search Queries */}
            {scData.topQueries.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Top Search Queries
                </h3>
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-sm min-w-[400px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs text-muted-foreground">
                        <th className="text-left p-2 pl-3">Query</th>
                        <th className="text-right p-2">Clicks</th>
                        <th className="text-right p-2">Impressions</th>
                        <th className="text-right p-2 hidden sm:table-cell">
                          CTR
                        </th>
                        <th className="text-right p-2 pr-3 hidden sm:table-cell">
                          Position
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {scData.topQueries.slice(0, 15).map((q) => (
                        <tr
                          key={q.query}
                          className="hover:bg-slate-50 dark:hover:bg-slate-900/30"
                        >
                          <td className="p-2 pl-3 font-medium truncate max-w-50 sm:max-w-75">
                            {q.query}
                          </td>
                          <td className="p-2 text-right text-blue-600 font-medium">
                            {q.clicks}
                          </td>
                          <td className="p-2 text-right text-muted-foreground">
                            {q.impressions.toLocaleString()}
                          </td>
                          <td className="p-2 text-right text-muted-foreground hidden sm:table-cell">
                            {(q.ctr * 100).toFixed(1)}%
                          </td>
                          <td className="p-2 pr-3 text-right hidden sm:table-cell">
                            <PositionBadge position={q.position} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Per-Page Performance */}
            {scData.pages.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Pages Search Performance
                </h3>
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-sm min-w-[400px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs text-muted-foreground">
                        <th className="text-left p-2 pl-3">Page</th>
                        <th className="text-right p-2">Clicks</th>
                        <th className="text-right p-2">Impressions</th>
                        <th className="text-right p-2 hidden sm:table-cell">
                          CTR
                        </th>
                        <th className="text-right p-2 pr-3 hidden sm:table-cell">
                          Position
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {scData.pages.map((p) => (
                        <tr
                          key={p.page}
                          className="hover:bg-slate-50 dark:hover:bg-slate-900/30"
                        >
                          <td className="p-2 pl-3 truncate max-w-50 sm:max-w-75">
                            <a
                              href={p.page}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {p.page.replace("https://linkedgrow.ai", "") ||
                                "/"}
                            </a>
                          </td>
                          <td className="p-2 text-right text-blue-600 font-medium">
                            {p.clicks}
                          </td>
                          <td className="p-2 text-right text-muted-foreground">
                            {p.impressions.toLocaleString()}
                          </td>
                          <td className="p-2 text-right text-muted-foreground hidden sm:table-cell">
                            {(p.ctr * 100).toFixed(1)}%
                          </td>
                          <td className="p-2 pr-3 text-right hidden sm:table-cell">
                            <PositionBadge position={p.position} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {scData.topQueries.length === 0 && scData.pages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No search data available yet. Data appears 2-3 days after pages
                are indexed.
              </p>
            )}
          </>
        )}
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
                className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 shrink-0">
                    {page.status || "ERR"}
                  </span>
                  <span className="text-xs sm:text-sm truncate">
                    {page.url.replace("https://linkedgrow.ai", "")}
                  </span>
                </div>
                <a
                  href={page.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground shrink-0"
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
                className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg gap-2"
              >
                <span className="text-xs sm:text-sm truncate min-w-0">
                  {page.url.replace("https://linkedgrow.ai", "")}
                </span>
                <span className="text-xs font-mono text-amber-600 shrink-0">
                  {(page.responseTime / 1000).toFixed(1)}s
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Public Pages */}
      <div className="border rounded-xl overflow-hidden">
        <div className="p-3 sm:p-4 border-b bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 shrink-0" />
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
        <div className="p-3 sm:p-4 border-b bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 shrink-0" />
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
      <p className="text-xl sm:text-2xl font-bold">{value}</p>
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
    <div className="flex items-center justify-between p-2 sm:p-3 hover:bg-slate-50 dark:hover:bg-slate-900/30 gap-2">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <StatusBadge status={page.status} ok={page.ok} />
        <span className="text-xs sm:text-sm font-medium truncate">{path}</span>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {page.responseTime}ms
        </span>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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
    <div className="flex items-center justify-between p-2 sm:p-3 hover:bg-slate-50 dark:hover:bg-slate-900/30 gap-2">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {urlStatus ? (
          <StatusBadge status={urlStatus.status} ok={urlStatus.ok} />
        ) : (
          <span className="px-2 py-0.5 text-xs font-mono rounded bg-slate-100 text-slate-500 dark:bg-slate-800">
            ---
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium truncate">{post.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
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
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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

function PositionBadge({ position }: { position: number }) {
  const rounded = position.toFixed(1);
  const color =
    position <= 10
      ? "text-emerald-600 font-medium"
      : position <= 20
        ? "text-amber-600"
        : "text-muted-foreground";

  return <span className={`text-xs ${color}`}>{rounded}</span>;
}
