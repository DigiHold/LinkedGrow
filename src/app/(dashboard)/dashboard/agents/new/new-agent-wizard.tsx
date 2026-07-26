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
  PageShell,
  PageHeader,
  Field,
} from "@/components/dashboard/ui/page";
import { cn } from "@/lib/utils";

const STEPS = [
  { num: 1, label: "Sources" },
  { num: 2, label: "Target" },
  { num: 3, label: "Preview" },
  { num: 4, label: "Outreach" },
  { num: 5, label: "Review" },
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
    hint: "Work through a search or a Sales Navigator list.",
    icon: Search,
  },
];

/** Section 7b, step 2: at least 4 signals, at most 15. */
const MIN_SIGNALS = 4;
const MAX_SIGNALS = 15;

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

interface LinkedInAccount {
  id: string;
  fullName: string | null;
  headline: string | null;
  status: string | null;
  dailyInviteCap: number;
  agentCount: number;
}

export function NewAgentWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accounts, setAccounts] = useState<LinkedInAccount[]>([]);
  const [accountsLoaded, setAccountsLoaded] = useState(false);

  const [name, setName] = useState("");
  const [source, setSource] = useState<string>("buying_event");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [jobRoles, setJobRoles] = useState("");
  const [industries, setIndustries] = useState("");
  const [locations, setLocations] = useState("");
  const [matchLevel, setMatchLevel] = useState<string>("balanced");
  const [smartLeadFinder, setSmartLeadFinder] = useState(true);
  const [companyInfo, setCompanyInfo] = useState("");
  const [goal, setGoal] = useState<string>("conversations");
  const [tone, setTone] = useState<string>("conversational");
  const [linkedinAccountId, setLinkedinAccountId] = useState("");
  const [skipConnected, setSkipConnected] = useState(true);
  const [reviewMode, setReviewMode] = useState(false);

  useEffect(() => {
    fetch("/api/linkedin/accounts")
      .then((r) => (r.ok ? r.json() : { accounts: [] }))
      .then((d) => {
        const list: LinkedInAccount[] = d.accounts ?? [];
        setAccounts(list);
        if (list.length === 1) setLinkedinAccountId(list[0].id);
      })
      .catch(() => setAccounts([]))
      .finally(() => setAccountsLoaded(true));
  }, []);

  const addKeyword = useCallback(() => {
    const value = keywordDraft.trim();
    if (!value || keywords.length >= MAX_SIGNALS) return;
    if (keywords.some((k) => k.toLowerCase() === value.toLowerCase())) return;
    setKeywords((prev) => [...prev, value]);
    setKeywordDraft("");
  }, [keywordDraft, keywords]);

  // What each step needs before it will let you move on. Kept in one place so
  // the button and the hint under it can never disagree.
  const blocker = (() => {
    if (step === 1 && !name.trim()) return "Give the agent a name.";
    if (step === 2 && keywords.length < MIN_SIGNALS)
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
          smartLeadFinder,
          sources: [
            { type: source, label: labelForSource(source) },
            ...keywords.map((k) => ({ type: "keyword", label: k })),
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create the agent");
      router.push(`/dashboard/agents/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the agent");
      setSaving(false);
    }
  };

  return (
    <PageShell className="space-y-6">
      <PageHeader
        title="New agent"
        description="Five steps. Nothing is sent until you start it yourself."
        actions={
          <Link href="/dashboard/agents">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All agents
            </Button>
          </Link>
        }
      />

      <StepRail steps={STEPS} current={step} onSelect={(n) => setStep(n)} />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {step === 1 && (
        <StepBody
          title="Where should it find people?"
          lead="Pick one to start with. You can add more sources once the agent is running."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {LEAD_SOURCES.map((s) => (
              <OptionCard
                key={s.id}
                picked={source === s.id}
                onClick={() => setSource(s.id)}
                icon={s.icon}
                label={s.label}
                hint={s.hint}
                badge={s.recommended ? "Start here" : undefined}
              />
            ))}
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <Field
              label="Name it"
              hint="Only you see this. Naming it after who it targets makes a list of agents readable."
            >
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Founders in Switzerland"
                maxLength={80}
              />
            </Field>
          </div>
        </StepBody>
      )}

      {step === 2 && (
        <StepBody
          title="Who should it go after?"
          lead="The signals tell it what to watch. The filters narrow who counts."
        >
          <div className="space-y-8">
            <Group
              title={`Signals ${keywords.length}/${MAX_SIGNALS}`}
              hint={`Topics your buyers talk about. At least ${MIN_SIGNALS}, so the agent has enough to work with.`}
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
              </div>
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

            <Group title="Filters" hint="Leave any of these empty to allow everything.">
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

            <Field label="Locations" hint="Comma separated. Countries or cities.">
              <Input
                value={locations}
                onChange={(e) => setLocations(e.target.value)}
                placeholder="Switzerland, France"
              />
            </Field>

            <Field label="Match level" hint="How strictly a lead has to fit before the agent takes it.">
              <Segmented
                options={MATCH_LEVELS}
                value={matchLevel}
                onChange={setMatchLevel}
              />
            </Field>
            </Group>

            <Group title="Volume">
              <Toggle
                checked={smartLeadFinder}
                onChange={setSmartLeadFinder}
                label="Widen the search when signals run dry"
                hint="An agent with nothing left to do looks broken. This keeps it fed."
              />
            </Group>
          </div>
        </StepBody>
      )}

      {step === 3 && (
        <StepBody
          title="The first leads it finds"
          lead="You reject the ones that do not fit, and every rejection sharpens what it looks for next."
        >
          <div>
            {/* Honest placeholder: lead discovery is the outreach-agent port,
                phase 2 of the plan. Showing invented people here would make
                the ICP feel validated when nothing has run. */}
            <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
              <p className="text-[15px] font-medium text-slate-900 dark:text-white">
                Nothing to preview yet
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Once the agent runs its first search, the five best matches
                appear here and you reject the ones that do not fit. Every
                rejection sharpens what it looks for next.
              </p>
            </div>
          </div>
        </StepBody>
      )}

      {step === 4 && (
        <StepBody
          title="How it reaches out"
          lead="Nothing goes out without you. This is prepared now, and at the end you decide whether to start it or leave it paused."
        >
          <div className="space-y-8">
            <Group title="Who sends">
            <Field
              label="Sending account"
              hint="This cannot change later: switching mid-sequence breaks the session and the IP it is pinned to."
            >
              {!accountsLoaded ? (
                <div className="h-11 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5" />
              ) : accounts.length === 0 ? (
                <div className="rounded-xl border border-border p-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No LinkedIn account connected yet.
                  </p>
                  <Link href="/dashboard/settings/linkedin-accounts" className="mt-3 inline-block">
                    <Button size="sm" variant="outline">
                      Connect one
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {accounts.map((a) => (
                    <SelectCard
                      key={a.id}
                      picked={linkedinAccountId === a.id}
                      onClick={() => setLinkedinAccountId(a.id)}
                      label={a.fullName || "LinkedIn account"}
                      // An account can send for several agents, and they share
                      // its daily budget. Saying so here is the only place the
                      // user can still change their mind cheaply.
                      hint={
                        a.agentCount > 0
                          ? `Already sending for ${a.agentCount} agent${a.agentCount === 1 ? "" : "s"}, sharing ${a.dailyInviteCap} invitations a day`
                          : a.headline || a.status || ""
                      }
                    />
                  ))}
                </div>
              )}
            </Field>

            </Group>

            <Group title="What the messages say">
            <Field
              label="What you sell"
              hint="This is what the messages are built from. Be specific about who it helps."
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
              hint="They cannot be invited, and a cold message to someone who knows you reads badly."
            />
            <Toggle
              checked={reviewMode}
              onChange={setReviewMode}
              label="Review each contact before anything is sent"
              hint="Slower, but nothing leaves without you seeing it."
            />
            </Group>
          </div>
        </StepBody>
      )}

      {step === 5 && (
        <StepBody
          title="Check it over"
          lead="Nothing here is final. Everything can be changed after the agent exists."
        >
          <dl className="divide-y divide-border">
              <SummaryRow label="Name" value={name || "Not set"} />
              <SummaryRow label="Lead source" value={labelForSource(source)} />
              <SummaryRow label="Signals" value={keywords.join(", ") || "None"} />
              <SummaryRow label="Job titles" value={jobRoles || "Any"} />
              <SummaryRow label="Industries" value={industries || "Any"} />
              <SummaryRow label="Locations" value={locations || "Anywhere"} />
              <SummaryRow
                label="Match level"
                value={MATCH_LEVELS.find((m) => m.id === matchLevel)?.label ?? ""}
              />
              <SummaryRow
                label="Sending account"
                value={
                  accounts.find((a) => a.id === linkedinAccountId)?.fullName ||
                  "Not picked"
                }
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

      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
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
          <p className="text-sm text-slate-500 dark:text-slate-400">{blocker}</p>
        )}
      </div>
    </PageShell>
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
    <div>
      <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">
        {title}
      </h2>
      {lead && (
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
          {lead}
        </p>
      )}
      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        {children}
      </div>
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
