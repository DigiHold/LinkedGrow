"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatInTimezone, resolveTimezone } from "@/lib/timezone";
import {
  PageShell,
  PageHeader,
  Panel,
  PanelTitle,
  Pill,
  StatCard,
  EmptyState,
} from "@/components/dashboard/ui/page";
import {
  GeneratorIcon,
  EditorIcon,
  RepurposeIcon,
  IdeaIcon,
  PostsIcon,
  CalendarIcon,
  ChevronRightIcon,
  KeyIcon,
  LinkedInAccountIcon,
} from "@/components/dashboard/nav-icons";

const quickActions = [
  {
    title: "Generate a post",
    description: "From an idea, in your voice",
    href: "/dashboard/generator",
    icon: GeneratorIcon,
  },
  {
    title: "Write from scratch",
    description: "The editor, with AI on tap",
    href: "/dashboard/editor",
    icon: EditorIcon,
  },
  {
    title: "Repurpose a link",
    description: "Any URL becomes a post",
    href: "/dashboard/repurpose",
    icon: RepurposeIcon,
  },
  {
    title: "Find an angle",
    description: "Ideas worth writing about",
    href: "/dashboard/ideas",
    icon: IdeaIcon,
  },
];

interface Post {
  id: string;
  content: string;
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
}

interface PostsResponse {
  posts: Post[];
  counts?: Record<string, number>;
  pagination?: { total: number };
}

interface SettingsResponse {
  hasApiKey: boolean;
  aiProvider: string | null;
  linkedinConnected: boolean;
  timezone: string | null;
}

const STATUS_TONE: Record<Post["status"], "neutral" | "good" | "warn" | "brand"> =
  {
    draft: "neutral",
    scheduled: "brand",
    published: "good",
    failed: "warn",
  };

function PostRow({
  post,
  when,
}: {
  post: Post;
  when: string;
}) {
  return (
    <Link
      href={`/dashboard/editor?edit=${post.id}`}
      className="group flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
    >
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          {post.content || "Untitled draft"}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Pill tone={STATUS_TONE[post.status]}>{post.status}</Pill>
          <span className="text-xs text-slate-400 dark:text-slate-500">{when}</span>
        </div>
      </div>
      <ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-600" />
    </Link>
  );
}

