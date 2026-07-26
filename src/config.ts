import "dotenv/config";

/**
 * One agent's configuration, assembled from the database.
 *
 * Plan section 7g: the shape is the outreach-agent's own Config, deliberately,
 * because every ported file already reads these field names. Keeping them means
 * envelope.ts, sequence.ts, miner.ts and actions.ts port with no edits to their
 * interiors, which is the whole point of the port map. What changes is where
 * the values come from: a row per agent instead of one JSON file per machine.
 */
export interface Config {
  /** Per-agent kill switch, checked before every sending action. */
  enabled: boolean;
  account: {
    label: string;
    /** The persistent Chrome profile for the LinkedIn account this agent sends from. */
    chromeProfileDir: string;
    timezone: string;
  };
  business: { url: string; description?: string };
  businessHours: { startHour: number; endHour: number; days: number[] };
  warmup: { startPerDay: number; incrementPerWeek: number; weeks: number };
  limits: { connectPerWeekMax: number; dmPerDayMax: number };
  delaysMs: { minAction: number; maxAction: number };
  sequence: { waitBetweenDmsDays: number };
  leads: {
    topics: string[];
    competitors: string[];
    hashtags: string[];
    icp: string;
    icpKeywords: string[];
    intentQueries: string[];
    jobChangeQueries?: string[];
    hiringQueries?: string[];
  };
  product: { name: string; senderName: string; valueProps: string[] };
}

/**
 * The identity behind a Config, which the single-tenant original had no need
 * for. Every query the worker runs carries both, per plan section 8e.
 */
export interface AgentContext {
  agentId: string;
  workspaceId: string;
  linkedinAccountId: string;
  /** Country of the address this account is pinned to. Never the address itself. */
  country: string;
  /** The ceiling belongs to the account, and its agents divide it. Section 5c. */
  accountDailyInviteCap: number;
  /** How many agents send from this account, so the split can be computed. */
  agentsOnAccount: number;
  warmupStartedAt: Date | null;
  reviewMode: boolean;
  cfg: Config;
}

export function optionalEnv(name: string): string | null {
  const v = process.env[name];
  return v && v.length > 0 ? v : null;
}

export function requireEnv(name: string): string {
  const v = optionalEnv(name);
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

/**
 * Defaults for anything the dashboard does not ask a customer about.
 *
 * The originals were tuned against the live site over months, so they are
 * copied rather than re-derived. connectPerWeekMax is the one number the
 * account's detected LinkedIn tier overrides.
 */
export const DEFAULTS = {
  businessHours: { startHour: 9, endHour: 18, days: [1, 2, 3, 4, 5] },
  warmup: { startPerDay: 5, incrementPerWeek: 5, weeks: 4 },
  limits: { connectPerWeekMax: 100, dmPerDayMax: 20 },
  delaysMs: { minAction: 40_000, maxAction: 120_000 },
  sequence: { waitBetweenDmsDays: 3 },
} as const;
