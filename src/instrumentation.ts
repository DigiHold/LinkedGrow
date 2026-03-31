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

    const schedules = await qstash.schedules.list();
    const exists = schedules.find((s) => s.destination === CLEANUP_URL);

    if (!exists) {
      await qstash.schedules.create({
        destination: CLEANUP_URL,
        cron: "0 4 * * *",
        retries: 3,
      });
    }
  } catch {
    // QStash schedule setup failed silently
  }
}
