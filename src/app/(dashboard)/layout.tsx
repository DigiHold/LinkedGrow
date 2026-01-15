import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content - relative for overlay positioning */}
        <main className="flex-1 min-h-screen relative">
          {children}
        </main>
      </div>
    </div>
  );
}
