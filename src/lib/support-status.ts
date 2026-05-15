// Shared status badge color logic for support tickets. The rule that closed
// tickets without a resolvedAt show as red (= user ghosted, auto-closed by
// the cron) is duplicated nowhere - everyone calls statusColor().

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export function statusColor(t: { status: TicketStatus; resolvedAt?: number | string | Date | null }): string {
  // Closed without ever being resolved = 14-day auto-close from cron =
  // user went silent. Highlight red so admin can spot dead conversations.
  if (t.status === "closed" && !t.resolvedAt) {
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  }
  switch (t.status) {
    case "open":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    case "in_progress":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "resolved":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "closed":
      return "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
  }
}
