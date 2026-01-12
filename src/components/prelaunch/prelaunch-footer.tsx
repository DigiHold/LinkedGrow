"use client";

import Link from "next/link";

export function PrelaunchFooter() {
  return (
    <footer className="relative z-10 py-8 px-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/prelaunch" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              Linked<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">Grow</span>
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
            <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/cookies" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Cookie Policy
            </Link>
            <a href="mailto:contact@linkedgrow.ai" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Contact
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-slate-500 dark:text-slate-500">
            &copy; {new Date().getFullYear()} LinkedGrow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
