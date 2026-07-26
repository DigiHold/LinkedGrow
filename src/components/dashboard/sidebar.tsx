"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/dashboard/sidebar-context";
import { isPaidUser } from "@/lib/is-paid-user";
import { Logo, LogoMark } from "@/components/ui/logo";
import {
  HomeIcon,
  AgentIcon,
  ReplyIcon,
  LinkedInAccountIcon,
  GeneratorIcon,
  EditorIcon,
  RepurposeIcon,
  CalendarIcon,
  PostsIcon,
  CarouselIcon,
  HookIcon,
  IdeaIcon,
  AnalyticsIcon,
  BellIcon,
  SplitTestIcon,
  TeamIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CloseIcon,
  CrownIcon,
  KeyIcon,
  CodeIcon,
  AffiliateIcon,
  BookIcon,
  ChatIcon,
  SettingsIcon,
  CardIcon,
  ShieldIcon,
  SignOutIcon,
} from "@/components/dashboard/nav-icons";

type NavItem = {
  name: string;
  href: string;
  icon: (props: { className?: string }) => React.ReactElement;
  /** Team members use the owner's setup, so some destinations are hidden. */
  hideForTeamMember?: boolean;
};

/** Level 1, the lead-generation section. */
const agentNav: NavItem[] = [
  { name: "All agents", href: "/dashboard/agents", icon: AgentIcon },
  { name: "Replies", href: "/dashboard/replies", icon: ReplyIcon },
  {
    name: "LinkedIn accounts",
    href: "/dashboard/linkedin-accounts",
    icon: LinkedInAccountIcon,
    hideForTeamMember: true,
  },
];

/** Level 1, the content section. */
const contentNav: NavItem[] = [
  { name: "Generator", href: "/dashboard/generator", icon: GeneratorIcon },
  { name: "Editor", href: "/dashboard/editor", icon: EditorIcon },
  { name: "Repurpose", href: "/dashboard/repurpose", icon: RepurposeIcon },
  { name: "Ideas", href: "/dashboard/ideas", icon: IdeaIcon },
  { name: "Carousels", href: "/dashboard/carousel", icon: CarouselIcon },
  { name: "Hooks", href: "/dashboard/hooks", icon: HookIcon },
  { name: "My posts", href: "/dashboard/posts", icon: PostsIcon },
  { name: "Calendar", href: "/dashboard/calendar", icon: CalendarIcon },
  { name: "Analytics", href: "/dashboard/analytics", icon: AnalyticsIcon },
  {
    name: "Network notifications",
    href: "/dashboard/network-notifications",
    icon: BellIcon,
  },
];

/** Business plan only, appended under the content section. */
const businessNav: NavItem[] = [
  { name: "A/B testing", href: "/dashboard/ab-testing", icon: SplitTestIcon },
  { name: "Team", href: "/dashboard/team", icon: TeamIcon },
  {
    name: "Advanced analytics",
    href: "/dashboard/analytics/advanced",
    icon: AnalyticsIcon,
  },
];

const adminLinks = [
  { name: "Support tickets", href: "/dashboard/admin/support" },
  { name: "Blog comments", href: "/dashboard/admin/comments" },
  { name: "Users", href: "/dashboard/admin/users" },
  { name: "Affiliates", href: "/dashboard/admin/affiliates" },
  { name: "Site data", href: "/dashboard/admin/site-data" },
  { name: "Abandoned carts", href: "/dashboard/admin/abandoned-carts" },
  { name: "Docs feedback", href: "/dashboard/admin/docs-feedback" },
  { name: "LTD codes", href: "/dashboard/admin/ltd-codes" },
];

const planNames: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  business: "Business",
};

type Section = "root" | "agents" | "content";

