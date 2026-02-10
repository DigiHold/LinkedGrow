"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
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
  Palette,
  Code,
  Crown,
  Shield,
  Database,
  CreditCard,
  Search,
  Brain,
  MessageSquare,
} from "lucide-react";

// Reddit icon component
function RedditIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 -40 512 512" xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor">
      <path d="m327.832031 316.355469c-17.761719 13.488281-43.945312 21.226562-71.832031 21.226562s-54.070312-7.734375-71.832031-21.226562c-6.597657-5.007813-16.003907-3.722657-21.015625 2.875-5.011719 6.597656-3.722656 16.007812 2.875 21.019531 22.871094 17.367188 55.664062 27.332031 89.972656 27.332031s67.101562-9.964843 89.972656-27.332031c6.597656-5.011719 7.886719-14.421875 2.875-21.019531-5.007812-6.59375-14.417968-7.878907-21.015625-2.875zm0 0"></path>
      <path d="m512 207.804688c0-34.851563-28.351562-63.199219-63.195312-63.199219-13.597657 0-26.691407 4.375-37.449219 12.300781-36.09375-24.6875-83.078125-40.0625-132.953125-43.632812l34.433594-80.335938 73.152343 20.128906c2.925781 23.199219 22.765625 41.207032 46.746094 41.207032 25.988281 0 47.132813-21.144532 47.132813-47.136719 0-25.992188-21.144532-47.136719-47.132813-47.136719-17.417969 0-32.644531 9.5-40.804687 23.585938l-83.75-23.046876c-7.222657-1.980468-14.8125 1.664063-17.769532 8.554688l-44.371094 103.539062c-54.472656 1.726563-106.316406 17.542969-145.402343 44.277344-10.761719-7.925781-23.847657-12.308594-37.433594-12.308594-34.851563.003907-63.203125 28.351563-63.203125 63.203126 0 23.386718 12.644531 44.269531 32.484375 55.226562-.234375 3.011719-.351563 6.027344-.351563 9.035156 0 43.695313 24.019532 84.386719 67.636719 114.582032 41.933594 29.03125 97.417969 45.023437 156.230469 45.023437 58.808594 0 114.292969-15.988281 156.226562-45.023437 43.617188-30.195313 67.640626-70.886719 67.640626-114.582032 0-2.992187-.117188-5.992187-.351563-8.992187 19.839844-10.960938 32.484375-31.855469 32.484375-55.269531zm-79.269531-177.804688c9.449219 0 17.136719 7.6875 17.136719 17.136719s-7.6875 17.136719-17.136719 17.136719c-9.445313 0-17.132813-7.6875-17.132813-17.136719.003906-9.449219 7.6875-17.136719 17.132813-17.136719zm26.003906 209.492188c-7.226563 2.265624-11.632813 9.554687-10.277344 17 .9375 5.144531 1.410157 10.386718 1.410157 15.574218 0 33.558594-19.433594 65.492188-54.714844 89.917969-36.964844 25.589844-86.382813 39.6875-139.152344 39.6875s-102.1875-14.097656-139.152344-39.6875c-35.28125-24.425781-54.714844-56.359375-54.714844-89.917969 0-5.210937.476563-10.460937 1.414063-15.601562 1.359375-7.449219-3.046875-14.746094-10.273437-17.011719-13.917969-4.359375-23.273438-17.078125-23.273438-31.648437 0-18.308594 14.894531-33.199219 33.210938-33.199219 9.597656 0 18.730468 4.179687 25.058593 11.46875 5.234375 6.03125 14.273438 6.90625 20.566407 1.988281 37.050781-28.960938 90.65625-45.578125 147.09375-45.589844h.0625.085937c56.425781.015625 110.027344 16.625 147.078125 45.582032 6.289062 4.917968 15.332031 4.042968 20.566406-1.988282 6.320313-7.285156 15.460938-11.460937 25.078125-11.460937 18.304688 0 33.199219 14.890625 33.199219 33.199219 0 14.597656-9.351562 27.332031-23.265625 31.6875zm0 0"></path>
      <path d="m222.800781 239.9375c0-25.988281-21.144531-47.132812-47.136719-47.132812-25.988281 0-47.132812 21.144531-47.132812 47.132812s21.144531 47.132812 47.132812 47.132812c25.992188 0 47.136719-21.144531 47.136719-47.132812zm-64.269531 0c0-9.449219 7.6875-17.132812 17.132812-17.132812 9.449219 0 17.136719 7.683593 17.136719 17.132812 0 9.445312-7.6875 17.132812-17.136719 17.132812-9.445312 0-17.132812-7.6875-17.132812-17.132812zm0 0"></path>
      <path d="m336.335938 192.804688c-25.992188 0-47.136719 21.144531-47.136719 47.132812s21.144531 47.132812 47.136719 47.132812c25.988281 0 47.132812-21.144531 47.132812-47.132812 0-25.992188-21.144531-47.132812-47.132812-47.132812zm0 64.265624c-9.449219 0-17.136719-7.6875-17.136719-17.132812 0-9.449219 7.6875-17.132812 17.136719-17.132812 9.445312 0 17.132812 7.683593 17.132812 17.132812 0 9.445312-7.6875 17.132812-17.132812 17.132812zm0 0"></path>
    </svg>
  );
}
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
    icon: RedditIcon,
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

  // User display info
  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";
  const userImage = session?.user?.image;
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
          "fixed lg:sticky top-0 left-0 z-40 h-screen flex flex-col bg-white dark:bg-gray-950 border-r border-border transition-all duration-300",
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
          {navigation
            .filter((item) => {
              if (isTeamMember) {
                // Engagement is always hidden for team members (uses owner's LinkedIn)
                if (item.href === "/dashboard/engagement") {
                  return false;
                }
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

        {/* User Section with Custom Menu */}
        <div className="p-3 border-t border-border relative" ref={userMenuRef}>
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
                      router.push("/dashboard/admin/seo-intelligence");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <Brain className="w-4 h-4" />
                    SEO Intelligence
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
            title={isCollapsed && !isMobileOpen ? userName : undefined}
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
    </>
  );
}
