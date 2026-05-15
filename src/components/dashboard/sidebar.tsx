"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import {
  Sparkles,
  PenLine,
  Lightbulb,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronUp,
  Key,
  Layers,
  Users,
  Anchor,
  GitBranch,
  UsersRound,
  TrendingUp,
  Code,
  Crown,
  Shield,
  Database,
  CreditCard,
  Search,
  MessageSquare,
  Handshake,
  ShoppingCart,
  Repeat,
  BookOpen,
  Bell,
  Gift,
} from "lucide-react";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";

const navigation = [
  {
    name: "Generator",
    href: "/dashboard/generator",
    icon: Sparkles,
    description: "Create posts from ideas",
  },
  {
    name: "Editor",
    href: "/dashboard/editor",
    icon: PenLine,
    description: "Write and edit posts",
  },
  {
    name: "Repurpose",
    href: "/dashboard/repurpose",
    icon: Repeat,
    description: "Turn any URL into a post",
  },
  {
    name: "Ideas",
    href: "/dashboard/ideas",
    icon: Lightbulb,
    description: "Get content ideas",
  },
  {
    name: "Carousel",
    href: "/dashboard/carousel",
    icon: Layers,
    description: "Create slide carousels",
  },
  {
    name: "Hooks",
    href: "/dashboard/hooks",
    icon: Anchor,
    description: "Create catchy hooks",
  },
  {
    name: "My Posts",
    href: "/dashboard/posts",
    icon: FileText,
    description: "Manage all posts",
  },
  {
    name: "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
    description: "Schedule content",
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    description: "Track performance",
  },
  {
    name: "Network Notifications",
    href: "/dashboard/network-notifications",
    icon: Bell,
    description: "Get notified of new posts",
  },
];

// Business plan exclusive features
const businessNavigation = [
  {
    name: "A/B Testing",
    href: "/dashboard/ab-testing",
    icon: GitBranch,
    description: "Test post variations",
  },
  {
    name: "Team",
    href: "/dashboard/team",
    icon: UsersRound,
    description: "Collaborate with team",
  },
  {
    name: "Advanced Analytics",
    href: "/dashboard/analytics/advanced",
    icon: TrendingUp,
    description: "Deep insights & export",
  },
];