export function HomeContent() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [settings, setSettings] = useState<SettingsResponse | null>(null);

  const firstName =
    session?.user?.name?.split(" ")[0] ||
    session?.user?.email?.split("@")[0] ||
    "there";

  useEffect(() => {
    let cancelled = false;
    // Both are independent, so neither waits on the other and each section
    // renders as soon as its own data lands instead of the whole page
    // blocking on a single spinner.
    fetch("/api/posts?limit=10")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PostsResponse | null) => {
        if (cancelled || !data) return;
        setPosts(data.posts || []);
        setCounts(data.counts || {});
        setTotal(data.pagination?.total ?? data.posts?.length ?? 0);
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      });

    fetch("/api/user/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SettingsResponse | null) => {
        if (!cancelled && data) setSettings(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const tz = resolveTimezone(settings?.timezone ?? null);

  const formatWhen = (iso: string) => {
    const date = new Date(iso);
    const diffDays = Math.floor(
      (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const time = formatInTimezone(iso, tz, { hour: "numeric", minute: "2-digit" });
    if (diffDays === 0) return `Today at ${time}`;
    if (diffDays === 1) return `Tomorrow at ${time}`;
    if (diffDays > 1 && diffDays < 7)
      return `${formatInTimezone(iso, tz, { weekday: "short" })} at ${time}`;
    return formatInTimezone(iso, tz, { month: "short", day: "numeric" });
  };

  const formatAgo = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${Math.max(mins, 1)}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatInTimezone(iso, tz, { month: "short", day: "numeric" });
  };

  const scheduled = (posts ?? [])
    .filter((p) => p.status === "scheduled" && p.scheduledAt)
    .sort(
      (a, b) =>
        new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime()
    )
    .slice(0, 4);

  const recent = (posts ?? []).slice(0, 4);

  // Only shown when something is genuinely missing, so it never becomes
  // wallpaper the user learns to ignore.
  const setupSteps = settings
    ? [
        settings.hasApiKey
          ? null
          : {
              href: "/dashboard/settings/ai-api",
              icon: KeyIcon,
              title: "Connect an AI key",
              body: "Generation runs on your own key, which is what keeps it unlimited for a few dollars a month.",
            },
        settings.linkedinConnected
          ? null
          : {
              href: "/dashboard/settings",
              icon: LinkedInAccountIcon,
              title: "Connect LinkedIn",
              body: "Needed to publish and to schedule. Everything else works without it.",
            },
      ].filter(Boolean)
    : [];

  return (
    <PageShell>
      <PageHeader
        title={`Good to see you, ${firstName}`}
        description="Everything you have in flight, and the quickest way to add to it."
        meta={
          settings ? (
            <>
              <Pill tone={settings.hasApiKey ? "good" : "warn"}>
                {settings.hasApiKey ? "AI key connected" : "No AI key"}
              </Pill>
              <Pill tone={settings.linkedinConnected ? "good" : "neutral"}>
                {settings.linkedinConnected ? "LinkedIn connected" : "LinkedIn not connected"}
              </Pill>
            </>
          ) : null
        }
      />

      {setupSteps.length > 0 && (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {setupSteps.map((step) => {
            if (!step) return null;
            const Icon = step.icon;
            return (
              <Link
                key={step.href}
                href={step.href}
                className="group flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/60 p-4 transition-colors hover:bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/5 dark:hover:bg-blue-500/10"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 dark:bg-white/10 dark:text-blue-300">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                    {step.title}
                  </span>
                  <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">
                    {step.body}
                  </span>
                </span>
                <ChevronRightIcon className="mt-2 h-4 w-4 shrink-0 text-blue-400 transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {posts === null ? (
          [0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[110px] animate-pulse rounded-2xl border border-border bg-card"
            />
          ))
        ) : (
          <>
            <StatCard label="All posts" value={total} />
            <StatCard label="Drafts" value={counts.draft ?? 0} />
            <StatCard label="Scheduled" value={counts.scheduled ?? 0} />
            <StatCard
              label="Published"
              value={counts.published ?? 0}
              note={counts.published ? "Live on LinkedIn" : undefined}
              tone="good"
            />
          </>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-white/20"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-white/5 dark:text-slate-400 dark:group-hover:bg-blue-500/10 dark:group-hover:text-blue-300">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 text-[15px] font-semibold tracking-[-0.02em] text-slate-900 dark:text-white">
                {action.title}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelTitle
            actions={
              <Link
                href="/dashboard/posts"
                className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                All posts
              </Link>
            }
          >
            Recent
          </PanelTitle>
          {posts === null ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5"
                />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              icon={<PostsIcon className="h-6 w-6" />}
              title="Nothing written yet"
              description="Start from an idea and the generator will draft it in your voice."
              action={
                <Link
                  href="/dashboard/generator"
                  className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Generate a post
                </Link>
              }
            />
          ) : (
            <div className="-mx-3 divide-y divide-border">
              {recent.map((post) => (
                <PostRow
                  key={post.id}
                  post={post}
                  when={formatAgo(post.createdAt)}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel>
          <PanelTitle
            actions={
              <Link
                href="/dashboard/calendar"
                className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Calendar
              </Link>
            }
          >
            Going out next
          </PanelTitle>
          {posts === null ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5"
                />
              ))}
            </div>
          ) : scheduled.length === 0 ? (
            <EmptyState
              icon={<CalendarIcon className="h-6 w-6" />}
              title="Nothing scheduled"
              description="Posts you schedule appear here with the exact time they go out."
              action={
                <Link
                  href="/dashboard/calendar"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5",
                    "text-sm font-semibold text-slate-700 dark:text-slate-200"
                  )}
                >
                  Open the calendar
                </Link>
              }
            />
          ) : (
            <div className="-mx-3 divide-y divide-border">
              {scheduled.map((post) => (
                <PostRow
                  key={post.id}
                  post={post}
                  when={formatWhen(post.scheduledAt!)}
                />
              ))}
            </div>
          )}
        </Panel>
      </div>
    </PageShell>
  );
}
