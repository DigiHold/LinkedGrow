"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Crosshair,
  Loader2,
  Plus,
  Search,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { StepRail } from "@/components/dashboard/step-rail";
import {
  Field,
} from "@/components/dashboard/ui/page";
import {
  LinkedInAccountsPanel,
  accountLabel,
  type LinkedInAccount as PanelAccount,
} from "@/components/dashboard/linkedin/accounts-panel";
import { cn } from "@/lib/utils";
import { RAMP } from "@/lib/agent-pace";

const STEPS = [
  { num: 1, label: "Your site" },
  { num: 2, label: "Where to look" },
  { num: 3, label: "Who to reach" },
  { num: 4, label: "Who sends" },
  { num: 5, label: "Check it" },
];

/** Section 7b, step 1. One to start with; more can be added later. */
const LEAD_SOURCES: {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  recommended?: boolean;
}[] = [
  {
    id: "buying_event",
    label: "High-intent signals",
    hint: "People showing buying signals right now.",
    icon: Zap,
    recommended: true,
  },
  {
    id: "market",
    label: "Lookalike audience",
    hint: "People who resemble the customers you already have.",
    icon: Users,
  },
  {
    id: "competitor",
    label: "Competitor engagement",
    hint: "People interacting with who you compete against.",
    icon: Crosshair,
  },
  {
    id: "linkedin_search",
    label: "A LinkedIn search",
    hint: "Work through a LinkedIn people search you already trust.",
    icon: Search,
  },
];

/** Section 7b, step 2: at least 4 signals, at most 15. */
const MIN_SIGNALS = 4;
const MAX_SIGNALS = 15;

/** The four shapes of "something just changed here", each searched differently. */
const BUYING_EVENTS = [
  {
    id: "jobchange",
    label: "Just changed role",
    hint: "Somebody who announced a new job in the last few months. New seat, new budget, new reasons to fix what they inherited.",
  },
  {
    id: "hiring",
    label: "Hiring for the work",
    hint: "A company posting for the role that owns your problem. They have admitted the gap in public.",
  },
  {
    id: "funding",
    label: "Just raised money",
    hint: "Somebody announcing their own round. The clearest budget signal there is, and founders post it themselves.",
  },
  {
    id: "event",
    label: "Going to an event",
    hint: "Somebody speaking at or attending something in your space, which is a room full of your market and a reason to write.",
  },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, h) => ({
  id: String(h),
  label: `${String(h).padStart(2, "0")}:00`,
}));

/** LinkedIn's own bands, so a customer picking these picks what the site shows. */
const COMPANY_SIZES = [
  "1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+",
];

const MATCH_LEVELS = [
  { id: "precision", label: "Precision", hint: "Fewer leads, closer fit" },
  { id: "balanced", label: "Balanced", hint: "The default" },
  { id: "volume", label: "Volume", hint: "More leads, looser fit" },
] as const;

const GOALS = [
  { id: "conversations", label: "Start conversations", hint: "Warm prospects, no pitch" },
  { id: "meetings", label: "Book calls", hint: "Qualified demos and sales calls" },
] as const;

const TONES = [
  { id: "professional", label: "Professional", hint: "Formal and polished" },
  { id: "conversational", label: "Conversational", hint: "Friendly and casual" },
  { id: "direct", label: "Direct", hint: "Bold and confident" },
] as const;

type LinkedInAccount = PanelAccount;

