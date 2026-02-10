"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Brain,
  Search,
  Target,
  Users,
  TrendingUp,
  ExternalLink,
  Loader2,
  RefreshCw,
  ChevronRight,
  Lightbulb,
  BarChart3,
  FileText,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Types

interface RankedKeyword {
  keyword: string;
  position: number;
  url: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  intent: string;
  etv: number;
}

interface Competitor {
  domain: string;
  avgPosition: number;
  sharedKeywords: number;
  totalKeywords: number;
  estimatedTraffic: number;
}

interface ContentGap {
  keyword: string;
  competitorPosition: number;
  competitorUrl: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  intent: string;
  etv: number;
}

interface KeywordSuggestion {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: string;
  intent: string;
}

interface OverviewData {
  rankedKeywords: { total: number; keywords: RankedKeyword[] };
  competitors: Competitor[];
}

// Main Page

export default function SeoIntelligencePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "gaps" | "research"
  >("overview");

  // Content gaps state
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>("");
  const [gaps, setGaps] = useState<ContentGap[] | null>(null);
  const [gapsTotal, setGapsTotal] = useState(0);
  const [gapsLoading, setGapsLoading] = useState(false);

  // Keyword research state
  const [seedKeyword, setSeedKeyword] = useState("");
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[] | null>(
    null
  );
  const [suggestionsTotal, setSuggestionsTotal] = useState(0);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Site keywords state
  const [siteKeywords, setSiteKeywords] = useState<KeywordSuggestion[] | null>(
    null
  );
  const [siteKeywordsLoading, setSiteKeywordsLoading] = useState(false);

  const isAdmin = session?.user?.isAdmin;

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/seo-intelligence");
      if (res.ok) {
        setOverview(await res.json());
      } else {
        const json = await res.json();
        setError(json.error || "Failed to load");
      }
    } catch {
      setError("Failed to connect");
    } finally {
      setLoading(false);
    }
  };

  const fetchContentGaps = async (competitor: string) => {
    setGapsLoading(true);
    try {
      const res = await fetch("/api/admin/seo-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "content-gaps", competitor }),
      });
      const json = await res.json();
      if (json.success) {
        setGaps(json.gaps.gaps);
        setGapsTotal(json.gaps.total);
      }
    } catch {
      console.error("Failed to fetch content gaps");
    } finally {
      setGapsLoading(false);
    }
  };

  const fetchKeywordSuggestions = async (keyword: string) => {
    setSuggestionsLoading(true);
    try {
      const res = await fetch("/api/admin/seo-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "keyword-suggestions", keyword }),
      });
      const json = await res.json();
      if (json.success) {
        setSuggestions(json.suggestions.suggestions);
        setSuggestionsTotal(json.suggestions.total);
      }
    } catch {
      console.error("Failed to fetch suggestions");
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const fetchSiteKeywords = async () => {
    setSiteKeywordsLoading(true);
    try {
      const res = await fetch("/api/admin/seo-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "keywords-for-site" }),
      });
      const json = await res.json();
      if (json.success) {
        setSiteKeywords(json.suggestions.suggestions);
      }
    } catch {
      console.error("Failed to fetch site keywords");
    } finally {
      setSiteKeywordsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchOverview();
  }, [isAdmin]);

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
        <span>Analyzing your SEO landscape...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchOverview}>Retry</Button>
      </div>
    );
  }

  if (!overview) return null;

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BarChart3 },
    { id: "gaps" as const, label: "Content Gaps", icon: Target },
    { id: "research" as const, label: "Keyword Research", icon: Search },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-violet-600" />
            SEO Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Keyword research, competitor analysis, and content recommendations
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOverview}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab overview={overview} onFetchSiteKeywords={fetchSiteKeywords} siteKeywords={siteKeywords} siteKeywordsLoading={siteKeywordsLoading} />
      )}
      {activeTab === "gaps" && (
        <ContentGapsTab
          competitors={overview.competitors}
          selectedCompetitor={selectedCompetitor}
          onSelectCompetitor={(c) => {
            setSelectedCompetitor(c);
            fetchContentGaps(c);
          }}
          gaps={gaps}
          gapsTotal={gapsTotal}
          loading={gapsLoading}
        />
      )}
      {activeTab === "research" && (
        <KeywordResearchTab
          seedKeyword={seedKeyword}
          onSeedChange={setSeedKeyword}
          onSearch={() => fetchKeywordSuggestions(seedKeyword)}
          suggestions={suggestions}
          suggestionsTotal={suggestionsTotal}
          loading={suggestionsLoading}
        />
      )}
    </div>
  );
}