const planNames: Record<string, string> = {
  free: "Free Plan",
  starter: "Starter Plan",
  pro: "Pro Plan",
  business: "Business Plan",
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; top: number } | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    setIsUserMenuOpen(false);
    signOut({ redirectTo: "/" });
  };

  const showTooltip = (e: React.MouseEvent, text: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ text, top: rect.top + rect.height / 2 });
  };

  const hideTooltip = () => setTooltip(null);

  // Fetch LinkedIn posting target to show company page info in sidebar
  const [linkedInTarget, setLinkedInTarget] = useState<{
    postingTarget: string;
    selectedOrgName?: string | null;
    selectedOrgLogoUrl?: string | null;
  } | null>(null);

  const fetchLinkedInTarget = () => {
    fetch("/api/linkedin/settings")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.connected && data.postingTarget === "organization") {
          const orgs = data.organizations || [];
          const selectedOrg = orgs.find((o: { id: string }) => o.id === data.selectedOrgId);
          setLinkedInTarget({
            postingTarget: "organization",
            selectedOrgName: data.selectedOrgName,
            selectedOrgLogoUrl: selectedOrg?.logoUrl || null,
          });
        } else {
          setLinkedInTarget(null);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchLinkedInTarget();
    // Listen for posting target changes from settings page
    const handleTargetChange = () => fetchLinkedInTarget();
    window.addEventListener("linkedin-target-changed", handleTargetChange);
    return () => window.removeEventListener("linkedin-target-changed", handleTargetChange);
  }, []);

  // User display info - show company page when posting to org
  const isPostingToOrg = linkedInTarget?.postingTarget === "organization";
  const userName = isPostingToOrg && linkedInTarget?.selectedOrgName
    ? linkedInTarget.selectedOrgName
    : session?.user?.name || session?.user?.email?.split("@")[0] || "User";
  const userImage = isPostingToOrg && linkedInTarget?.selectedOrgLogoUrl
    ? linkedInTarget.selectedOrgLogoUrl
    : session?.user?.image;
  const userPlan = planNames[session?.user?.plan || "free"] || "Free Plan";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Check if user is a team member (not owner)
  const isTeamMember = session?.user?.isTeamMember === true;
  const teamRole = session?.user?.teamRole;

  return (
    <>
      {/* Mobile Sidebar Toggle - hidden while sidebar is open so it doesn't
          float over the sidebar content */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden fixed top-4 left-0 z-50 w-7.5 h-7.5 rounded-r-xl bg-linkedin text-white shadow-lg flex items-center justify-center touch-target"
          aria-label="Open menu"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          // h-dvh (dynamic viewport height) instead of h-screen so iOS Safari's
          // URL bar doesn't push the user button below the visible viewport.
          // h-screen = 100vh, which on iOS includes the area behind the chrome.
          "fixed lg:sticky top-0 left-0 z-40 h-dvh flex flex-col bg-white dark:bg-gray-950 border-r border-border transition-all duration-300",
          isCollapsed ? "lg:w-20" : "lg:w-64",
          isMobileOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <Link
            href="/dashboard"
            prefetch={true}
            className={cn(
              "flex items-center gap-2",
              isCollapsed && "lg:justify-center"
            )}
          >
            <div className="w-9 h-9 rounded-lg bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 379 230" className="w-5 h-5 text-white" fill="currentColor">
                <path d="M205.9185,32.0339c.9512,8.7484,8.8874,15.128,17.6358,14.1767l88.8761-9.6638-93.389,116.1758-93.3595-75.0479c-6.8339-5.4935-16.9741-4.3909-22.4676,2.443L3.9774,203.5681c-5.4935,6.8339-4.3909,16.9741,2.443,22.4676,6.8339,5.4935,16.9741,4.3909,22.4676-2.443l89.2246-110.9953,93.3595,75.0479c6.8339,5.4935,16.9741,4.3909,22.4676-2.443l103.4013-128.631,9.6638,88.8761c.9512,8.7484,8.8874,15.128,17.6358,14.1767s15.128-8.8874,14.1767-17.6358l-13.8363-127.25c-.9512-8.7484-8.8874-15.128-17.6358-14.1767l-127.25,13.8363c-8.7484.9512-15.128,8.8874-14.1767,17.6358Z"/>
              </svg>
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <Logo />
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
            aria-label="Close menu"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Desktop Collapse Button */}
          <button
            onClick={() => { setIsCollapsed(!isCollapsed); setTooltip(null); }}
            className="hidden lg:flex p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
          {navigation
            .filter((item) => {
              if (isTeamMember) {
                // Analytics: admins can see, members cannot
                if (item.href === "/dashboard/analytics") {
                  return teamRole === "admin";
                }
              }
              return true;
            })
            .map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onMouseEnter={(e) => isCollapsed && !isMobileOpen && showTooltip(e, item.name)}
                onMouseLeave={hideTooltip}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all touch-target",
                  isActive
                    ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  isCollapsed && "lg:justify-center lg:px-2"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    isActive && "text-cyan-600 dark:text-cyan-400"
                  )}
                />
                {(!isCollapsed || isMobileOpen) && (
                  <div className="flex-1 min-w-0">
                    <span className="block truncate">{item.name}</span>
                    <span className="block text-xs text-muted-foreground truncate">
                      {item.description}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}

          {/* Business Plan Features */}
          {/* Hide for member role (they see no business features), show for admin (Team access) and owners */}
          {session?.user?.plan === "business" && !(isTeamMember && teamRole === "member") && (
            <>
              {(!isCollapsed || isMobileOpen) && (
                <div className="pt-4 pb-2">
                  <div className="flex items-center gap-2 px-3 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    <Crown className="w-3 h-3" />
                    <span>Business</span>
                  </div>
                </div>
              )}
              {businessNavigation
                .filter((item) => {
                  // Team members can only see Team page if they are admin
                  if (isTeamMember) {
                    if (item.href === "/dashboard/team") {
                      return teamRole === "admin"; // Only admin can manage team
                    }
                    return false; // Hide A/B Testing and Advanced Analytics for team members
                  }
                  return true; // Owners see everything
                })
                .map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onMouseEnter={(e) => isCollapsed && !isMobileOpen && showTooltip(e, item.name)}
                    onMouseLeave={hideTooltip}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all touch-target",
                      isActive
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent",
                      isCollapsed && "lg:justify-center lg:px-2"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-5 h-5 shrink-0",
                        isActive && "text-amber-600 dark:text-amber-400"
                      )}
                    />
                    {(!isCollapsed || isMobileOpen) && (
                      <div className="flex-1 min-w-0">
                        <span className="block truncate">{item.name}</span>
                        <span className="block text-xs text-muted-foreground truncate">
                          {item.description}
                        </span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User Section with Custom Menu */}
        {/* Safe-area padding ensures the user button sits above the iPhone home
            indicator on iOS Safari & Chrome (both use WebKit). */}
        <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-border relative" ref={userMenuRef}>
          {/* Menu popup - appears above the button */}
          {isUserMenuOpen && (
            <div className={cn(
              "absolute bottom-full mb-2 bg-white dark:bg-gray-900 rounded-lg border border-border shadow-lg overflow-hidden z-50",
              isCollapsed ? "left-0 right-0 lg:left-auto lg:right-auto lg:w-56" : "left-3 right-3"
            )}>
              <div className="px-3 py-3 border-b border-border flex items-center gap-3">
                {userImage ? (
                  <Image
                    src={userImage}
                    alt={userName}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 text-white text-sm font-medium">
                    {userInitials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                </div>
              </div>
              {/* Hide Upgrade and AI API Keys for team members - they use owner's settings */}
              {!isTeamMember && (
                <>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      router.push("/dashboard/upgrade");
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                      session?.user?.plan === "business"
                        ? "hover:bg-accent"
                        : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50"
                    )}
                  >
                    <Crown className="w-4 h-4" />
                    {session?.user?.plan === "business" ? "Our Plans" : "Upgrade"}
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      router.push("/dashboard/settings/ai-api");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <Key className="w-4 h-4" />
                    AI API Keys
                  </button>
                </>
              )}
              {/* Business features - only for owners, not team members */}
              {session?.user?.plan === "business" && !isTeamMember && (
                <>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      router.push("/dashboard/settings/api");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <Code className="w-4 h-4" />
                    API Keys
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  router.push("/dashboard/affiliate");
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <Handshake className="w-4 h-4" />
                Affiliate
              </button>
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  window.dispatchEvent(new Event("open-chat-widget"));
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Need Help?
              </button>
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  router.push("/dashboard/settings");
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <Settings className="w-4 h-4" />
                Account Settings
              </button>
              {/* Billing - only for paid users (not free, not team members) */}
              {session?.user?.plan !== "free" && !isTeamMember && (
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    router.push("/dashboard/settings/billing");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  Billing & Invoices
                </button>
              )}
              {session?.user?.isAdmin && (
                <>
                  <div className="border-t border-border my-1" />
                  <div className="px-3 py-1.5">
                    <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3 h-3" />
                      Admin
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      router.push("/dashboard/admin/comments");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Comments
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      router.push("/dashboard/admin/users");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    Users
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      router.push("/dashboard/admin/seo");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    SEO
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      router.push("/dashboard/admin/affiliates");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <Handshake className="w-4 h-4" />
                    Affiliates
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      router.push("/dashboard/admin/site-data");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <Database className="w-4 h-4" />
                    Site Data
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      router.push("/dashboard/admin/abandoned-carts");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Abandoned Carts
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      router.push("/dashboard/admin/docs-feedback");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    Docs Feedback
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      router.push("/dashboard/admin/ltd-codes");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <Gift className="w-4 h-4" />
                    LTD Codes
                  </button>
                </>
              )}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}

          {/* User button */}
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer",
              isCollapsed && !isMobileOpen && "lg:justify-center lg:p-2"
            )}
            aria-label={userName}
          >
            {userImage ? (
              <Image
                src={userImage}
                alt={userName}
                width={36}
                height={36}
                className="w-9 h-9 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 text-white text-sm font-medium">
                {userInitials}
              </div>
            )}
            {(!isCollapsed || isMobileOpen) && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {userPlan}
                  </p>
                </div>
                <ChevronUp className={cn(
                  "w-4 h-4 text-muted-foreground shrink-0 transition-transform",
                  isUserMenuOpen && "rotate-180"
                )} />
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Fixed tooltip rendered outside sidebar to avoid overflow */}
      {tooltip && isCollapsed && !isMobileOpen && (
        <div
          className="fixed pointer-events-none z-50 rounded-md bg-gray-900 dark:bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-white dark:text-gray-900 whitespace-nowrap shadow-lg"
          style={{ top: tooltip.top, left: 72, transform: "translateY(-50%)" }}
        >
          {tooltip.text}
        </div>
      )}
    </>
  );
}
