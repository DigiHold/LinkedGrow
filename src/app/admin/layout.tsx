import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - LinkedGrow",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Admin header */}
      <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">
          <a href="/admin/pages" className="font-bold text-lg text-cyan-400">
            LinkedGrow Admin
          </a>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/admin/pages" className="hover:text-cyan-400 transition-colors">
              Pages
            </a>
          </nav>
          <div className="flex-1" />
          <a
            href="/"
            className="text-sm text-slate-400 hover:text-white transition-colors"
            target="_blank"
          >
            View Site
          </a>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
