import { getAllPages, PAGE_TYPE_LABELS } from "@/lib/cms";
import Link from "next/link";

export default async function AdminPagesListPage() {
  const pages = await getAllPages();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pages</h1>
          <p className="text-sm text-slate-500 mt-1">{pages.length} pages total</p>
        </div>
        <Link
          href="/admin/pages/new"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-cyan-600 text-white font-medium text-sm hover:bg-cyan-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Page
        </Link>
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg">No pages yet</p>
          <p className="text-sm mt-1">Create your first page to get started.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3 font-medium">Page</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <div>
                      <Link
                        href={`/admin/pages/${encodeURIComponent(page.slug)}`}
                        className="font-medium text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400"
                      >
                        {page.seoTitle || page.slug}
                      </Link>
                      <p className="text-xs text-slate-400 mt-0.5">/{page.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {PAGE_TYPE_LABELS[page.pageType]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        page.status === "published"
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {page.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {page.updatedAt
                      ? new Date(page.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/pages/${encodeURIComponent(page.slug)}`}
                      className="text-cyan-600 dark:text-cyan-400 hover:underline text-sm"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
