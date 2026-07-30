import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { SessionProvider } from "@/components/providers/session-provider";
import { OnboardingCheck } from "@/components/dashboard/onboarding-check";
import { LiveTicker } from "@/components/dashboard/agents/live-ticker";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolved here rather than in the root layout on purpose: the root layout
  // also wraps the marketing pages, and awaiting auth() there would read
  // cookies and turn every statically generated page dynamic. Handing the
  // session to the provider means useSession() is populated on first render
  // instead of costing a /api/auth/session round trip on every page.
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <SidebarProvider>
        {/* lg-v2 scopes the Host Grotesk headings to the v2 dashboard without
            touching the marketing pages, which still run on Sora.
            overflow-x-clip is the standing rule: nothing ever scrolls sideways. */}
        {/* Light: slate-50 page under white cards. Dark: the background token
            sits at 6% lightness and --color-card at 8%, so cards read as
            raised. bg-slate-900 was 11% and inverted that relationship. */}
        <div className="lg-v2 min-h-screen overflow-x-clip bg-slate-50 dark:bg-background">
          <div className="flex">
            <Sidebar />

            {/* min-w-0 stops wide tables from forcing horizontal page scroll */}
            <div className="relative flex min-h-screen min-w-0 flex-1 flex-col">
              <Topbar />
              <main className="relative flex-1">{children}</main>
              {/* One box for the whole dashboard, so a working agent is visible from any page
                  without anybody having to reload. It renders nothing when nothing is happening. */}
              <LiveTicker />
            </div>
          </div>

          {/* Setup wizard for first-time users, on any dashboard page */}
          <OnboardingCheck />
        </div>
      </SidebarProvider>
    </SessionProvider>
  );
}
