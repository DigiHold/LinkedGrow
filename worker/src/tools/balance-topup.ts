import { db } from "../db.ts";
import { log } from "../logger.ts";
import { call } from "../proxy/fulfil.ts";
import { notifyOps } from "../notify.ts";

/**
 * The daily guard on the supplier balance.
 *
 * Proxy-Seller cannot charge a saved card on its own: `balance/add` creates a
 * payment and hands back a URL that a human must click through (verified live,
 * 2026-08-19). So true auto-recharge is off the table, and this is the next
 * best thing: every morning, read the balance, and the day it drops under the
 * threshold, create the top-up payment and put its URL everywhere Nicolas will
 * see it (the log, the worker_flags table, and an operations email). One click finishes it.
 *
 * Run by cron on the VPS (see /etc/cron.d/linkedgrow-balance), because the
 * supplier API is IP-allowlisted to this box alone.
 */

const THRESHOLD_USD = 25;
const TOPUP_USD = 100;
const CARD_PAYMENT_ID = 30; // "Visa / MasterCard" in balance/payments/list

async function main(): Promise<void> {
  const balance = await call<{ summ?: number }>("GET", "balance/get");
  const usd = Number(balance?.summ ?? 0);
  if (usd > THRESHOLD_USD) {
    log("supplier balance is fine", { usd });
    return;
  }

  const payment = await call<{ url?: string }>("POST", "balance/add", {
    summ: TOPUP_USD,
    paymentId: CARD_PAYMENT_ID,
  });
  const url = payment?.url;
  if (!url) {
    log("BALANCE LOW AND THE TOP-UP CREATION FAILED, top up by hand", { usd });
    process.exitCode = 1;
    return;
  }

  log("SUPPLIER BALANCE LOW, a top-up payment is one click away", { usd, url });
  await db().execute({
    sql: `INSERT INTO worker_flags (key, value, updated_at) VALUES ('supplier-topup-url', ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    args: [url, Math.floor(Date.now() / 1000)],
  });

  await notifyOps(`Proxy balance at $${usd}: one click tops it up to ~$${usd + TOPUP_USD}`, [
    `The Proxy-Seller balance is down to $${usd}. A $${TOPUP_USD} card payment is ready, it just needs the click:`,
    url,
    `Below $${THRESHOLD_USD} the next LinkedIn account signup cannot buy its dedicated address.`,
  ]);
}

main().then(
  () => process.exit(process.exitCode ?? 0),
  (error) => {
    log("balance check failed", { error: String(error) });
    process.exit(1);
  }
);
