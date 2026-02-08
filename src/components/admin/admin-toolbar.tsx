// Admin Toolbar - Thin bar at top of public pages for admin users
// Only rendered server-side when isAdmin is true
import Link from "next/link";
import { auth } from "@/lib/auth";

interface AdminToolbarProps {
  slug: string;
  status: "draft" | "published";
}

export async function AdminToolbar({ slug, status }: AdminToolbarProps) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-slate-900 text-white text-sm h-10 flex items-center px-4 gap-4 shadow-lg">
      <span className="font-semibold text-cyan-400">Admin</span>
      <div className="h-4 w-px bg-slate-700" />
      <Link
        href={`/admin/pages/${encodeURIComponent(slug)}`}
        className="hover:text-cyan-400 transition-colors"
      >
        Edit Page
      </Link>
      <div className="h-4 w-px bg-slate-700" />
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${
          status === "published"
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-amber-500/20 text-amber-400"
        }`}
      >
        {status === "published" ? "Published" : "Draft"}
      </span>
      <div className="flex-1" />
      <Link href="/admin/pages" className="hover:text-cyan-400 transition-colors">
        All Pages
      </Link>
    </div>
  );
}
