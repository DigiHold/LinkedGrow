"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Brain,
  Search,
  Target,
  Users,
  TrendingUp,
  Loader2,
  ChevronRight,
  Lightbulb,
  BarChart3,
  FileText,
  Globe,
  Zap,
  Clock,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Competitors to analyze for content gaps
const KNOWN_COMPETITORS = [
  "taplio.com",
  "buffer.com",
  "hootsuite.com",
  "sproutsocial.com",
  "later.com",
  "publer.io",
  "socialbee.io",
  "typefully.com",
  "postwise.ai",
  "authorityhacker.com",
];

// Competitors auto-analyzed on button click (top 5 most relevant)
const AUTO_COMPETITORS = [
  "taplio.com",
  "buffer.com",
  "hootsuite.com",
  "later.com",
  "authorityhacker.com",
];

// Seed keywords auto-analyzed on button click
const AUTO_SEEDS = [
  "linkedin post generator",
  "linkedin content tool",
  "linkedin scheduling tool",
  "ai linkedin writer",
  "linkedin algorithm",
];

// All suggested keywords for manual drill-down
const SEED_SUGGESTIONS = [
  "linkedin post generator",
  "linkedin content tool",
  "linkedin scheduling tool",
  "ai linkedin writer",
  "linkedin algorithm",
  "linkedin engagement tips",
  "linkedin automation tool",
  "linkedin post ideas",
  "linkedin analytics tool",
  "best time to post linkedin",
  "linkedin carousel maker",
  "linkedin content strategy",
  "linkedin hook examples",
  "linkedin personal branding",
  "linkedin growth strategy",
];

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
  source?: string;
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
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState("");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [siteKeywords, setSiteKeywords] = useState<KeywordSuggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "gaps" | "research">("gaps");

  // Content gaps (merged from all competitors)
  const [mergedGaps, setMergedGaps] = useState<ContentGap[] | null>(null);
  const [mergedGapsTotal, setMergedGapsTotal] = useState(0);
  // Single competitor drill-down
  const [selectedCompetitor, setSelectedCompetitor] = useState("");
  const [singleGaps, setSingleGaps] = useState<ContentGap[] | null>(null);
  const [singleGapsTotal, setSingleGapsTotal] = useState(0);
  const [gapsLoading, setGapsLoading] = useState(false);

  // Keywords (merged from all seeds)
  const [mergedSuggestions, setMergedSuggestions] = useState<KeywordSuggestion[] | null>(null);
  const [mergedSuggestionsTotal, setMergedSuggestionsTotal] = useState(0);
  // Single keyword drill-down
  const [seedKeyword, setSeedKeyword] = useState("");
  const [singleSuggestions, setSingleSuggestions] = useState<KeywordSuggestion[] | null>(null);
  const [singleSuggestionsTotal, setSingleSuggestionsTotal] = useState(0);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const [lastLoaded, setLastLoaded] = useState<string | null>(null);
  const isAdmin = session?.user?.isAdmin;

  useEffect(() => {
    const saved = localStorage.getItem("seo-intel-last-loaded");
    if (saved) setLastLoaded(saved);
  }, []);

  const postApi = async (body: Record<string, string>) =>
    fetch("/api/admin/seo-intelligence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  // FULL ANALYSIS: 2 + 5 + 5 = 12 API calls in parallel = ~$0.12
  const runFullAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedCompetitor("");
    setSingleGaps(null);
    setSingleSuggestions(null);
    setSeedKeyword("");
    setLoadingProgress("Fetching rankings, competitors, content gaps, and keywords...");

    try {
      // Run everything in parallel
      const overviewP = fetch("/api/admin/seo-intelligence");
      const siteKwP = postApi({ action: "keywords-for-site" });
      const gapPs = AUTO_COMPETITORS.map((comp) =>
        postApi({ action: "content-gaps", competitor: comp })
          .then((r) => r.json())
          .then((json) => ({ competitor: comp, json }))
      );
      const kwPs = AUTO_SEEDS.map((seed) =>
        postApi({ action: "keyword-suggestions", keyword: seed })
          .then((r) => r.json())
          .then((json) => ({ seed, json }))
      );

      const [overviewRes, siteKwRes, ...rest] = await Promise.all([
        overviewP,
        siteKwP,
        ...gapPs,
        ...kwPs,
      ]);

      const gapResults = rest.slice(0, AUTO_COMPETITORS.length) as { competitor: string; json: Record<string, unknown> }[];
      const kwResults = rest.slice(AUTO_COMPETITORS.length) as { seed: string; json: Record<string, unknown> }[];

      // Overview
      if (overviewRes.ok) {
        setOverview(await overviewRes.json());
      } else {
        const json = await overviewRes.json();
        setError(json.error || "Failed to load");
        setLoading(false);
        return;
      }

      // Site keywords
      const siteKwJson = await siteKwRes.json();
      if (siteKwJson.success) {
        setSiteKeywords(siteKwJson.suggestions.suggestions);
      }

      // Merge content gaps (deduplicate by keyword, track which competitors)
      const gapMap = new Map<string, ContentGap>();
      let totalGaps = 0;
      for (const { competitor, json } of gapResults) {
        if (!(json as { success?: boolean }).success) continue;
        const data = json as { gaps: { total: number; gaps: ContentGap[] } };
        totalGaps += data.gaps.total || 0;
        for (const gap of data.gaps.gaps || []) {
          const existing = gapMap.get(gap.keyword);
          if (!existing || gap.searchVolume > existing.searchVolume) {
            gapMap.set(gap.keyword, {
              ...gap,
              source: existing?.source ? `${existing.source}, ${competitor}` : competitor,
            });
          } else if (existing) {
            existing.source = existing.source ? `${existing.source}, ${competitor}` : competitor;
          }
        }
      }
      setMergedGaps(Array.from(gapMap.values()).sort((a, b) => b.searchVolume - a.searchVolume));
      setMergedGapsTotal(totalGaps);

      // Merge keyword suggestions (deduplicate by keyword)
      const kwMap = new Map<string, KeywordSuggestion>();
      let totalKw = 0;
      for (const { json } of kwResults) {
        if (!(json as { success?: boolean }).success) continue;
        const data = json as { suggestions: { total: number; suggestions: KeywordSuggestion[] } };
        totalKw += data.suggestions.total || 0;
        for (const kw of data.suggestions.suggestions || []) {
          if (!kwMap.has(kw.keyword) || kw.searchVolume > (kwMap.get(kw.keyword)?.searchVolume || 0)) {
            kwMap.set(kw.keyword, kw);
          }
        }
      }
      setMergedSuggestions(Array.from(kwMap.values()).sort((a, b) => b.searchVolume - a.searchVolume));
      setMergedSuggestionsTotal(totalKw);

      setActiveTab("gaps");
      const now = new Date().toISOString();
      setLastLoaded(now);
      localStorage.setItem("seo-intel-last-loaded", now);
    } catch {
      setError("Failed to connect to API");
    } finally {
      setLoading(false);
      setLoadingProgress("");
    }
  }, []);

  const fetchContentGaps = async (competitor: string) => {
    setGapsLoading(true);
    setSingleGaps(null);
    try {
      const res = await postApi({ action: "content-gaps", competitor });
      const json = await res.json();
      if (json.success) {
        setSingleGaps(json.gaps.gaps);
        setSingleGapsTotal(json.gaps.total);
      }
    } catch {
      /* empty */
    } finally {
      setGapsLoading(false);
    }
  };

  const fetchKeywordSuggestions = async (keyword: string) => {
    setSuggestionsLoading(true);
    setSingleSuggestions(null);
    try {
      const res = await postApi({ action: "keyword-suggestions", keyword });
      const json = await res.json();
      if (json.success) {
        setSingleSuggestions(json.suggestions.suggestions);
        setSingleSuggestionsTotal(json.suggestions.total);
      }
    } catch {
      /* empty */
    } finally {
      setSuggestionsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  const formatLastLoaded = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago (${d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })})`;
  };

  const hasData = overview !== null;
  const gapCount = mergedGaps ? mergedGaps.length : 0;
  const kwCount = mergedSuggestions ? mergedSuggestions.length : 0;

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BarChart3 },
    { id: "gaps" as const, label: `Content Gaps${gapCount > 0 ? ` (${gapCount.toLocaleString()})` : ""}`, icon: Target },
    { id: "research" as const, label: `Keywords${kwCount > 0 ? ` (${kwCount.toLocaleString()})` : ""}`, icon: Search },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="w-6 h-6 text-violet-600" />
          SEO Intelligence
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Discover what pages and articles to create, which keywords to target, and what your competitors rank for
        </p>
      </div>

      {/* Analysis Button */}
      <div className="border rounded-xl p-5 bg-linear-to-r from-violet-50 to-blue-50 dark:from-violet-950/30 dark:to-blue-950/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span>~$0.12 per full analysis (12 API calls)</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-lg">
              Analyzes {AUTO_COMPETITORS.length} competitors ({AUTO_COMPETITORS.join(", ")}) + {AUTO_SEEDS.length} keyword topics
            </p>
            {lastLoaded ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Last: {formatLastLoaded(lastLoaded)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>No analysis run yet</span>
              </div>
            )}
          </div>
          <Button onClick={runFullAnalysis} disabled={loading} className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 h-auto shrink-0">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" />{hasData ? "Refresh Analysis" : "Run Full SEO Analysis"}</>
            )}
          </Button>
        </div>
      </div>

      {error && <div className="border border-red-200 bg-red-50 dark:bg-red-950/20 rounded-xl p-4 text-red-600 text-sm">{error}</div>}

      {loading && !hasData && (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          <span className="text-sm">{loadingProgress || "Starting..."}</span>
        </div>
      )}

      {!hasData && !loading && !error && (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground border rounded-xl">
          <Brain className="w-10 h-10 text-violet-300" />
          <p className="text-sm text-center max-w-md">
            Click &quot;Run Full SEO Analysis&quot; to analyze {AUTO_COMPETITORS.length} competitors and {AUTO_SEEDS.length} keyword topics. You&apos;ll see exactly what pages and articles to create.
          </p>
        </div>
      )}

      {hasData && (
        <>
          <div className="flex gap-1 border-b overflow-x-auto">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? "border-violet-600 text-violet-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                <tab.icon className="w-4 h-4" />{tab.label}
              </button>
            ))}
          </div>

          {activeTab === "overview" && <OverviewTab overview={overview} siteKeywords={siteKeywords} />}
          {activeTab === "gaps" && (
            <ContentGapsTab
              mergedGaps={mergedGaps} mergedGapsTotal={mergedGapsTotal}
              competitors={overview.competitors} selectedCompetitor={selectedCompetitor}
              onSelectCompetitor={(c) => { setSelectedCompetitor(c); fetchContentGaps(c); }}
              onShowMerged={() => { setSelectedCompetitor(""); setSingleGaps(null); }}
              singleGaps={singleGaps} singleGapsTotal={singleGapsTotal} loading={gapsLoading}
            />
          )}
          {activeTab === "research" && (
            <KeywordResearchTab
              mergedSuggestions={mergedSuggestions} mergedSuggestionsTotal={mergedSuggestionsTotal}
              seedKeyword={seedKeyword} onSeedChange={setSeedKeyword}
              onSearch={(kw) => { setSeedKeyword(kw); fetchKeywordSuggestions(kw); }}
              onShowMerged={() => { setSeedKeyword(""); setSingleSuggestions(null); }}
              singleSuggestions={singleSuggestions} singleSuggestionsTotal={singleSuggestionsTotal}
              loading={suggestionsLoading}
            />
          )}
        </>
      )}
    </div>
  );
}

// ====== Overview Tab ======

function OverviewTab({ overview, siteKeywords }: { overview: OverviewData; siteKeywords: KeywordSuggestion[] | null }) {
  const { rankedKeywords, competitors } = overview;
  const top10 = rankedKeywords.keywords.filter((k) => k.position <= 10).length;
  const top30 = rankedKeywords.keywords.filter((k) => k.position <= 30).length;
  const totalEtv = rankedKeywords.keywords.reduce((sum, k) => sum + k.etv, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Total Ranked" value={rankedKeywords.total.toLocaleString()} icon={<TrendingUp className="w-4 h-4 text-violet-600" />} />
        <StatBox label="Top 10" value={top10.toString()} icon={<Target className="w-4 h-4 text-emerald-600" />} color="emerald" />
        <StatBox label="Top 30" value={top30.toString()} icon={<BarChart3 className="w-4 h-4 text-blue-600" />} />
        <StatBox label="Est. Traffic" value={Math.round(totalEtv).toLocaleString()} icon={<Users className="w-4 h-4 text-amber-600" />} />
      </div>

      <div className="border rounded-xl overflow-hidden">
        <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/50">
          <h2 className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Your Ranked Keywords</h2>
        </div>
        {rankedKeywords.keywords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 dark:bg-slate-900/50 text-xs text-muted-foreground">
                <th className="text-left p-2 pl-3">Keyword</th><th className="text-right p-2">Pos</th><th className="text-right p-2">Vol</th>
                <th className="text-right p-2 hidden sm:table-cell">Diff</th><th className="text-right p-2 hidden md:table-cell">Intent</th>
                <th className="text-left p-2 pl-3 hidden lg:table-cell">URL</th>
              </tr></thead>
              <tbody className="divide-y">{rankedKeywords.keywords.map((kw) => (
                <tr key={kw.keyword} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                  <td className="p-2 pl-3 font-medium">{kw.keyword}</td>
                  <td className="p-2 text-right"><PositionBadge position={kw.position} /></td>
                  <td className="p-2 text-right">{kw.searchVolume.toLocaleString()}</td>
                  <td className="p-2 text-right hidden sm:table-cell"><DifficultyBadge difficulty={kw.difficulty} /></td>
                  <td className="p-2 text-right hidden md:table-cell"><IntentBadge intent={kw.intent} /></td>
                  <td className="p-2 pl-3 hidden lg:table-cell truncate max-w-48">
                    <a href={kw.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">{kw.url.replace("https://linkedgrow.ai", "")}</a>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="p-6 text-center text-muted-foreground">No rankings yet. Check Content Gaps and Keywords tabs for what to create!</p>}
      </div>

      <div className="border rounded-xl overflow-hidden">
        <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/50"><h2 className="font-semibold flex items-center gap-2"><Users className="w-4 h-4" /> Organic Competitors</h2></div>
        {competitors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 dark:bg-slate-900/50 text-xs text-muted-foreground">
                <th className="text-left p-2 pl-3">Domain</th><th className="text-right p-2">Shared</th><th className="text-right p-2">Total KW</th>
                <th className="text-right p-2 hidden sm:table-cell">Avg Pos</th><th className="text-right p-2 pr-3 hidden sm:table-cell">Traffic</th>
              </tr></thead>
              <tbody className="divide-y">{competitors.map((c) => (
                <tr key={c.domain} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                  <td className="p-2 pl-3 font-medium flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-muted-foreground" />{c.domain}</td>
                  <td className="p-2 text-right text-blue-600 font-medium">{c.sharedKeywords}</td>
                  <td className="p-2 text-right">{c.totalKeywords.toLocaleString()}</td>
                  <td className="p-2 text-right hidden sm:table-cell">{c.avgPosition.toFixed(1)}</td>
                  <td className="p-2 pr-3 text-right hidden sm:table-cell">{Math.round(c.estimatedTraffic).toLocaleString()}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="p-6 text-center text-muted-foreground">No auto-detected competitors yet. See Content Gaps tab.</p>}
      </div>

      <div className="border rounded-xl overflow-hidden">
        <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/50"><h2 className="font-semibold flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Site Keyword Opportunities</h2></div>
        {siteKeywords && siteKeywords.length > 0 ? <KeywordTable keywords={siteKeywords} /> : <p className="p-6 text-center text-muted-foreground">No site keywords yet. Use Keywords tab for topic research.</p>}
      </div>
    </div>
  );
}

// ====== Content Gaps Tab ======

function ContentGapsTab({ mergedGaps, mergedGapsTotal, competitors, selectedCompetitor, onSelectCompetitor, onShowMerged, singleGaps, singleGapsTotal, loading }: {
  mergedGaps: ContentGap[] | null; mergedGapsTotal: number; competitors: Competitor[];
  selectedCompetitor: string; onSelectCompetitor: (d: string) => void; onShowMerged: () => void;
  singleGaps: ContentGap[] | null; singleGapsTotal: number; loading: boolean;
}) {
  const autoDetected = competitors.map((c) => c.domain);
  const allCompetitors = [...autoDetected, ...KNOWN_COMPETITORS.filter((kc) => !autoDetected.includes(kc))];

  const displayGaps = selectedCompetitor && singleGaps ? singleGaps : mergedGaps;
  const displayTotal = selectedCompetitor && singleGaps ? singleGapsTotal : mergedGapsTotal;
  const isMerged = !selectedCompetitor || !singleGaps;

  return (
    <div className="space-y-6">
      {mergedGaps && mergedGaps.length > 0 && isMerged && (
        <div className="border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20 rounded-xl p-4">
          <p className="text-sm font-medium text-violet-700 dark:text-violet-400">
            {mergedGaps.length.toLocaleString()} unique keyword opportunities found across {AUTO_COMPETITORS.length} competitors.
            These are keywords competitors rank for that you don&apos;t - create pages/articles for them!
          </p>
        </div>
      )}

      <div className="border rounded-xl p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><Target className="w-4 h-4" /> Drill into a specific competitor (~$0.01)</h2>
        <div className="flex flex-wrap gap-2">
          {selectedCompetitor && (
            <Button variant="outline" size="sm" onClick={onShowMerged} className="text-violet-600 border-violet-300">
              Show all (merged)
            </Button>
          )}
          {allCompetitors.map((domain) => (
            <Button key={domain} variant={selectedCompetitor === domain ? "default" : "outline"} size="sm"
              onClick={() => onSelectCompetitor(domain)} disabled={loading}
              className={selectedCompetitor === domain ? "bg-violet-600 hover:bg-violet-700" : ""}>
              {domain}<ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ))}
        </div>
        <input type="text" placeholder="Or enter any domain..." className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
          onKeyDown={(e) => { if (e.key === "Enter") { const v = (e.target as HTMLInputElement).value.trim(); if (v) onSelectCompetitor(v); } }} />
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /><span>Analyzing {selectedCompetitor}...</span>
        </div>
      )}

      {displayGaps && !loading && (
        <div className="border rounded-xl overflow-hidden">
          <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/50">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {isMerged ? `Gaps vs ${AUTO_COMPETITORS.length} competitors` : `Gaps vs ${selectedCompetitor}`}
              <span className="text-xs font-normal text-muted-foreground ml-1">({displayTotal.toLocaleString()} total, {displayGaps.length} shown)</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Target high volume + low difficulty for quick wins</p>
          </div>
          {displayGaps.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 dark:bg-slate-900/50 text-xs text-muted-foreground">
                  <th className="text-left p-2 pl-3">Keyword</th><th className="text-right p-2">Volume</th><th className="text-right p-2">Difficulty</th>
                  <th className="text-right p-2 hidden sm:table-cell">Intent</th><th className="text-right p-2 hidden md:table-cell">CPC</th>
                  <th className="text-left p-2 pl-3 hidden lg:table-cell">Source</th>
                </tr></thead>
                <tbody className="divide-y">{displayGaps.map((gap) => (
                  <tr key={gap.keyword} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                    <td className="p-2 pl-3 font-medium">{gap.keyword}</td>
                    <td className="p-2 text-right font-medium text-blue-600">{gap.searchVolume.toLocaleString()}</td>
                    <td className="p-2 text-right"><DifficultyBadge difficulty={gap.difficulty} /></td>
                    <td className="p-2 text-right hidden sm:table-cell"><IntentBadge intent={gap.intent} /></td>
                    <td className="p-2 text-right text-muted-foreground hidden md:table-cell">${gap.cpc.toFixed(2)}</td>
                    <td className="p-2 pl-3 hidden lg:table-cell text-xs text-muted-foreground truncate max-w-40">{gap.source || selectedCompetitor}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p className="p-6 text-center text-muted-foreground">No gaps found. Try a different competitor.</p>}
        </div>
      )}
    </div>
  );
}

// ====== Keyword Research Tab ======

function KeywordResearchTab({ mergedSuggestions, mergedSuggestionsTotal, seedKeyword, onSeedChange, onSearch, onShowMerged, singleSuggestions, singleSuggestionsTotal, loading }: {
  mergedSuggestions: KeywordSuggestion[] | null; mergedSuggestionsTotal: number;
  seedKeyword: string; onSeedChange: (v: string) => void; onSearch: (kw: string) => void; onShowMerged: () => void;
  singleSuggestions: KeywordSuggestion[] | null; singleSuggestionsTotal: number; loading: boolean;
}) {
  const displaySuggestions = singleSuggestions || mergedSuggestions;
  const displayTotal = singleSuggestions ? singleSuggestionsTotal : mergedSuggestionsTotal;
  const isMerged = !singleSuggestions;

  return (
    <div className="space-y-6">
      {mergedSuggestions && mergedSuggestions.length > 0 && isMerged && (
        <div className="border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20 rounded-xl p-4">
          <p className="text-sm font-medium text-violet-700 dark:text-violet-400">
            {mergedSuggestions.length.toLocaleString()} unique keywords from {AUTO_SEEDS.length} topics.
            Each keyword is a potential page or article opportunity!
          </p>
        </div>
      )}

      <div className="border rounded-xl p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><Search className="w-4 h-4" /> Search a specific topic (~$0.01)</h2>
        <div className="flex gap-2">
          <input type="text" placeholder="Enter keyword topic..." value={seedKeyword}
            onChange={(e) => onSeedChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && seedKeyword.trim()) onSearch(seedKeyword); }}
            className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background" />
          <Button onClick={() => onSearch(seedKeyword)} disabled={loading || !seedKeyword.trim()} className="bg-violet-600 hover:bg-violet-700">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Quick search:</p>
          <div className="flex flex-wrap gap-1.5">
            {singleSuggestions && (
              <button onClick={onShowMerged} className="text-xs px-2.5 py-1 rounded-full border text-violet-600 border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30">
                Show all topics (merged)
              </button>
            )}
            {SEED_SUGGESTIONS.map((seed) => (
              <button key={seed} onClick={() => onSearch(seed)} disabled={loading}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  seedKeyword === seed ? "bg-violet-100 border-violet-300 text-violet-700 dark:bg-violet-900/30 dark:border-violet-700 dark:text-violet-400"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground"
                }`}>{seed}</button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /><span>Researching &quot;{seedKeyword}&quot;...</span>
        </div>
      )}

      {displaySuggestions && !loading && (
        <div className="border rounded-xl overflow-hidden">
          <div className="p-4 border-b bg-slate-50 dark:bg-slate-900/50">
            <h2 className="font-semibold flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              {isMerged ? `Keywords from ${AUTO_SEEDS.length} topics` : `Keywords for "${seedKeyword}"`}
              <span className="text-xs font-normal text-muted-foreground ml-1">({displayTotal.toLocaleString()} total, {displaySuggestions.length} shown)</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Target high volume + low difficulty for quick wins</p>
          </div>
          <KeywordTable keywords={displaySuggestions} />
        </div>
      )}
    </div>
  );
}

