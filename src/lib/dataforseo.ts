// DataForSEO API client for keyword research, competitor analysis, and content gap discovery
// Docs: https://docs.dataforseo.com/v3/

const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN || "";
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD || "";

const API_BASE = "https://api.dataforseo.com/v3";

function getAuthHeader(): string {
  return `Basic ${Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString("base64")}`;
}

async function apiRequest<T>(endpoint: string, body: unknown[]): Promise<T> {
  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
    throw new Error("DataForSEO credentials not configured");
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DataForSEO API ${res.status}: ${text}`);
  }

  const data = await res.json();

  if (data.status_code !== 20000) {
    throw new Error(
      `DataForSEO error ${data.status_code}: ${data.status_message}`
    );
  }

  return data;
}

// Common types

interface KeywordInfo {
  search_volume: number | null;
  cpc: number | null;
  competition: number | null;
  competition_level: string | null;
}

interface KeywordProperties {
  keyword_difficulty: number | null;
}

interface SearchIntentInfo {
  main_intent: string | null;
}

// Response wrapper
interface DfsResponse<T> {
  status_code: number;
  status_message: string;
  tasks: {
    result: T[];
    status_code: number;
    status_message: string;
  }[];
}

// ====== 1. Ranked Keywords ======

export interface RankedKeyword {
  keyword: string;
  position: number;
  url: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  intent: string;
  etv: number;
}

interface RankedKeywordsResult {
  total_count: number;
  items: {
    keyword_data: {
      keyword: string;
      keyword_info: KeywordInfo;
      keyword_properties: KeywordProperties;
      search_intent_info: SearchIntentInfo;
    };
    ranked_serp_element: {
      serp_item: {
        rank_group: number;
        url: string;
        etv: number;
      };
    };
  }[];
}

export async function getRankedKeywords(
  domain: string,
  limit = 100
): Promise<{ total: number; keywords: RankedKeyword[] }> {
  const data = await apiRequest<DfsResponse<RankedKeywordsResult>>(
    "/dataforseo_labs/google/ranked_keywords/live",
    [
      {
        target: domain,
        location_code: 2840,
        language_code: "en",
        item_types: ["organic"],
        limit,
        order_by: ["keyword_data.keyword_info.search_volume,desc"],
        filters: [["ranked_serp_element.serp_item.rank_group", "<=", 100]],
      },
    ]
  );

  const result = data.tasks?.[0]?.result?.[0];
  if (!result?.items) return { total: 0, keywords: [] };

  return {
    total: result.total_count,
    keywords: result.items.map((item) => ({
      keyword: item.keyword_data.keyword,
      position: item.ranked_serp_element.serp_item.rank_group,
      url: item.ranked_serp_element.serp_item.url,
      searchVolume: item.keyword_data.keyword_info.search_volume || 0,
      difficulty: item.keyword_data.keyword_properties.keyword_difficulty || 0,
      cpc: item.keyword_data.keyword_info.cpc || 0,
      intent: item.keyword_data.search_intent_info.main_intent || "unknown",
      etv: item.ranked_serp_element.serp_item.etv || 0,
    })),
  };
}

// ====== 2. Competitors Discovery ======

export interface Competitor {
  domain: string;
  avgPosition: number;
  sharedKeywords: number;
  totalKeywords: number;
  estimatedTraffic: number;
}

interface CompetitorsResult {
  total_count: number;
  items: {
    domain: string;
    avg_position: number;
    intersections: number;
    metrics: {
      organic: {
        count: number;
        etv: number;
      };
    };
  }[];
}

export async function getCompetitors(
  domain: string,
  limit = 20
): Promise<Competitor[]> {
  const data = await apiRequest<DfsResponse<CompetitorsResult>>(
    "/dataforseo_labs/google/competitors_domain/live",
    [
      {
        target: domain,
        location_code: 2840,
        language_code: "en",
        item_types: ["organic"],
        limit,
        exclude_top_domains: true,
        order_by: ["metrics.organic.count,desc"],
      },
    ]
  );

  const result = data.tasks?.[0]?.result?.[0];
  if (!result?.items) return [];

  return result.items.map((item) => ({
    domain: item.domain,
    avgPosition: item.avg_position,
    sharedKeywords: item.intersections,
    totalKeywords: item.metrics.organic.count,
    estimatedTraffic: item.metrics.organic.etv,
  }));
}

// ====== 3. Content Gap Analysis ======

export interface ContentGap {
  keyword: string;
  competitorPosition: number;
  competitorUrl: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  intent: string;
  etv: number;
}

interface DomainIntersectionResult {
  total_count: number;
  items: {
    keyword_data: {
      keyword: string;
      keyword_info: KeywordInfo;
      keyword_properties: KeywordProperties;
      search_intent_info: SearchIntentInfo;
    };
    first_domain_serp_element: {
      rank_group: number;
      url: string;
      etv: number;
    };
  }[];
}

export async function getContentGaps(
  competitorDomain: string,
  ourDomain: string,
  limit = 200
): Promise<{ total: number; gaps: ContentGap[] }> {
  const data = await apiRequest<DfsResponse<DomainIntersectionResult>>(
    "/dataforseo_labs/google/domain_intersection/live",
    [
      {
        target1: competitorDomain,
        target2: ourDomain,
        location_code: 2840,
        language_code: "en",
        intersections: false,
        item_types: ["organic"],
        include_serp_info: true,
        limit,
        order_by: ["keyword_data.keyword_info.search_volume,desc"],
      },
    ]
  );

  const result = data.tasks?.[0]?.result?.[0];
  if (!result?.items) return { total: 0, gaps: [] };

  return {
    total: result.total_count,
    gaps: result.items.map((item) => ({
      keyword: item.keyword_data.keyword,
      competitorPosition: item.first_domain_serp_element.rank_group,
      competitorUrl: item.first_domain_serp_element.url,
      searchVolume: item.keyword_data.keyword_info.search_volume || 0,
      difficulty: item.keyword_data.keyword_properties.keyword_difficulty || 0,
      cpc: item.keyword_data.keyword_info.cpc || 0,
      intent: item.keyword_data.search_intent_info.main_intent || "unknown",
      etv: item.first_domain_serp_element.etv || 0,
    })),
  };
}

// ====== 4. Keyword Suggestions ======

export interface KeywordSuggestion {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: string;
  intent: string;
}

interface KeywordSuggestionsResult {
  total_count: number;
  seed_keyword_data: unknown;
  items: {
    keyword: string;
    keyword_info: KeywordInfo;
    keyword_properties: KeywordProperties;
    search_intent_info: SearchIntentInfo;
  }[];
}

export async function getKeywordSuggestions(
  seedKeyword: string,
  limit = 100
): Promise<{ total: number; suggestions: KeywordSuggestion[] }> {
  const data = await apiRequest<DfsResponse<KeywordSuggestionsResult>>(
    "/dataforseo_labs/google/keyword_suggestions/live",
    [
      {
        keyword: seedKeyword,
        location_code: 2840,
        language_code: "en",
        include_seed_keyword: true,
        include_serp_info: true,
        limit,
        order_by: ["keyword_info.search_volume,desc"],
      },
    ]
  );

  const result = data.tasks?.[0]?.result?.[0];
  if (!result?.items) return { total: 0, suggestions: [] };

  return {
    total: result.total_count,
    suggestions: result.items.map((item) => ({
      keyword: item.keyword,
      searchVolume: item.keyword_info.search_volume || 0,
      difficulty: item.keyword_properties.keyword_difficulty || 0,
      cpc: item.keyword_info.cpc || 0,
      competition: item.keyword_info.competition_level || "UNKNOWN",
      intent: item.search_intent_info.main_intent || "unknown",
    })),
  };
}

// ====== 5. Keywords For Site ======

export async function getKeywordsForSite(
  domain: string,
  limit = 200
): Promise<{ total: number; suggestions: KeywordSuggestion[] }> {
  const data = await apiRequest<DfsResponse<KeywordSuggestionsResult>>(
    "/dataforseo_labs/google/keywords_for_site/live",
    [
      {
        target: domain,
        location_code: 2840,
        language_code: "en",
        include_serp_info: true,
        limit,
        order_by: ["keyword_info.search_volume,desc"],
      },
    ]
  );

  const result = data.tasks?.[0]?.result?.[0];
  if (!result?.items) return { total: 0, suggestions: [] };

  return {
    total: result.total_count,
    suggestions: result.items.map((item) => ({
      keyword: item.keyword,
      searchVolume: item.keyword_info.search_volume || 0,
      difficulty: item.keyword_properties.keyword_difficulty || 0,
      cpc: item.keyword_info.cpc || 0,
      competition: item.keyword_info.competition_level || "UNKNOWN",
      intent: item.search_intent_info.main_intent || "unknown",
    })),
  };
}

// ====== Check if configured ======

export function isConfigured(): boolean {
  return !!(DATAFORSEO_LOGIN && DATAFORSEO_PASSWORD);
}
