export async function register() {
  // Only run in Node.js runtime, not Edge
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Fail closed: a rejected instrumentation hook leaves Next serving 500s for ever,
  // so the process ends itself instead. The compiled edition is what the bundles
  // answer, so it is the one compared against the runtime secrets.
  const { EDITION, assertEditionConsistency, isCloud } = await import("@/lib/edition");
  try {
    assertEditionConsistency({ ...process.env, LINKEDGROW_EDITION: EDITION });
  } catch (error) {
    process.stderr.write(`linkedgrow: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }

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
