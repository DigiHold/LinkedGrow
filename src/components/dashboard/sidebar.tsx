"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  PenLine,
  MessageSquareText,
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
  Palette,
  Code,
  Crown,
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
    name: "Reddit Import",
    href: "/dashboard/reddit",
    icon: MessageSquareText,
    description: "Convert Reddit posts",
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
    description: "Generate scroll-stopping hooks",
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
    name: "Engagement",
    href: "/dashboard/engagement",
    icon: Users,
    description: "Grow your network",
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    description: "Track performance",
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

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    await signOut({ callbackUrl: "/" });
  };

  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";
  const userPlan = planNames[session?.user?.plan || "free"] || "Free Plan";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-0 z-50 w-7.5 h-7.5 rounded-r-xl bg-linkedin text-white shadow-lg flex items-center justify-center touch-target"
        aria-label="Open menu"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

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
          "fixed lg:sticky top-0 left-0 z-100 h-screen flex flex-col bg-white dark:bg-gray-950 border-r border-border transition-all duration-300",
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
              <span className="text-xl font-bold font-display flex gap-[0.07rem] text-slate-900 dark:text-white">
                Linked<span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-blue-600">Grow</span>
              </span>
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
            onClick={() => setIsCollapsed(!isCollapsed)}
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
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all touch-target",
                  isActive
                    ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  isCollapsed && "lg:justify-center lg:px-2"
                )}
                title={isCollapsed ? item.name : undefined}
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
          {session?.user?.plan === "business" && (
            <>
              {(!isCollapsed || isMobileOpen) && (
                <div className="pt-4 pb-2">
                  <div className="flex items-center gap-2 px-3 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    <Crown className="w-3 h-3" />
                    <span>Business</span>
                  </div>
                </div>
              )}
              {businessNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all touch-target",
                      isActive
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent",
                      isCollapsed && "lg:justify-center lg:px-2"
                    )}
                    title={isCollapsed ? item.name : undefined}
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

        {/* Upgrade / Plans Button */}
        <div className="p-3 pt-0">
          <Link
            href="/dashboard/upgrade"
            prefetch={true}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
              session?.user?.plan === "business"
                ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                : "bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02]",
              isCollapsed && "lg:justify-center lg:px-2"
            )}
            title={isCollapsed ? (session?.user?.plan === "business" ? "Our Plans" : "Upgrade") : undefined}
          >
            <Crown
              className={cn(
                "w-5 h-5 shrink-0",
                session?.user?.plan === "business" ? "text-amber-500" : "text-white"
              )}
            />
            {(!isCollapsed || isMobileOpen) && (
              <span className="font-semibold">
                {session?.user?.plan === "business" ? "Our Plans" : "Upgrade"}
              </span>
            )}
          </Link>
        </div>

        {/* User Section with Custom Menu */}
        <div className="p-3 border-t border-border relative" ref={userMenuRef}>
          {/* Menu popup - appears above the button */}
          {isUserMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white dark:bg-gray-900 rounded-lg border border-border shadow-lg overflow-hidden z-50">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
              </div>
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
              {session?.user?.plan === "business" && (
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
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      router.push("/dashboard/settings/branding");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <Palette className="w-4 h-4" />
                    Custom Branding
                  </button>
                </>
              )}
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
              isCollapsed && "lg:justify-center lg:p-2"
            )}
          >
            <div className="w-9 h-9 rounded-full bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 text-white text-sm font-medium">
              {userInitials}
            </div>
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
    </>
  );
}
