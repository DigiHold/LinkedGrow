import Link from "next/link";

export function DocsFooter() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              LinkedGrow.ai
            </Link>
            <Link href="/pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/blog" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Blog
            </Link>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Need help?{" "}
            <a href="mailto:contact@linkedgrow.ai" className="text-cyan-600 dark:text-cyan-400 hover:underline">
              Contact support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