// ====== Overview Tab ======

function OverviewTab({
  overview,
  onFetchSiteKeywords,
  siteKeywords,
  siteKeywordsLoading,
}: {
  overview: OverviewData;
  onFetchSiteKeywords: () => void;
  siteKeywords: KeywordSuggestion[] | null;
  siteKeywordsLoading: boolean;
}) {
  const { rankedKeywords, competitors } = overview;

  // Stats
  const top10 = rankedKeywords.keywords.filter((k) => k.position <= 10).length;
  const top30 = rankedKeywords.keywords.filter((k) => k.position <= 30).length;
  const totalEtv = rankedKeywords.keywords.reduce((sum, k) => sum + k.etv, 0);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox
          label="Total Ranked Keywords"
          value={rankedKeywords.total.toLocaleString()}
          icon={<TrendingUp className="w-4 h-4 text-violet-600" />}
        />
        <StatBox
          label="Top 10 Positions"
          value={top10.toString()}
          icon={<Target className="w-4 h-4 text-emerald-600" />}
          color="emerald"
        />
        <StatBox
          label="Top 30 Positions"
          value={top30.toString()}
          icon={<BarChart3 className="w-4 h-4 text-blue-600" />}
        />
        <StatBox
          label="Est. Monthly Traffic"
          value={Math.round(totalEtv).toLocaleString()}
          icon={<Users className="w-4 h-4 text-amber-600" />}
        />
      </div>

      {/* Ranked Keywords */}
      <div className="border rounded-xl overflow-hidden">
        <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/50">
          <h2 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Your Ranked Keywords (Top {rankedKeywords.keywords.length} by volume)
          </h2>
        </div>
        {rankedKeywords.keywords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs text-muted-foreground">
                  <th className="text-left p-2 pl-3">Keyword</th>
                  <th className="text-right p-2">Position</th>
                  <th className="text-right p-2">Volume</th>
                  <th className="text-right p-2 hidden sm:table-cell">
                    Difficulty
                  </th>
                  <th className="text-right p-2 hidden md:table-cell">
                    Intent
                  </th>
                  <th className="text-left p-2 pl-3 hidden lg:table-cell">
                    URL
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rankedKeywords.keywords.map((kw) => (
                  <tr
                    key={kw.keyword}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/30"
                  >
                    <td className="p-2 pl-3 font-medium">{kw.keyword}</td>
                    <td className="p-2 text-right">
                      <PositionBadge position={kw.position} />
                    </td>
                    <td className="p-2 text-right">
                      {kw.searchVolume.toLocaleString()}
                    </td>
                    <td className="p-2 text-right hidden sm:table-cell">
                      <DifficultyBadge difficulty={kw.difficulty} />
                    </td>
                    <td className="p-2 text-right hidden md:table-cell">
                      <IntentBadge intent={kw.intent} />
                    </td>
                    <td className="p-2 pl-3 hidden lg:table-cell truncate max-w-48">
                      <a
                        href={kw.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs"
                      >
                        {kw.url.replace("https://linkedgrow.ai", "")}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-6 text-center text-muted-foreground">
            No ranked keywords found yet. This is normal for new sites - keep publishing content!
          </p>
        )}
      </div>

      {/* Competitors */}
      <div className="border rounded-xl overflow-hidden">
        <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/50">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" />
            Organic Competitors
          </h2>
        </div>
        {competitors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs text-muted-foreground">
                  <th className="text-left p-2 pl-3">Domain</th>
                  <th className="text-right p-2">Shared Keywords</th>
                  <th className="text-right p-2">Total Keywords</th>
                  <th className="text-right p-2 hidden sm:table-cell">
                    Avg Position
                  </th>
                  <th className="text-right p-2 pr-3 hidden sm:table-cell">
                    Est. Traffic
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {competitors.map((comp) => (
                  <tr
                    key={comp.domain}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/30"
                  >
                    <td className="p-2 pl-3 font-medium flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                      {comp.domain}
                    </td>
                    <td className="p-2 text-right text-blue-600 font-medium">
                      {comp.sharedKeywords}
                    </td>
                    <td className="p-2 text-right">
                      {comp.totalKeywords.toLocaleString()}
                    </td>
                    <td className="p-2 text-right hidden sm:table-cell">
                      {comp.avgPosition.toFixed(1)}
                    </td>
                    <td className="p-2 pr-3 text-right hidden sm:table-cell">
                      {Math.round(comp.estimatedTraffic).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-6 text-center text-muted-foreground">
            No competitors found yet. This data appears once you start ranking for keywords.
          </p>
        )}
      </div>

      {/* Keyword Opportunities for Site */}
      <div className="border rounded-xl overflow-hidden">
        <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Keyword Opportunities for linkedgrow.ai
          </h2>
          {!siteKeywords && (
            <Button
              size="sm"
              variant="outline"
              onClick={onFetchSiteKeywords}
              disabled={siteKeywordsLoading}
            >
              {siteKeywordsLoading ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5 mr-1" />
              )}
              Discover Keywords
            </Button>
          )}
        </div>
        {siteKeywordsLoading && !siteKeywords && (
          <div className="p-8 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Finding keyword opportunities...</span>
          </div>
        )}
        {siteKeywords && (
          <KeywordTable keywords={siteKeywords} />
        )}
        {!siteKeywords && !siteKeywordsLoading && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Click &quot;Discover Keywords&quot; to find keyword opportunities relevant to your site. (~$0.03 per run)
          </p>
        )}
      </div>
    </div>
  );
}

// ====== Content Gaps Tab ======

function ContentGapsTab({
  competitors,
  selectedCompetitor,
  onSelectCompetitor,
  gaps,
  gapsTotal,
  loading,
}: {
  competitors: Competitor[];
  selectedCompetitor: string;
  onSelectCompetitor: (domain: string) => void;
  gaps: ContentGap[] | null;
  gapsTotal: number;
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="border rounded-xl p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Target className="w-4 h-4" />
          Find Content Gaps
        </h2>
        <p className="text-sm text-muted-foreground">
          Select a competitor to see keywords they rank for that you
          don&apos;t. These are opportunities for new pages or articles.
        </p>
        <div className="flex flex-wrap gap-2">
          {competitors.slice(0, 10).map((comp) => (
            <Button
              key={comp.domain}
              variant={
                selectedCompetitor === comp.domain ? "default" : "outline"
              }
              size="sm"
              onClick={() => onSelectCompetitor(comp.domain)}
              disabled={loading}
              className={
                selectedCompetitor === comp.domain
                  ? "bg-violet-600 hover:bg-violet-700"
                  : ""
              }
            >
              {comp.domain}
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ))}
        </div>
        {competitors.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No competitors found. Enter a competitor domain manually below.
          </p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Or enter competitor domain (e.g. taplio.com)"
            className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const val = (e.target as HTMLInputElement).value.trim();
                if (val) onSelectCompetitor(val);
              }
            }}
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Analyzing content gaps with {selectedCompetitor}...</span>
        </div>
      )}

      {gaps && !loading && (
        <div className="border rounded-xl overflow-hidden">
          <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/50">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Content Gaps vs {selectedCompetitor}
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({gapsTotal.toLocaleString()} total, showing top {gaps.length})
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Keywords {selectedCompetitor} ranks for that linkedgrow.ai does not. Sorted by search volume.
            </p>
          </div>
          {gaps.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs text-muted-foreground">
                    <th className="text-left p-2 pl-3">Keyword</th>
                    <th className="text-right p-2">Volume</th>
                    <th className="text-right p-2">Difficulty</th>
                    <th className="text-right p-2 hidden sm:table-cell">
                      Their Position
                    </th>
                    <th className="text-right p-2 hidden md:table-cell">
                      Intent
                    </th>
                    <th className="text-right p-2 pr-3 hidden md:table-cell">
                      CPC
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {gaps.map((gap) => (
                    <tr
                      key={gap.keyword}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/30"
                    >
                      <td className="p-2 pl-3 font-medium">{gap.keyword}</td>
                      <td className="p-2 text-right font-medium text-blue-600">
                        {gap.searchVolume.toLocaleString()}
                      </td>
                      <td className="p-2 text-right">
                        <DifficultyBadge difficulty={gap.difficulty} />
                      </td>
                      <td className="p-2 text-right hidden sm:table-cell">
                        <PositionBadge position={gap.competitorPosition} />
                      </td>
                      <td className="p-2 text-right hidden md:table-cell">
                        <IntentBadge intent={gap.intent} />
                      </td>
                      <td className="p-2 pr-3 text-right text-muted-foreground hidden md:table-cell">
                        ${gap.cpc.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-6 text-center text-muted-foreground">
              No content gaps found with this competitor.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ====== Keyword Research Tab ======

function KeywordResearchTab({
  seedKeyword,
  onSeedChange,
  onSearch,
  suggestions,
  suggestionsTotal,
  loading,
}: {
  seedKeyword: string;
  onSeedChange: (v: string) => void;
  onSearch: () => void;
  suggestions: KeywordSuggestion[] | null;
  suggestionsTotal: number;
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="border rounded-xl p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Search className="w-4 h-4" />
          Keyword Research
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter a seed keyword to find related keywords with search volume,
          difficulty, and intent data.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter keyword (e.g. linkedin post generator)"
            value={seedKeyword}
            onChange={(e) => onSeedChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && seedKeyword.trim()) onSearch();
            }}
            className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background"
          />
          <Button
            onClick={onSearch}
            disabled={loading || !seedKeyword.trim()}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          ~$0.02 per search. Results show related keywords containing your seed term.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Researching &quot;{seedKeyword}&quot;...</span>
        </div>
      )}

      {suggestions && !loading && (
        <div className="border rounded-xl overflow-hidden">
          <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/50">
            <h2 className="font-semibold flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Keyword Suggestions
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({suggestionsTotal.toLocaleString()} total, showing top{" "}
                {suggestions.length})
              </span>
            </h2>
          </div>
          <KeywordTable keywords={suggestions} />
        </div>
      )}
    </div>
  );
}

// ====== Shared Components ======

function KeywordTable({ keywords }: { keywords: KeywordSuggestion[] }) {
  if (keywords.length === 0) {
    return (
      <p className="p-6 text-center text-muted-foreground">
        No keywords found.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs text-muted-foreground">
            <th className="text-left p-2 pl-3">Keyword</th>
            <th className="text-right p-2">Volume</th>
            <th className="text-right p-2">Difficulty</th>
            <th className="text-right p-2 hidden sm:table-cell">
              Competition
            </th>
            <th className="text-right p-2 hidden md:table-cell">Intent</th>
            <th className="text-right p-2 pr-3 hidden md:table-cell">CPC</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {keywords.map((kw) => (
            <tr
              key={kw.keyword}
              className="hover:bg-slate-50 dark:hover:bg-slate-900/30"
            >
              <td className="p-2 pl-3 font-medium">{kw.keyword}</td>
              <td className="p-2 text-right font-medium text-blue-600">
                {kw.searchVolume.toLocaleString()}
              </td>
              <td className="p-2 text-right">
                <DifficultyBadge difficulty={kw.difficulty} />
              </td>
              <td className="p-2 text-right hidden sm:table-cell">
                <CompetitionBadge level={kw.competition} />
              </td>
              <td className="p-2 text-right hidden md:table-cell">
                <IntentBadge intent={kw.intent} />
              </td>
              <td className="p-2 pr-3 text-right text-muted-foreground hidden md:table-cell">
                ${kw.cpc.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatBox({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div
      className={`border rounded-xl p-3 ${color === "emerald" ? "border-emerald-200 dark:border-emerald-800" : ""}`}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function PositionBadge({ position }: { position: number }) {
  const color =
    position <= 3
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : position <= 10
        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        : position <= 30
          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";

  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${color}`}>
      #{position}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: number }) {
  const color =
    difficulty <= 30
      ? "text-emerald-600"
      : difficulty <= 60
        ? "text-amber-600"
        : "text-red-600";

  return <span className={`text-xs font-medium ${color}`}>{difficulty}</span>;
}

function IntentBadge({ intent }: { intent: string }) {
  const config: Record<string, { label: string; color: string }> = {
    informational: {
      label: "Info",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    navigational: {
      label: "Nav",
      color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
    },
    commercial: {
      label: "Comm",
      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    transactional: {
      label: "Trans",
      color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
  };

  const { label, color } = config[intent] || {
    label: intent,
    color: "bg-slate-100 text-slate-600",
  };

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${color}`}>{label}</span>
  );
}

function CompetitionBadge({ level }: { level: string }) {
  const color =
    level === "LOW"
      ? "text-emerald-600"
      : level === "MEDIUM"
        ? "text-amber-600"
        : level === "HIGH"
          ? "text-red-600"
          : "text-muted-foreground";

  return <span className={`text-xs ${color}`}>{level}</span>;
}
