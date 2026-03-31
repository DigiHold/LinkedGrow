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
  Target,
  Link2,
  ChevronDown,
  ChevronUp,
  Unlink,
  SearchX,
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

interface KeywordOverlap {
  keyword: string;
  pages: {
    path: string;
    title: string;
    type: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[];
  severity: "high" | "medium" | "low";
  totalImpressions: number;
  totalClicks: number;
}

interface CanonicalIssue {
  path: string;
  title: string;
  canonical: string | null;
  expected: string;
  issue: "missing" | "mismatch" | "ok";
  type: string;
}

interface BrokenLink {
  source: string;
  href: string;
  type: "page" | "blog";
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
  keywordOverlaps: KeywordOverlap[];
  canonicalStatuses: CanonicalIssue[];
  brokenLinks: BrokenLink[];
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
  const [showAllOverlaps, setShowAllOverlaps] = useState(false);
  const [showAllCanonicals, setShowAllCanonicals] = useState(false);
  const [expandedKeywords, setExpandedKeywords] = useState<Set<string>>(new Set());
  const [showPublicPages, setShowPublicPages] = useState(false);
  const [showBlogPosts, setShowBlogPosts] = useState(false);
  const [showUnindexed, setShowUnindexed] = useState(false);
  const [showBrokenLinks, setShowBrokenLinks] = useState(false);
  const [showIndexingConfig, setShowIndexingConfig] = useState(false);
  const [showGscPerformance, setShowGscPerformance] = useState(false);
  const [showCannibalization, setShowCannibalization] = useState(false);
  const [showCanonicals, setShowCanonicals] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [showSlowPages, setShowSlowPages] = useState(false);

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
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
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
          label="Keyword Overlaps"
          value={data.keywordOverlaps?.length || 0}
          icon={<Target className="w-4 h-4 text-amber-600" />}
          color={data.keywordOverlaps?.some((o) => o.severity === "high") ? "amber" : undefined}
        />
        <StatCard
          label="Canonical Issues"
          value={data.canonicalStatuses?.filter((c) => c.issue !== "ok").length || 0}
          icon={<Link2 className="w-4 h-4 text-red-600" />}
          color={data.canonicalStatuses?.some((c) => c.issue !== "ok") ? "red" : undefined}
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
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowIndexingConfig(!showIndexingConfig)}
          className="w-full p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-900/70 transition-colors"
        >
          <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <Settings2 className="w-4 h-4 shrink-0" />
            Indexing Configuration
          </h2>
          {showIndexingConfig ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
        </button>
        {showIndexingConfig && (
          <div className="p-4 border-t border-border">
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
        )}
      </div>

      {/* Search Console Performance */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowGscPerformance(!showGscPerformance)}
          className="w-full p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-900/70 transition-colors"
        >
          <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2 flex-wrap">
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Google Search Performance</span>
            {scData && (
              <span className="text-xs font-normal text-muted-foreground">
                {scData.dateRange.start} to {scData.dateRange.end}
              </span>
            )}
            {scLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          </h2>
          {showGscPerformance ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
        </button>
        {showGscPerformance && (
          <div className="p-4 border-t border-border space-y-4">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchSearchConsole}
                disabled={scLoading}
                className="shrink-0"
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
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <MousePointerClick className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      Total Clicks
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">
                      {scData.totals.clicks.toLocaleString()}
                    </p>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Eye className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                      Impressions
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-violet-600">
                      {scData.totals.impressions.toLocaleString()}
                    </p>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Avg CTR
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-600">
                      {(scData.totals.ctr * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="border border-border rounded-lg p-3">
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
                    <div className="border border-border rounded-lg overflow-x-auto">
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
                    <div className="border border-border rounded-lg overflow-x-auto">
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
        )}
      </div>

      {/* Keyword Cannibalization (GSC-powered) */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowCannibalization(!showCannibalization)}
          className="w-full p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-900/70 transition-colors"
        >
          <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2 flex-wrap">
            <Target className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Keyword Cannibalization</span>
            {data.keywordOverlaps && data.keywordOverlaps.length > 0 && (
              <span className="text-xs font-normal px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {data.keywordOverlaps.length}
              </span>
            )}
            <span className="text-xs font-normal text-muted-foreground">GSC 28d</span>
          </h2>
          {showCannibalization ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
        </button>
        {showCannibalization && (
          <div className="p-4 border-t border-border space-y-4">
            {data.keywordOverlaps && data.keywordOverlaps.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {data.keywordOverlaps.filter((o) => o.severity === "high").length} high,{" "}
                  {data.keywordOverlaps.filter((o) => o.severity === "medium").length} medium
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllOverlaps(!showAllOverlaps)}
                  className="shrink-0"
                >
                  {showAllOverlaps ? "High/Medium only" : "Show all"}
                  {showAllOverlaps ? (
                    <ChevronUp className="w-3.5 h-3.5 ml-1" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 ml-1" />
                  )}
                </Button>
              </div>
            )}

            {(!data.keywordOverlaps || data.keywordOverlaps.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                No queries with multiple ranking pages detected in the last 28 days.
              </p>
            ) : (
              <div className="border border-border rounded-lg overflow-x-auto">
                <table className="w-full text-sm min-w-150">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs text-muted-foreground">
                      <th className="text-left p-2 pl-3">Query</th>
                      <th className="text-right p-2">Impressions</th>
                      <th className="text-right p-2 hidden sm:table-cell">Clicks</th>
                      <th className="text-left p-2">Pages</th>
                      <th className="text-center p-2 pr-3 w-24">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.keywordOverlaps
                      .filter((o) => showAllOverlaps || o.severity !== "low")
                      .map((overlap) => {
                        const isExpanded = expandedKeywords.has(overlap.keyword);
                        return (
                          <tr
                            key={overlap.keyword}
                            className="hover:bg-slate-50 dark:hover:bg-slate-900/30 cursor-pointer align-top"
                            onClick={() => {
                              const next = new Set(expandedKeywords);
                              if (isExpanded) {
                                next.delete(overlap.keyword);
                              } else {
                                next.add(overlap.keyword);
                              }
                              setExpandedKeywords(next);
                            }}
                          >
                            <td className="p-2 pl-3 font-medium">
                              <div className="flex items-center gap-1.5">
                                {isExpanded ? (
                                  <ChevronUp className="w-3 h-3 text-muted-foreground shrink-0" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                                )}
                                <span className="truncate max-w-50 sm:max-w-75">{overlap.keyword}</span>
                              </div>
                            </td>
                            <td className="p-2 text-right text-muted-foreground">
                              {overlap.totalImpressions.toLocaleString()}
                            </td>
                            <td className="p-2 text-right text-blue-600 font-medium hidden sm:table-cell">
                              {overlap.totalClicks}
                            </td>
                            <td className="p-2">
                              {isExpanded ? (
                                <div className="space-y-1.5">
                                  {overlap.pages.map((page) => (
                                    <div
                                      key={page.path}
                                      className="flex items-center gap-2 flex-wrap"
                                    >
                                      <TypeBadge type={page.type} />
                                      <span className="text-xs truncate max-w-40">
                                        {page.path}
                                      </span>
                                      <PositionBadge position={page.position} />
                                      <span className="text-[10px] text-muted-foreground">
                                        {page.impressions.toLocaleString()} imp
                                      </span>
                                      <span className="text-[10px] text-blue-600">
                                        {page.clicks} clicks
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {overlap.pages.map((page) => (
                                    <TypeBadge key={page.path} type={page.type} />
                                  ))}
                                  <span className="text-xs text-muted-foreground">
                                    {overlap.pages.length} pages
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="p-2 pr-3 text-center">
                              <SeverityBadge severity={overlap.severity} />
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Canonical URL Monitor */}
      {data.canonicalStatuses && data.canonicalStatuses.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setShowCanonicals(!showCanonicals)}
            className="w-full p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-900/70 transition-colors"
          >
            <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <Link2 className="w-4 h-4 text-cyan-600 shrink-0" />
              Canonical URLs
              {(() => {
                const issues = data.canonicalStatuses.filter((c) => c.issue !== "ok").length;
                return issues > 0 ? (
                  <span className="text-xs font-normal px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {issues} issues
                  </span>
                ) : (
                  <span className="text-xs font-normal px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    All OK
                  </span>
                );
              })()}
            </h2>
            {showCanonicals ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
          </button>
          {showCanonicals && (
            <div className="p-4 border-t border-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    {data.canonicalStatuses.filter((c) => c.issue === "ok").length} OK
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    {data.canonicalStatuses.filter((c) => c.issue === "missing").length} Missing
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {data.canonicalStatuses.filter((c) => c.issue === "mismatch").length} Mismatch
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllCanonicals(!showAllCanonicals)}
                  className="shrink-0"
                >
                  {showAllCanonicals ? "Issues only" : "Show all"}
                  {showAllCanonicals ? (
                    <ChevronUp className="w-3.5 h-3.5 ml-1" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 ml-1" />
                  )}
                </Button>
              </div>

              {(() => {
                const filtered = showAllCanonicals
                  ? data.canonicalStatuses
                  : data.canonicalStatuses.filter((c) => c.issue !== "ok");

                if (filtered.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      All canonical URLs are correctly configured.
                    </p>
                  );
                }

                return (
                  <div className="border border-border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm min-w-125">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs text-muted-foreground">
                          <th className="text-left p-2 pl-3">Page</th>
                          <th className="text-left p-2">Canonical URL</th>
                          <th className="text-center p-2 pr-3 w-24">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filtered.map((item) => (
                          <tr
                            key={item.path}
                            className="hover:bg-slate-50 dark:hover:bg-slate-900/30"
                          >
                            <td className="p-2 pl-3">
                              <div className="flex items-center gap-2">
                                <TypeBadge type={item.type} />
                                <span className="text-xs font-medium truncate max-w-40 sm:max-w-60">
                                  {item.path}
                                </span>
                              </div>
                            </td>
                            <td className="p-2">
                              <span className="text-xs text-muted-foreground truncate block max-w-60">
                                {item.canonical || "Not set"}
                              </span>
                            </td>
                            <td className="p-2 pr-3 text-center">
                              {item.issue === "ok" ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  OK
                                </span>
                              ) : item.issue === "missing" ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                  Missing
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                  Mismatch
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Unindexed Pages Detection */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowUnindexed(!showUnindexed)}
          className="w-full p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-900/70 transition-colors"
        >
          <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <SearchX className="w-4 h-4 text-amber-600 shrink-0" />
            Unindexed Pages
            {scData && data && (() => {
              const knownUrls = new Set([
                ...data.pages.map((p) => p.url.replace("https://linkedgrow.ai", "") || "/"),
                ...data.blogPosts.filter((p) => p.status === "published").map((p) => `/blog/${p.slug}`),
              ]);
              const gscPaths = new Set(scData.pages.map((p) => p.page.replace("https://linkedgrow.ai", "") || "/"));
              const unindexed = [...knownUrls].filter((u) => !gscPaths.has(u));
              return unindexed.length > 0 ? (
                <span className="text-xs font-normal px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {unindexed.length}
                </span>
              ) : (
                <span className="text-xs font-normal px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  0
                </span>
              );
            })()}
          </h2>
          {showUnindexed ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
        </button>
        {showUnindexed && (
          <div className="p-4 border-t border-border space-y-3">
            {!scData ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                GSC data required. Wait for Search Console data to load.
              </p>
            ) : (() => {
              const knownUrls = [
                ...data.pages.map((p) => ({ path: p.url.replace("https://linkedgrow.ai", "") || "/", url: p.url })),
                ...data.blogPosts.filter((p) => p.status === "published").map((p) => ({ path: `/blog/${p.slug}`, url: p.url })),
              ];
              const gscPaths = new Set(scData.pages.map((p) => p.page.replace("https://linkedgrow.ai", "") || "/"));
              const unindexed = knownUrls.filter((u) => !gscPaths.has(u.path));

              if (unindexed.length === 0) {
                return (
                  <p className="text-sm text-green-600 text-center py-2">
                    All pages appear in Google Search results.
                  </p>
                );
              }

              return (
                <>
                  <p className="text-xs text-muted-foreground">
                    Pages with 0 impressions in GSC (last 28 days) - likely not indexed yet.
                  </p>
                  <div className="space-y-1.5">
                    {unindexed.map((page) => (
                      <div
                        key={page.path}
                        className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg gap-2"
                      >
                        <span className="text-xs sm:text-sm truncate min-w-0">{page.path}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => triggerIndexing([page.url])}
                          disabled={indexingUrls.has(page.url)}
                          title="Request indexing"
                          className="shrink-0"
                        >
                          {indexingUrls.has(page.url) ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => triggerIndexing(unindexed.map((u) => u.url))}
                    disabled={indexingAll}
                    className="w-full"
                  >
                    <Zap className="w-3.5 h-3.5 mr-1.5" />
                    Index All Unindexed ({unindexed.length})
                  </Button>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Broken Internal Links */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowBrokenLinks(!showBrokenLinks)}
          className="w-full p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-900/70 transition-colors"
        >
          <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <Unlink className="w-4 h-4 text-red-600 shrink-0" />
            Broken Internal Links
            {data.brokenLinks && (
              <span className={`text-xs font-normal px-1.5 py-0.5 rounded-full ${
                data.brokenLinks.length > 0
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              }`}>
                {data.brokenLinks.length}
              </span>
            )}
          </h2>
          {showBrokenLinks ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
        </button>
        {showBrokenLinks && (
          <div className="p-4 border-t border-border">
            {!data.brokenLinks || data.brokenLinks.length === 0 ? (
              <p className="text-sm text-green-600 text-center py-2">
                No broken internal links found.
              </p>
            ) : (
              <div className="border border-border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs text-muted-foreground">
                      <th className="text-left p-2 pl-3">Source Page</th>
                      <th className="text-left p-2">Broken Link</th>
                      <th className="text-center p-2 pr-3 w-20">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.brokenLinks.map((link, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                        <td className="p-2 pl-3 text-xs truncate max-w-40">{link.source}</td>
                        <td className="p-2 text-xs text-red-600 truncate max-w-50">{link.href}</td>
                        <td className="p-2 pr-3 text-center">
                          <TypeBadge type={link.type} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Pages Alert */}
      {errorPages.length > 0 && (
        <div className="border border-red-200 dark:border-red-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowErrors(!showErrors)}
            className="w-full p-3 sm:p-4 bg-red-50 dark:bg-red-950/30 flex items-center justify-between hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
          >
            <h2 className="text-sm sm:text-base font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Pages with Errors
              <span className="text-xs font-normal px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {errorPages.length}
              </span>
            </h2>
            {showErrors ? (
              <ChevronUp className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-red-400 shrink-0" />
            )}
          </button>
          {showErrors && (
            <div className="p-4 border-t border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 space-y-2">
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
          )}
        </div>
      )}

      {/* Slow Pages Warning */}
      {slowPages.length > 0 && (
        <div className="border border-amber-200 dark:border-amber-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowSlowPages(!showSlowPages)}
            className="w-full p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/30 flex items-center justify-between hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
          >
            <h2 className="text-sm sm:text-base font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              Slow Pages
              <span className="text-xs font-normal px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {slowPages.length}
              </span>
              <span className="text-xs font-normal text-amber-600">over 3s</span>
            </h2>
            {showSlowPages ? (
              <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-amber-400 shrink-0" />
            )}
          </button>
          {showSlowPages && (
            <div className="p-4 border-t border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
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
          )}
        </div>
      )}

      {/* Public Pages */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowPublicPages(!showPublicPages)}
          className="w-full p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-900/70 transition-colors"
        >
          <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 shrink-0" />
            Public Pages ({data.pages.length})
          </h2>
          {showPublicPages ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
        </button>
        {showPublicPages && (
          <div className="divide-y divide-border border-t border-border">
            {data.pages.map((page) => (
              <PageRow
                key={page.url}
                page={page}
                onIndex={() => triggerIndexing([page.url])}
                isIndexing={indexingUrls.has(page.url)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Blog Posts */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowBlogPosts(!showBlogPosts)}
          className="w-full p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-900/70 transition-colors"
        >
          <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 shrink-0" />
            Blog Posts ({data.totalPosts})
          </h2>
          {showBlogPosts ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
        </button>
        {showBlogPosts && (
          <div className="divide-y divide-border border-t border-border">
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
        )}
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
        : color === "amber"
          ? "border-amber-200 dark:border-amber-800"
          : "";

  return (
    <div className={`border rounded-xl p-3 ${colorClasses || "border-border"}`}>
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

function TypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; color: string }> = {
    blog: {
      label: "Blog",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    feature: {
      label: "Feature",
      color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    },
    audience: {
      label: "Audience",
      color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    },
    "use-case": {
      label: "Use Case",
      color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    industry: {
      label: "Industry",
      color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    },
    "free-tool": {
      label: "Tool",
      color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    },
    marketing: {
      label: "Marketing",
      color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
    },
  };

  const { label, color } = config[type] || {
    label: type,
    color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  };

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${color}`}>
      {label}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: "high" | "medium" | "low" }) {
  const config = {
    high: {
      label: "High",
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
    medium: {
      label: "Medium",
      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    low: {
      label: "Low",
      color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    },
  };

  const { label, color } = config[severity];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{label}</span>
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
