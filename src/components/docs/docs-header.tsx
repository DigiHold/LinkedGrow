"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Search, X, ArrowRight, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface SearchResult {
  title: string;
  description: string;
  category: string;
  categoryTitle: string;
  slug: string;
}

interface DocsHeaderProps {
  searchIndex?: SearchResult[];
}

export function DocsHeader({ searchIndex = [] }: DocsHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setQuery("");
        setResults([]);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const filtered = searchIndex.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.categoryTitle.toLowerCase().includes(q)
    );
    setResults(filtered.slice(0, 8));
  }, [query, searchIndex]);

  function navigateToResult(result: SearchResult) {
    router.push(`/docs/${result.category}/${result.slug}`);
    setSearchOpen(false);
    setQuery("");
    setResults([]);
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/docs" className="flex items-center gap-2">
              <div className="shrink-0 w-8 h-8 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 379 230" className="shrink-0 w-4 h-4 text-white" fill="currentColor">
                  <path d="M205.9185,32.0339c.9512,8.7484,8.8874,15.128,17.6358,14.1767l88.8761-9.6638-93.389,116.1758-93.3595-75.0479c-6.8339-5.4935-16.9741-4.3909-22.4676,2.443L3.9774,203.5681c-5.4935,6.8339-4.3909,16.9741,2.443,22.4676,6.8339,5.4935,16.9741,4.3909,22.4676-2.443l89.2246-110.9953,93.3595,75.0479c6.8339,5.4935,16.9741,4.3909,22.4676-2.443l103.4013-128.631,9.6638,88.8761c.9512,8.7484,8.8874,15.128,17.6358,14.1767s15.128-8.8874,14.1767-17.6358l-13.8363-127.25c-.9512-8.7484-8.8874-15.128-17.6358-14.1767l-127.25,13.8363c-8.7484.9512-15.128,8.8874-14.1767,17.6358Z"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                Linked<span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-blue-600">Grow</span>
              </span>
            </Link>
            <span className="hidden sm:inline-block text-sm font-medium text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-6">
              Documentation
            </span>
            <Link href="/" className="hidden sm:inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
              <ArrowRight className="w-3 h-3 rotate-180" />
              Back to LinkedGrow.ai
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search docs...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-mono bg-slate-200 dark:bg-slate-700 rounded">
                <span className="text-xs">&#8984;</span>K
              </kbd>
            </button>
            {status === "authenticated" && session?.user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg transition-all"
              >
                Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className="px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg shadow-lg shadow-cyan-500/20 transition-all"
                >
                  Start Free
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {searchOpen && (
        <div className="fixed inset-0 z-[100]">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setSearchOpen(false); setQuery(""); setResults([]); }} />
          <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl px-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="flex items-center gap-3 px-4 border-b border-slate-200 dark:border-slate-700">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search documentation..."
                  className="flex-1 py-4 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 outline-none text-base"
                />
                <button onClick={() => { setSearchOpen(false); setQuery(""); setResults([]); }} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {results.length > 0 && (
                <div className="max-h-80 overflow-y-auto p-2">
                  {results.map((result, i) => (
                    <button
                      key={`${result.category}-${result.slug}`}
                      onClick={() => navigateToResult(result)}
                      className={`w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${i === 0 ? "bg-slate-50 dark:bg-slate-800/50" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{result.title}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{result.categoryTitle} - {result.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {query.trim() && results.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No results found for &ldquo;{query}&rdquo;
                </div>
              )}

              {!query.trim() && (
                <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  Type to search across all documentation
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
