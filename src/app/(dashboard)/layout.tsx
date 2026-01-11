import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <MobileHeader />

      <div className="flex">
        {/* Sidebar - Desktop */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 min-h-screen lg:min-h-[calc(100vh-0px)]">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
