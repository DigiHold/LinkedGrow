/**
 * Without this file a dashboard navigation shows the previous page frozen
 * until the next one's JavaScript has parsed, which is why the app felt slow
 * even when the data was fast. Next streams this instantly on every route
 * change under /dashboard.
 */
export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-10">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
      <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-slate-100 dark:bg-white/5" />

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950"
          />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white lg:col-span-2 dark:border-white/10 dark:bg-slate-950" />
        <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950" />
      </div>
    </div>
  );
}
