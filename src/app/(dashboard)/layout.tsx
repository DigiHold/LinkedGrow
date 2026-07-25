import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { OnboardingCheck } from "@/components/dashboard/onboarding-check";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // lg-v2 scopes the Host Grotesk headings to the v2 dashboard without
    // touching the marketing pages, which still run on Sora.
    <div className="lg-v2 min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <Sidebar />

        {/* min-w-0 stops wide tables from forcing horizontal page scroll */}
        <div className="relative flex min-h-screen min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="relative flex-1">{children}</main>
        </div>
      </div>

      {/* Setup wizard for first-time users, on any dashboard page */}
      <OnboardingCheck />
    </div>
  );
}