export function NewAgentWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accounts, setAccounts] = useState<LinkedInAccount[]>([]);

  const [website, setWebsite] = useState("");
  const [reading, setReading] = useState(false);
  const [readNote, setReadNote] = useState<string | null>(null);
  const [readFailed, setReadFailed] = useState(false);
  const [readStage, setReadStage] = useState(0);
  const [name, setName] = useState("");
  // Several sources at once, because the worker has always rotated through them two per pass and
  // only this screen insisted on one. An agent watching competitors AND buying signals AND a
  // lookalike search finds warm people three different ways, which is the point of having three.
  const [sources, setSources] = useState<string[]>(["buying_event"]);
  const [sourceTargets, setSourceTargets] = useState<Record<string, string>>({});
  // Which buying events count. Both on by default: they answer different questions and neither is
  // noisy on its own.
  const [buyingEvents, setBuyingEvents] = useState<string[]>(["jobchange", "hiring"]);

  const toggleSource = (id: string) =>
    setSources((current) =>
      current.includes(id) ? current.filter((s) => s !== id) : [...current, id]
    );
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [jobRoles, setJobRoles] = useState("");
  const [industries, setIndustries] = useState("");
  const [locations, setLocations] = useState("");
  const [matchLevel, setMatchLevel] = useState<string>("balanced");
  const [companySizes, setCompanySizes] = useState<string[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [smartLeadFinder, setSmartLeadFinder] = useState(true);
  const [companyInfo, setCompanyInfo] = useState("");
  const [goal, setGoal] = useState<string>("conversations");
  const [tone, setTone] = useState<string>("conversational");
  const [linkedinAccountId, setLinkedinAccountId] = useState("");
  const [skipConnected, setSkipConnected] = useState(true);
  const [reviewMode, setReviewMode] = useState(false);
  const [observeOnly, setObserveOnly] = useState(false);
  const [testRecipients, setTestRecipients] = useState("");
  // Monday to Saturday, nine to six, in the browser's own zone. All three were hardcoded in the
  // worker with nowhere to say otherwise.
  const [workdayDays, setWorkdayDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [workdayStart, setWorkdayStart] = useState(9);
  const [workdayEnd, setWorkdayEnd] = useState(18);
  const [timezone, setTimezone] = useState(
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Europe/Zurich"
  );
  const [customWarmup, setCustomWarmup] = useState(false);
  // Pre-filled with the envelope the worker actually applies (RAMP is the one
  // source both this screen and the agent page read), so the wizard can never
  // describe a different warm-up than the agent page shows.
  const [warmupStartPerDay, setWarmupStartPerDay] = useState<number>(RAMP.startPerDay);
  const [warmupIncrementPerWeek, setWarmupIncrementPerWeek] = useState<number>(RAMP.incrementPerWeek);
  const [warmupWeeks, setWarmupWeeks] = useState<number>(RAMP.weeks);

  /**
   * More topics, on demand.
   *
   * The site read already proposes some, but a customer who deleted the ones that did not fit had
   * no way to ask for others short of retyping the URL. Suggestions that are already in the list
   * are dropped rather than added twice.
   */
  const suggestMore = async () => {
    if (!website.trim() || suggesting) return;
    setSuggesting(true);
    try {
      const res = await fetch("/api/agents/analyze-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: website.trim() }),
      });
      const data = await res.json();
      if (!res.ok) return;
      const fresh: string[] = (data.signals ?? []).filter(
        (k: string) => !keywords.some((existing) => existing.toLowerCase() === k.toLowerCase())
      );
      if (fresh.length) setKeywords((current) => [...current, ...fresh].slice(0, MAX_SIGNALS));
    } finally {
      setSuggesting(false);
    }
  };

  const toggleDay = (d: number) =>
    setWorkdayDays((current) =>
      current.includes(d) ? current.filter((x) => x !== d) : [...current, d].sort()
    );

  // Reads the customer's own site and proposes the targeting, so the first
  // agent starts from what the business actually sells rather than a blank field.
  const readWebsite = async (value: string) => {
    const address = value.trim();
    if (!address || reading) return;
    setReading(true);
    setReadNote(null);
    setReadFailed(false);
    setReadStage(0);
    setError(null);
    // The request takes a handful of seconds and a bare spinner reads as a
    // freeze. These three lines are what the route actually does, in order.
    const stages = [
      setTimeout(() => setReadStage(1), 1200),
      setTimeout(() => setReadStage(2), 4000),
    ];
    try {
      const res = await fetch("/api/agents/analyze-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website: address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not read that site");
      if (data.companyInfo) setCompanyInfo(data.companyInfo);
      else if (data.icpSummary) setCompanyInfo(data.icpSummary);
      if (data.jobRoles?.length) setJobRoles(data.jobRoles.join(", "));
      if (data.industries?.length) setIndustries(data.industries.join(", "));
      if (data.signals?.length) setKeywords(data.signals.slice(0, 8));
      if (data.companySizes?.length) setCompanySizes(data.companySizes);
      if (!name.trim() && data.jobRoles?.length) setName(data.jobRoles[0]);
      setReadNote(
        "Read. The next steps are filled in from your site. Change anything that is off.",
      );
      // A successful read means the next steps are already filled, so the
      // wizard moves on by itself rather than asking for another click.
      setStep(2);
    } catch (e) {
      setReadFailed(true);
      setReadNote(e instanceof Error ? e.message : "Could not read that site");
    } finally {
      stages.forEach(clearTimeout);
      setReading(false);
      setReadStage(0);
    }
  };

  // A visitor who typed their site on the home lands here with it in the URL,
  // so the reading starts on its own and the first screen is already filled.
  useEffect(() => {
    const fromHome = new URLSearchParams(window.location.search).get("website");
    if (!fromHome) return;
    setWebsite(fromHome);
    void readWebsite(fromHome);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The panel below owns the list it shows. The wizard keeps its own copy for
  // one job, naming the picked account on the summary step, and refreshes it
  // whenever the panel connects or disconnects one.
  const loadAccounts = useCallback(() => {
    fetch("/api/linkedin/accounts")
      .then((r) => (r.ok ? r.json() : { accounts: [] }))
      .then((d) => {
        const list: LinkedInAccount[] = d.accounts ?? [];
        setAccounts(list);
        setLinkedinAccountId((current) => {
          if (current && list.some((a) => a.id === current)) return current;
          return list.length === 1 ? list[0].id : "";
        });
      })
      .catch(() => setAccounts([]));
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const addKeyword = useCallback(() => {
    const value = keywordDraft.trim();
    if (!value || keywords.length >= MAX_SIGNALS) return;
    if (keywords.some((k) => k.toLowerCase() === value.toLowerCase())) return;
    setKeywords((prev) => [...prev, value]);
    setKeywordDraft("");
  }, [keywordDraft, keywords]);

  // Suggestions for the one field a beginner can stall on. They come from what
  // the customer already gave us, the sectors and the titles, so they are never
  // invented: a blank field with a "four minimum" rule is where people leave.
  const topicIdeas = (() => {
    if (keywords.length >= MIN_SIGNALS) return [];
    const taken = new Set(keywords.map((k) => k.toLowerCase()));
    const pool = [...splitList(industries), ...splitList(jobRoles)];
    return pool
      .map((v) => v.trim())
      .filter((v) => v && !taken.has(v.toLowerCase()))
      .slice(0, 6);
  })();

  // What each step needs before it will let you move on. Kept in one place so
  // the button and the hint under it can never disagree.
  const blocker = (() => {
    if (step === 5 && !name.trim()) return "Give the agent a name.";
    if (step === 3 && keywords.length < MIN_SIGNALS)
      return `Add at least ${MIN_SIGNALS} signals. You have ${keywords.length}.`;
    if (step === 4 && !linkedinAccountId) return "Pick the account that sends.";
    return null;
  })();

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          website: website.trim() || null,
          linkedinAccountId,
          icpSummary: companyInfo.trim() || null,
          jobRoles: splitList(jobRoles),
          industries: splitList(industries),
          locations: splitList(locations),
          matchLevel,
          goal,
          tone,
          companyInfo: companyInfo.trim() || null,
          skipConnected,
          reviewMode,
          observeOnly,
          testRecipients: testRecipients
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
          smartLeadFinder,
          companySizes,
          timezone,
          workdayDays,
          workdayStart: workdayStart * 60,
          workdayEnd: workdayEnd * 60,
          ...(customWarmup
            ? { warmupStartPerDay, warmupIncrementPerWeek, warmupWeeks }
            : {}),
          sources: [
            // One row per thing named, because "Gojiberry, Taplio" is two competitors
            // rather than one company with a comma in its name.
            ...sources.flatMap((id) => {
              if (id === "buying_event") {
                // One row per kind, so switching one off simply removes its row.
                return buyingEvents.map((kind) => ({
                  type: "buying_event",
                  label: BUYING_EVENTS.find((e) => e.id === kind)?.label ?? kind,
                  config: { kind },
                }));
              }
              const target = (sourceTargets[id] ?? "").trim();
              if (!target) return [{ type: id, label: labelForSource(id) }];
              return target
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
                .map((label) => ({ type: id, label }));
            }),
            ...keywords.map((k) => ({ type: "keyword", label: k })),
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // No subscription: the first step is the checkout, not an error.
        if (data?.needsCheckout) {
          router.push("/dashboard/upgrade");
          return;
        }
        throw new Error(data.error || "Could not create the agent");
      }
      router.push(`/dashboard/agents/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the agent");
      setSaving(false);
    }
  };

  return (
    // Creating the first agent is the one screen that earns a room of its own:
    // no sidebar, no topbar, nothing to click that is not the next step. The
    // surface sits above the dashboard chrome rather than fighting the layout.
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white dark:bg-background">
      <div className="mx-auto w-full max-w-[960px] px-6 pb-24 pt-8 sm:pt-12">
        <div className="flex justify-end">
          <Link href="/dashboard/agents">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Leave
            </Button>
          </Link>
        </div>

        {/* The rail gets the full width so all five steps stay readable; the
            form below stays narrow, which is what makes it easy to fill. */}
        <StepRail
          steps={STEPS}
          current={step}
          onSelect={(n) => setStep(n)}
          className="mt-2 justify-center"
        />

        <div className="mx-auto w-full max-w-[620px]">

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {step === 1 && (
        <StepBody
          title="Start with your website"
          lead="We read your home page once and fill the next steps for you. You change anything that is wrong."
        >
          <Field
            label="Your website"
            hint="The home page only. Nothing from it is ever published."
          >
            <div className="flex items-center gap-2">
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void readWebsite(website);
                  }
                }}
                placeholder="yourcompany.com"
                maxLength={300}
                disabled={reading}
              />
              <Button
                type="button"
                disabled={reading || !website.trim()}
                onClick={() => void readWebsite(website)}
                className="flex-none"
              >
                {reading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reading...
                  </>
                ) : (
                  "Read my site"
                )}
              </Button>
            </div>
          </Field>

          {reading && (
            <ol className="mt-5 space-y-3">
              {[
                `Opening ${website.trim().replace(/^https?:\/\//i, "").split("/")[0]}`,
                "Reading the page",
                "Working out who buys from you",
              ].map((line, i) => (
                <li key={line} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 flex-none items-center justify-center">
                    {i < readStage ? (
                      <Check className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    ) : i === readStage ? (
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-600 dark:text-cyan-400" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
                    )}
                  </span>
                  <span
                    className={
                      i <= readStage
                        ? "text-sm text-slate-900 dark:text-white"
                        : "text-sm text-slate-400 dark:text-slate-500"
                    }
                  >
                    {line}
                  </span>
                </li>
              ))}
            </ol>
          )}

          {readNote && !reading && (
            <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-sm text-foreground">{readNote}</p>
              {readFailed && (
                <p className="mt-1 text-sm text-muted-foreground">
                  You can still set everything up by hand. Continue and fill the next steps yourself.
                </p>
              )}
            </div>
          )}

          <p className="mt-6 text-sm text-muted-foreground">
            No site to hand? Continue and fill the steps yourself. Nothing here is locked.
          </p>
        </StepBody>
      )}

      {step === 2 && (
        <StepBody
          title="Where should it look for people?"
          lead="Pick as many as you like. The agent works through them in turn, so more sources means warmer people found more ways."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {LEAD_SOURCES.map((s) => (
              <OptionCard
                key={s.id}
                picked={sources.includes(s.id)}
                onClick={() => toggleSource(s.id)}
                icon={s.icon}
                label={s.label}
                hint={s.hint}
                badge={s.recommended ? "Start here" : undefined}
              />
            ))}
          </div>

          {/*
            The target for the source, which the wizard never used to ask for.
            It sent the label of the button as the thing to look for, so picking
            "Competitor engagement" made the agent search LinkedIn for a company
            called Competitor engagement and find nobody.
          */}
          {sources.includes("buying_event") && (
            <div className="mt-6">
              <Field
                label="Which moments count?"
                hint="These are searched by the job titles and industries you give on the next step, so there is nothing else to fill in."
              >
                <div className="space-y-2">
                  {BUYING_EVENTS.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      aria-pressed={buyingEvents.includes(e.id)}
                      onClick={() =>
                        setBuyingEvents((current) =>
                          current.includes(e.id)
                            ? current.filter((x) => x !== e.id)
                            : [...current, e.id]
                        )
                      }
                      className={cn(
                        "block w-full rounded-xl border p-3 text-left transition-colors",
                        buyingEvents.includes(e.id)
                          ? "border-cyan-500 bg-cyan-50/60 dark:border-cyan-400/60 dark:bg-cyan-400/10"
                          : "border-border hover:border-slate-300 dark:hover:border-white/20"
                      )}
                    >
                      <span className="block text-[14px] font-medium text-slate-900 dark:text-white">
                        {e.label}
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                        {e.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {sources.map((id) =>
            SOURCE_TARGET[id] ? (
              <div className="mt-6" key={id}>
                <Field label={SOURCE_TARGET[id]!.label} hint={SOURCE_TARGET[id]!.hint}>
                  <Input
                    value={sourceTargets[id] ?? ""}
                    onChange={(e) =>
                      setSourceTargets((current) => ({ ...current, [id]: e.target.value }))
                    }
                    placeholder={SOURCE_TARGET[id]!.placeholder}
                  />
                </Field>
              </div>
            ) : null
          )}

        </StepBody>
      )}

      {step === 3 && (
        <StepBody
          title="Who should it contact?"
          lead="Topics tell it what to watch for. Filters narrow down who counts."
        >
          <div className="space-y-8">
            <Group
              title={`Topics ${keywords.length}/${MAX_SIGNALS}`}
              hint={`What your buyers post about. Add at least ${MIN_SIGNALS} so it has enough to watch.`}
            >
            <div>
              <div className="flex gap-2">
                <Input
                  value={keywordDraft}
                  onChange={(e) => setKeywordDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addKeyword();
                    }
                  }}
                  placeholder="gdpr cookie consent"
                  maxLength={80}
                />
                <Button
                  variant="outline"
                  onClick={addKeyword}
                  disabled={!keywordDraft.trim() || keywords.length >= MAX_SIGNALS}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
                {website.trim() && (
                  <Button
                    variant="outline"
                    onClick={suggestMore}
                    disabled={suggesting || keywords.length >= MAX_SIGNALS}
                  >
                    {suggesting ? "Reading..." : "Suggest more"}
                  </Button>
                )}
              </div>
              {topicIdeas.length > 0 && (
                <div className="mt-3">
                  <p className="text-[13px] text-slate-500 dark:text-slate-400">
                    From what you told us, tap to add:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {topicIdeas.map((idea) => (
                      <button
                        key={idea}
                        type="button"
                        onClick={() =>
                          setKeywords((prev) =>
                            prev.length >= MAX_SIGNALS ? prev : [...prev, idea],
                          )
                        }
                        className="rounded-full border border-border px-3 py-1.5 text-[13px] text-slate-600 transition-colors hover:border-blue-500 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
                      >
                        + {idea}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {keywords.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {keywords.map((k) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border py-1 pl-3 pr-1.5 text-sm text-slate-600 dark:text-slate-300"
                    >
                      {k}
                      <button
                        type="button"
                        onClick={() => setKeywords((p) => p.filter((x) => x !== k))}
                        className="rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
                        aria-label={`Remove ${k}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            </Group>

            <Group title="Filters" hint="Leave a field empty to accept everyone.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Job titles" hint="Comma separated. Leave empty for any.">
                <Input
                  value={jobRoles}
                  onChange={(e) => setJobRoles(e.target.value)}
                  placeholder="Founder, Head of Growth"
                />
              </Field>
              <Field label="Industries" hint="Comma separated.">
                <Input
                  value={industries}
                  onChange={(e) => setIndustries(e.target.value)}
                  placeholder="SaaS, Agencies"
                />
              </Field>
            </div>

            <Field
              label="Locations"
              hint="Comma separated. Countries or cities. Leave empty to target any country."
            >
              <Input
                value={locations}
                onChange={(e) => setLocations(e.target.value)}
                placeholder="Switzerland, France"
              />
            </Field>

            <Field
              label="Company size"
              hint="Leave all off for any size. It guides the judgement rather than filtering hard, because LinkedIn headcounts are often wrong or missing."
            >
              <div className="flex flex-wrap gap-2">
                {COMPANY_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={companySizes.includes(size)}
                    onClick={() =>
                      setCompanySizes((current) =>
                        current.includes(size)
                          ? current.filter((s) => s !== size)
                          : [...current, size]
                      )
                    }
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                      companySizes.includes(size)
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "border border-border text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Match level" hint="How strictly a lead has to fit before the agent takes it.">
              <Segmented
                options={MATCH_LEVELS}
                value={matchLevel}
                onChange={setMatchLevel}
              />
            </Field>
            </Group>

            <Group title="When it works">
              <Field
                label="Days"
                hint="Nothing goes out on the days you leave off. Weekends are quieter on LinkedIn but far from dead, so Saturday is on by default."
              >
                <div className="flex flex-wrap gap-2">
                  {DAY_NAMES.map((label, day) => (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={workdayDays.includes(day)}
                      onClick={() => toggleDay(day)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                        workdayDays.includes(day)
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                          : "border border-border text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field
                label="Hours"
                hint="An invitation at three in the morning is the kind of thing that gets an account looked at. Local to the timezone below."
              >
                <div className="flex items-center gap-3">
                  <HourPicker value={workdayStart} onChange={setWorkdayStart} />
                  <span className="text-[13px] text-slate-500 dark:text-slate-400">to</span>
                  <HourPicker value={workdayEnd} onChange={setWorkdayEnd} />
                </div>
              </Field>

              <Field label="Timezone" hint="Taken from this browser. Change it if the account belongs somewhere else.">
                <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
              </Field>
            </Group>

            <Group title="Warm-up">
              <Toggle
                checked={customWarmup}
                onChange={setCustomWarmup}
                label="Set my own warm-up limits"
                hint={`Leave this off unless you know why you are turning it on. The default starts at ${RAMP.startPerDay} invitations a day and climbs by ${RAMP.incrementPerWeek} each week for ${RAMP.weeks} weeks, then holds steady.`}
              />
              {customWarmup && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                    <p className="text-[13px] leading-relaxed text-amber-900 dark:text-amber-200">
                      <span className="font-semibold">Worth knowing.</span>{" "}
                      LinkedIn restricts accounts that suddenly send far more than they used to,
                      and a restriction can be permanent. The ramp exists to avoid that.
                    </p>
                  </div>
                  <Field label="Invitations a day, to begin with" hint={`The default is ${RAMP.startPerDay}.`}>
                    <Input
                      inputMode="numeric"
                      value={String(warmupStartPerDay)}
                      onChange={(e) => setWarmupStartPerDay(Number(e.target.value.replace(/\D/g, "")) || 1)}
                    />
                  </Field>
                  <Field label="Added each week" hint={`The default is ${RAMP.incrementPerWeek}.`}>
                    <Input
                      inputMode="numeric"
                      value={String(warmupIncrementPerWeek)}
                      onChange={(e) => setWarmupIncrementPerWeek(Number(e.target.value.replace(/\D/g, "")) || 0)}
                    />
                  </Field>
                  <Field label="Weeks of ramp" hint={`The default is ${RAMP.weeks}, after which it holds steady.`}>
                    <Input
                      inputMode="numeric"
                      value={String(warmupWeeks)}
                      onChange={(e) => setWarmupWeeks(Number(e.target.value.replace(/\D/g, "")) || 1)}
                    />
                  </Field>
                </div>
              )}
            </Group>

            <Group title="Volume">
              <Toggle
                checked={observeOnly}
                onChange={setObserveOnly}
                label="Watch it work before it sends anything"
                hint="The agent signs in and collects leads, and touches nothing on your account. No likes, no invitations, no messages. Turn it off when you are happy with what it finds."
              />
              <Toggle
                checked={smartLeadFinder}
                onChange={setSmartLeadFinder}
                label="Keep looking when the topics run dry"
                hint="Without this the agent runs out of people and looks broken."
              />
              <Field
                label="Only contact these people"
                hint="For trying it out. Paste one or more LinkedIn profile URLs, comma separated, and the agent will find everyone as usual but only ever write to these. Leave empty to contact everyone it finds."
              >
                <Input
                  value={testRecipients}
                  onChange={(e) => setTestRecipients(e.target.value)}
                  placeholder="https://www.linkedin.com/in/your-profile/"
                />
              </Field>
            </Group>
          </div>
        </StepBody>
      )}

      {step === 4 && (
        <StepBody
          title="Who sends, and what it says"
          lead="Nothing is sent yet. You decide at the end whether to start it."
        >
          <div className="space-y-8">
            <Group title="Who sends">
            <Field
              label="Sending account"
              hint="The profile this agent works from. You can point it at another one later, from the agent's own settings."
            >
              {/* Connecting happens here rather than on a settings page, so
                  nobody has to leave the wizard halfway through and find
                  their way back. */}
              <LinkedInAccountsPanel
                emptyHint="No LinkedIn account connected yet. Connect the profile you want this agent to work from."
                mode="pick"
                onChanged={loadAccounts}
                onSelect={setLinkedinAccountId}
                selectedId={linkedinAccountId}
              />
            </Field>

            </Group>

            <Group title="What the messages say">
            <Field
              label="What you sell"
              hint="The messages are written from this. Say who you help and with what."
            >
              <Textarea
                value={companyInfo}
                onChange={(e) => setCompanyInfo(e.target.value)}
                placeholder="LinkedGrow finds leads on LinkedIn and writes the outreach, for founders who sell to other businesses."
                className="min-h-24"
                maxLength={4000}
              />
            </Field>

            <Field label="Goal" hint="What a good outcome looks like for this agent.">
              <div className="grid gap-3 sm:grid-cols-2">
                {GOALS.map((g) => (
                  <SelectCard
                    key={g.id}
                    picked={goal === g.id}
                    onClick={() => setGoal(g.id)}
                    label={g.label}
                    hint={g.hint}
                  />
                ))}
              </div>
            </Field>

            <Field label="Tone" hint="How the messages should sound.">
              <Segmented options={TONES} value={tone} onChange={setTone} />
            </Field>
            </Group>

            <Group title="Rules">

            <Toggle
              checked={skipConnected}
              onChange={setSkipConnected}
              label="Skip people I am already connected to"
              hint="A cold message to someone who already knows you reads badly."
            />
            <Toggle
              checked={reviewMode}
              onChange={setReviewMode}
              label="Review each contact before anything is sent"
              hint="Slower, but you see every message before it goes."
            />
            </Group>
          </div>
        </StepBody>
      )}

      {step === 5 && (
        <StepBody
          title="Check it, then create it"
          lead="Everything here can be changed afterwards."
        >
            <Field
              label="Name it"
              hint="Only you see this. Name it after who it targets."
            >
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="SaaS founders"
                maxLength={80}
              />
            </Field>

          <dl className="divide-y divide-border">
              <SummaryRow label="Name" value={name || "Not set"} />
              <SummaryRow
                label={sources.length > 1 ? "Lead sources" : "Lead source"}
                value={
                  sources
                    .map((id) => {
                      const target = (sourceTargets[id] ?? "").trim();
                      return target ? `${labelForSource(id)} (${target})` : labelForSource(id);
                    })
                    .join(", ") || "None"
                }
              />
              <SummaryRow label="Topics" value={keywords.join(", ") || "None"} />
              <SummaryRow label="Job titles" value={jobRoles || "Any"} />
              <SummaryRow label="Industries" value={industries || "Any"} />
              <SummaryRow label="Locations" value={locations || "Anywhere"} />
              <SummaryRow label="Company size" value={companySizes.join(", ") || "Any"} />
              <SummaryRow
                label="Match level"
                value={MATCH_LEVELS.find((m) => m.id === matchLevel)?.label ?? ""}
              />
              <SummaryRow
                label="Sending account"
                value={(() => {
                  const picked = accounts.find((a) => a.id === linkedinAccountId);
                  return picked ? accountLabel(picked) : "Not picked";
                })()}
              />
              <SummaryRow label="Goal" value={GOALS.find((g) => g.id === goal)?.label ?? ""} />
              <SummaryRow label="Tone" value={TONES.find((t) => t.id === tone)?.label ?? ""} />
              <SummaryRow
                label="Review each contact"
                value={reviewMode ? "Yes" : "No"}
              />
          </dl>

          <div className="mt-6 border-t border-border pt-6">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500">
              What happens next
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              <li>
                The agent is created paused. It does nothing until you start it.
              </li>
              <li>
                A new LinkedIn account warms up for a month before it works at
                full pace, which is what keeps it safe.
              </li>
              <li>
                Replies land in your inbox here, and you can pause or change
                anything at any time.
              </li>
            </ul>
          </div>
        </StepBody>
      )}

      <div className="mt-8 flex flex-col items-center gap-3 border-t border-border pt-6 sm:flex-row sm:justify-center">
        {step < 5 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!!blocker}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={saving || !!blocker}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Create it, paused
              </>
            )}
          </Button>
        )}
        {step > 1 && (
          <Button variant="ghost" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
        {blocker && (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">{blocker}</p>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** A titled block inside a step, separated by a rule from the one above. */
function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-border pt-6 first:border-t-0 first:pt-0">
      <div>
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500">
          {title}
        </h3>
        {hint && (
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
            {hint}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

/** Three mutually exclusive choices do not need three cards. */
/** Twenty-four options is too many for the segmented control, and a native select is what a phone
 *  renders best anyway. */
function HourPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-slate-900 dark:bg-slate-900 dark:text-white"
    >
      {HOURS.map((h) => (
        <option key={h.id} value={h.id}>
          {h.label}
        </option>
      ))}
    </select>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: readonly { id: string; label: string; hint: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-white/5">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={value === o.id}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              value === o.id
                ? "bg-white text-slate-900 shadow-xs dark:bg-white/10 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">
        {options.find((o) => o.id === value)?.hint}
      </p>
    </div>
  );
}

/**
 * A step: its question as a real heading outside any card, then the content.
 *
 * The first draft put everything inside one white panel at the same visual
 * level, so the question, the decision and an admin text field all read as
 * equally important. The heading now sits on the page and the card holds only
 * what you act on.
 */
function StepBody({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-10">
      <h2 className="text-center text-[26px] font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">
        {title}
      </h2>
      {lead && (
        <p className="mx-auto mt-3 max-w-[46ch] text-center text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
          {lead}
        </p>
      )}
      <div className="mt-8 space-y-6">{children}</div>
    </div>
  );
}

/** A choice with an icon, so four options are scannable at a glance. */
function OptionCard({
  picked,
  onClick,
  icon: Icon,
  label,
  hint,
  badge,
}: {
  picked: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  hint: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={picked}
      className={cn(
        "flex gap-3 rounded-xl border p-4 text-left transition-colors",
        picked
          ? "border-cyan-500 bg-cyan-50/60 dark:border-cyan-400/60 dark:bg-cyan-400/10"
          : "border-border hover:border-slate-300 dark:hover:border-white/20"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          picked
            ? "bg-cyan-500 text-white"
            : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"
        )}
      >
        {picked ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="text-[15px] font-medium text-slate-900 dark:text-white">
            {label}
          </span>
          {badge && !picked && (
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {hint}
        </span>
      </span>
    </button>
  );
}

/**
 * What each source has to be pointed at before it can find anybody.
 *
 * High-intent signals is absent on purpose: it watches for role changes and hiring posts among the
 * roles and industries already given on the next step, so there is nothing extra to ask.
 */
const SOURCE_TARGET: Record<string, { label: string; hint: string; placeholder: string } | undefined> = {
  competitor: {
    label: "Which competitors?",
    hint: "Company names or their LinkedIn page URLs, comma separated. The agent reads their recent posts and takes the people who commented or reacted, skipping anyone who works there.",
    placeholder: "Gojiberry, Taplio",
  },
  market: {
    label: "Describe the customers you already have",
    hint: "In your own words. The agent turns this into searches and looks for people who talk like them.",
    placeholder: "Small agencies building ecommerce sites for local brands on WordPress",
  },
  linkedin_search: {
    label: "Paste the search",
    hint: "A LinkedIn people search URL, or simply the words you would type into the search box. A Sales Navigator list will not work: it hides the public profile addresses the agent needs, and every filter it offers exists in the ordinary search.",
    placeholder: "https://www.linkedin.com/search/results/content/?keywords=...",
  },
};

function labelForSource(id: string) {
  return LEAD_SOURCES.find((s) => s.id === id)?.label ?? id;
}

function splitList(value: string) {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function SelectCard({
  picked,
  onClick,
  label,
  hint,
  badge,
}: {
  picked: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={picked}
      className={cn(
        "rounded-xl border p-4 text-left transition-colors",
        picked
          ? "border-cyan-500 bg-cyan-50/60 dark:border-cyan-400/60 dark:bg-cyan-400/10"
          : "border-border hover:border-slate-300 dark:hover:border-white/20"
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-[15px] font-medium text-slate-900 dark:text-white">
          {label}
        </span>
        {picked ? (
          <Check className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
        ) : badge ? (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
            {badge}
          </span>
        ) : null}
      </span>
      {hint && (
        <span className="mt-1 block text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {hint}
        </span>
      )}
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:border-slate-300 dark:hover:border-white/20"
    >
      <span
        className={cn(
          "mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
          checked ? "bg-cyan-500" : "bg-slate-200 dark:bg-white/10"
        )}
      >
        <span
          className={cn(
            "h-4 w-4 rounded-full bg-white transition-transform",
            checked && "translate-x-4"
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-medium text-slate-900 dark:text-white">
          {label}
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {hint}
        </span>
      </span>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-44 shrink-0 text-[13px] text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="min-w-0 text-[15px] text-slate-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}
