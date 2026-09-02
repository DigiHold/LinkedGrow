export async function register() {
  // Only run in Node.js runtime, not Edge
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { assertEditionAtBoot } = await import("@/lib/edition-boot");
  assertEditionAtBoot();

  const { isCloud } = await import("@/lib/edition");
  if (!isCloud() || !process.env.QSTASH_TOKEN) return;

  try {
    const { Client } = await import("@upstash/qstash");
    const { getAppUrl } = await import("@/lib/app-url");
    const qstash = new Client({ token: process.env.QSTASH_TOKEN });

    const CLEANUP_URL = `${getAppUrl()}/api/cron/cleanup-media`;

    const schedules = await qstash.schedules.list();
    if (!schedules.find((s) => s.destination === CLEANUP_URL)) {
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