// ====== Shared Components ======

function KeywordTable({ keywords }: { keywords: KeywordSuggestion[] }) {
  if (!keywords.length) return <p className="p-6 text-center text-muted-foreground">No keywords found.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="bg-slate-50 dark:bg-slate-900/50 text-xs text-muted-foreground">
          <th className="text-left p-2 pl-3">Keyword</th><th className="text-right p-2">Volume</th><th className="text-right p-2">Difficulty</th>
          <th className="text-right p-2 hidden sm:table-cell">Competition</th><th className="text-right p-2 hidden md:table-cell">Intent</th>
          <th className="text-right p-2 pr-3 hidden md:table-cell">CPC</th>
        </tr></thead>
        <tbody className="divide-y">{keywords.map((kw) => (
          <tr key={kw.keyword} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
            <td className="p-2 pl-3 font-medium">{kw.keyword}</td>
            <td className="p-2 text-right font-medium text-blue-600">{kw.searchVolume.toLocaleString()}</td>
            <td className="p-2 text-right"><DifficultyBadge difficulty={kw.difficulty} /></td>
            <td className="p-2 text-right hidden sm:table-cell"><CompetitionBadge level={kw.competition} /></td>
            <td className="p-2 text-right hidden md:table-cell"><IntentBadge intent={kw.intent} /></td>
            <td className="p-2 pr-3 text-right text-muted-foreground hidden md:table-cell">${kw.cpc.toFixed(2)}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function StatBox({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color?: string }) {
  return (
    <div className={`border rounded-xl p-3 ${color === "emerald" ? "border-emerald-200 dark:border-emerald-800" : ""}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">{icon}{label}</div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function PositionBadge({ position }: { position: number }) {
  const color = position <= 3 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    : position <= 10 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    : position <= 30 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
  return <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${color}`}>#{position}</span>;
}

function DifficultyBadge({ difficulty }: { difficulty: number }) {
  const color = difficulty <= 30 ? "text-emerald-600" : difficulty <= 60 ? "text-amber-600" : "text-red-600";
  return <span className={`text-xs font-medium ${color}`}>{difficulty}</span>;
}

function IntentBadge({ intent }: { intent: string }) {
  const config: Record<string, { label: string; color: string }> = {
    informational: { label: "Info", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    navigational: { label: "Nav", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400" },
    commercial: { label: "Comm", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    transactional: { label: "Trans", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  };
  const { label, color } = config[intent] || { label: intent, color: "bg-slate-100 text-slate-600" };
  return <span className={`text-xs px-1.5 py-0.5 rounded ${color}`}>{label}</span>;
}

function CompetitionBadge({ level }: { level: string }) {
  const color = level === "LOW" ? "text-emerald-600" : level === "MEDIUM" ? "text-amber-600" : level === "HIGH" ? "text-red-600" : "text-muted-foreground";
  return <span className={`text-xs ${color}`}>{level}</span>;
}
