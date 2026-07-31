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
  /** False lets the agent prospect people the account is already connected to. */
  skipConnected: boolean;
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
  /** Null when the agent has never run, which is the pass the customer watches. */
  lastRunAt: Date | null;
  warmupStartedAt: Date | null;
  reviewMode: boolean;
  /**
   * Read LinkedIn, write nothing to it.
   *
   * The agent signs in, mines, scores and queues leads, and fills the activity feed exactly as it
   * normally would. It never likes a post, never sends an invitation, never sends a message.
   *
   * This exists because the only honest way to find out whether the automation works is to run it
   * against the live site, and the only safe way to do that is with the writes switched off.
   * reviewMode does not cover it: that queues messages for approval and still sends invitations.
   */
  /**
   * How strictly a lead has to fit before the agent takes it.
   *
   * precision keeps only people the model agrees are a fit, volume keeps anyone whose headline
   * matches the roles, balanced sits between. It was offered in the wizard from the start and read
   * by nothing, so every agent ran at balanced whatever the customer chose.
   */
  matchLevel: "precision" | "balanced" | "volume";
  /** How the messages should sound. Same story: asked for, stored, and never reaching the writer. */
  tone: "professional" | "conversational" | "direct";
  /** Whether existing connections stay out of the campaign. */
  skipConnected: boolean;
  /** Company sizes the customer named, used by the fit judge rather than as a hard filter. */
  companySizes: string[];
  observeOnly: boolean;
  /**
   * Messages the customer wrote by hand, keyed by relationship step.
   *
   * Present means sent word for word with {name}, {company} and {jobTitle}
   * filled in, and no model call for that step. Absent means the agent writes
   * that one itself, for each person, as it always has.
   */
  templates: Record<string, string>;
  /**
   * When set, the only profiles this agent may like, invite or message.
   *
   * Everything else runs normally and every other lead is queued and visible, simply never
   * contacted. It is how the messages get proven on a real account without a stranger receiving
   * one, and it is the honest alternative to testing from a fabricated profile.
   *
   * Empty means no restriction, which is the normal state.
   */
  testRecipients: string[];
  /**
   * Who the messages are from. The relationship steps write as a named person
   * rather than as a company, so the first name is not optional: a message
   * signed with nothing reads as software.
   */
  sender: {
    firstName: string;
    /** Only used at the ask step. */
    companyInfo: string;
    /** So small talk can be answered honestly rather than dodged. */
    location: string;
  };
  /**
   * What the customer picked in the wizard, and the only thing that changes
   * between the two: how the last message closes.
   *
   * Everything before the ask is identical on purpose. Gong scored 304,174
   * emails on meetings booked within ten days, and at the cold stage an
   * interest close won 47% against 27% for one naming a day and time. So an
   * agent told to book calls must not ask for one earlier; it has to earn the
   * reply first, exactly like the other one, and spend it differently at the
   * end.
   */
  goal: "conversations" | "meetings";
  /** Their site, read once to work out what to search for when they did not say. */
  website: string;
  /**
   * The wizard toggle reading "Keep looking when the topics run dry", hinted with "Without this
   * the agent runs out of people and looks broken". On by default, and unread until now.
   */
  smartLeadFinder: boolean;
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
  // Monday to Saturday: plenty of the people this sells to work then, and an agent idle two
  // days out of seven reads as broken to somebody paying by the month.
  businessHours: { startHour: 9, endHour: 18, days: [1, 2, 3, 4, 5, 6] },
  warmup: { startPerDay: 5, incrementPerWeek: 5, weeks: 4 },
  limits: { connectPerWeekMax: 100, dmPerDayMax: 20 },
  delaysMs: { minAction: 40_000, maxAction: 120_000 },
  sequence: { waitBetweenDmsDays: 3 },
} as const;