/** A deep link has to open the sidebar on the section that owns it. */
function sectionForPath(pathname: string): Section {
  if (agentNav.some((i) => pathname.startsWith(i.href))) return "agents";
  if (
    [...contentNav, ...businessNav].some((i) => pathname.startsWith(i.href))
  ) {
    return "content";
  }
  return "root";
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const { isOpen: isMobileOpen, close: closeMobile } = useSidebar();
  const [section, setSection] = useState<Section>(() => sectionForPath(pathname));
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Follow the URL: navigating anywhere re-opens the owning section and closes
  // the drawer, so tapping a link on mobile does not leave it hanging open.
  useEffect(() => {
    setSection(sectionForPath(pathname));
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) closeMobile();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [closeMobile]);

  // Escape closes the drawer, and the page underneath must not scroll while it
  // is open or the body scrolls behind the overlay on iOS.
  useEffect(() => {
    if (!isMobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [isMobileOpen, closeMobile]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const isTeamMember = session?.user?.isTeamMember === true;
  const teamRole = session?.user?.teamRole;
  const plan = session?.user?.plan || "free";

  const userName =
    session?.user?.name || session?.user?.email?.split("@")[0] || "User";
  const userImage = session?.user?.image;
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const planLabel = planNames[plan] || "Free";

  const visibleAgentNav = useMemo(
    () => agentNav.filter((i) => !(isTeamMember && i.hideForTeamMember)),
    [isTeamMember]
  );

  const showBusinessNav =
    plan === "business" && !(isTeamMember && teamRole === "member");

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const handleSignOut = () => {
    setIsUserMenuOpen(false);
    signOut({ redirectTo: "/" });
  };

  const goToMenuItem = (href: string) => {
    setIsUserMenuOpen(false);
    router.push(href);
  };

  const navLink = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100"
        )}
      >
        <Icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors",
            active
              ? "text-blue-600 dark:text-blue-400"
              : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
          )}
        />
        <span className="truncate">{item.name}</span>
      </Link>
    );
  };

  const sectionLabel = (label: string) => (
    <div className="px-3 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
      {label}
    </div>
  );

  /**
   * Help, the guides and the referral programme, pinned to the foot of the
   * sidebar in every section.
   *
   * They used to live in the account menu, which is the last place someone who
   * is stuck thinks to look. The support target keeps the rule the menu had:
   * paying accounts get the ticket system, trial and free accounts get the
   * chatbot, because a free account with no ticket history has nothing to open
   * a ticket against.
   */
  const helpBlock = (
    <div className="px-3 pb-3">
      <button
        onClick={() => {
          closeMobile();
          if (isPaidUser(session?.user)) {
            router.push("/dashboard/support");
          } else {
            window.dispatchEvent(new Event("open-chat-widget"));
          }
        }}
        className="group flex w-full items-center gap-3 rounded-2xl border border-cyan-100 bg-linear-to-br from-cyan-50 to-blue-50 px-3 py-3.5 text-left transition-colors hover:border-cyan-200 dark:border-cyan-500/20 dark:from-cyan-500/10 dark:to-blue-500/5 dark:hover:border-cyan-500/35"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-cyan-600 shadow-sm dark:bg-cyan-500/15 dark:text-cyan-300">
          <ChatIcon className="h-[18px] w-[18px]" />
        </span>
        {/* The sidebar is 256px wide, so this copy wraps rather than
            truncating. Anything longer loses its second line. */}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-snug text-slate-900 dark:text-white">
            Need a hand?
          </span>
          <span className="block text-[12px] leading-snug text-slate-500 dark:text-slate-400">
            We answer every message
          </span>
        </span>
        <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-cyan-500/70 transition-transform group-hover:translate-x-0.5 dark:text-cyan-400/70" />
      </button>

      <div className="mt-3 space-y-1">
        <a
          href="/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100"
        >
          <BookIcon className="h-[18px] w-[18px] shrink-0 text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300" />
          <span className="truncate">Read the guides</span>
        </a>
        {navLink({
          name: "Earn with referrals",
          href: "/dashboard/affiliate",
          icon: AffiliateIcon,
        })}
      </div>
    </div>
  );

  const backLink = (
    <button
      onClick={() => setSection("root")}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
    >
      <ChevronLeftIcon className="h-3.5 w-3.5" />
      Back to home
    </button>
  );

  return (
    <>
      {/* The drawer is opened from the topbar burger, not from a tab stuck to
          the viewport edge. */}
      <div
        onClick={closeMobile}
        aria-hidden={!isMobileOpen}
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        className={cn(
          // h-dvh rather than h-screen: on iOS Safari 100vh includes the area
          // behind the chrome, which pushes the user button out of view.
          "fixed left-0 top-0 z-40 flex h-dvh w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:sticky lg:w-64 lg:translate-x-0 dark:border-white/10 dark:bg-card",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <LogoMark className="h-4 w-auto" />
            <Logo size="md" />
          </Link>
          <button
            onClick={closeMobile}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-white/5"
            aria-label="Close menu"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {section === "root" && (
            <div className="space-y-1">
              {navLink({ name: "Home", href: "/dashboard", icon: HomeIcon })}

              {/* These open the section AND land on its first page, so one
                  click gets you somewhere instead of only unfolding a list. */}
              <Link
                href="/dashboard/agents"
                onClick={() => {
                  setSection("agents");
                  closeMobile();
                }}
                className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100"
              >
                <AgentIcon className="h-[18px] w-[18px] shrink-0 text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300" />
                <span className="truncate">Agents</span>
                <ChevronRightIcon className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
              </Link>

              <Link
                href="/dashboard/generator"
                onClick={() => {
                  setSection("content");
                  closeMobile();
                }}
                className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100"
              >
                <EditorIcon className="h-[18px] w-[18px] shrink-0 text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300" />
                <span className="truncate">Posts</span>
                <ChevronRightIcon className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
              </Link>

            </div>
          )}

          {section === "agents" && (
            <div>
              {backLink}
              {sectionLabel("Lead generation")}
              <div className="space-y-1">{visibleAgentNav.map(navLink)}</div>
            </div>
          )}

          {section === "content" && (
            <div>
              {backLink}
              {sectionLabel("Content")}
              <div className="space-y-1">{contentNav.map(navLink)}</div>
              {showBusinessNav && (
                <>
                  {sectionLabel("Business")}
                  <div className="space-y-1">{businessNav.map(navLink)}</div>
                </>
              )}
            </div>
          )}
        </nav>

        {/* Home only. The Leads and Posts sections are working screens and the
            footer would just push their lists up. */}
        {section === "root" && helpBlock}

        {/* Safe-area padding keeps the user button above the iOS home indicator. */}
        <div
          ref={userMenuRef}
          className="relative border-t border-slate-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-white/10"
        >
          {isUserMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 z-50 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-card">
              <div className="flex items-center gap-3 border-b border-slate-200 px-3 py-3 dark:border-white/10">
                {userImage ? (
                  <Image
                    src={userImage}
                    alt={userName}
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-cyan-500 to-blue-600 text-sm font-medium text-white">
                    {userInitials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{userName}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {session?.user?.email}
                  </p>
                </div>
              </div>

              {!isTeamMember && (
                <>
                  <button
                    onClick={() => goToMenuItem("/dashboard/upgrade")}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors",
                      plan === "business"
                        ? "hover:bg-slate-100 dark:hover:bg-white/5"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50"
                    )}
                  >
                    <CrownIcon className="h-4 w-4" />
                    {plan === "business" ? "Our plans" : "Upgrade"}
                  </button>
                  <button
                    onClick={() => goToMenuItem("/dashboard/settings/ai-api")}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    <KeyIcon className="h-4 w-4" />
                    AI API keys
                  </button>
                </>
              )}

              {plan === "business" && !isTeamMember && (
                <button
                  onClick={() => goToMenuItem("/dashboard/settings/api")}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <CodeIcon className="h-4 w-4" />
                  API keys
                </button>
              )}

              <button
                onClick={() => goToMenuItem("/dashboard/settings")}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <SettingsIcon className="h-4 w-4" />
                Account settings
              </button>

              {plan !== "free" && !isTeamMember && (
                <button
                  onClick={() => goToMenuItem("/dashboard/settings/billing")}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <CardIcon className="h-4 w-4" />
                  Billing and invoices
                </button>
              )}

              {session?.user?.isAdmin && (
                <>
                  <div className="my-1 border-t border-slate-200 dark:border-white/10" />
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    <ShieldIcon className="h-3.5 w-3.5" />
                    Admin
                  </div>
                  {adminLinks.map((link) => (
                    <button
                      key={link.href}
                      onClick={() => goToMenuItem(link.href)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
                    >
                      {link.name}
                    </button>
                  ))}
                </>
              )}

              <div className="my-1 border-t border-slate-200 dark:border-white/10" />
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <SignOutIcon className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}

          <button
            onClick={() => setIsUserMenuOpen((open) => !open)}
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
          >
            {userImage ? (
              <Image
                src={userImage}
                alt={userName}
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-cyan-500 to-blue-600 text-xs font-semibold text-white">
                {userInitials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {planLabel}
              </p>
            </div>
            <ChevronUpIcon
              className={cn(
                "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                isUserMenuOpen && "rotate-180"
              )}
            />
          </button>
        </div>
      </aside>
    </>
  );
}
