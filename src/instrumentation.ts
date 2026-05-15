export async function register() {
  // Only run in Node.js runtime, not Edge
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.QSTASH_TOKEN) return;

  try {
    const { Client } = await import("@upstash/qstash");
    const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

    const APP_URL =
      process.env.NEXT_PUBLIC_APP_URL || "https://linkedgrow.ai";
    const CLEANUP_URL = `${APP_URL}/api/cron/cleanup-media`;
    const AUTO_CLOSE_URL = `${APP_URL}/api/cron/auto-close-tickets`;

    const schedules = await qstash.schedules.list();
    if (!schedules.find((s) => s.destination === CLEANUP_URL)) {
      await qstash.schedules.create({
        destination: CLEANUP_URL,
        cron: "0 4 * * *",
        retries: 3,
      });
    }
    // Auto-close in_progress support tickets that have been waiting on the
    // user for 14+ days. Runs daily at 05:00 UTC, 1h after cleanup-media to
    // spread load.
    if (!schedules.find((s) => s.destination === AUTO_CLOSE_URL)) {
      await qstash.schedules.create({
        destination: AUTO_CLOSE_URL,
        cron: "0 5 * * *",
        retries: 3,
      });
    }
  } catch {
    // QStash schedule setup failed silently
  }
}
