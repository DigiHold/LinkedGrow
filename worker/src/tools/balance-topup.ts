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
 * threshold, create the top-up payment and put its URL everywhere the operator
 * will see it (the log, the worker_flags table, and an operations email). One
 * click finishes it.
 *
 * In the cloud this file is run by cron on the VPS (/etc/cron.d/linkedgrow-balance),
 * because the supplier API is IP-allowlisted to that box alone. A self hosted
 * install has no cron.d: the worker's own schedule (cron/pass.ts) calls
 * balanceTopupPass once a day.
 */

const THRESHOLD_USD = 25;
const TOPUP_USD = 100;
const CARD_PAYMENT_ID = 30; // "Visa / MasterCard" in balance/payments/list

export interface BalanceSummary {
  usd: number;
  /** The payment link created today, or null when the balance did not need one. */
  topupUrl: string | null;
}

/** One balance check. A low balance whose top-up could not be created is thrown. */
export async function balanceTopupPass(): Promise<BalanceSummary> {
  const balance = await call<{ summ?: number }>("GET", "balance/get");
  const usd = Number(balance?.summ ?? 0);
  if (usd > THRESHOLD_USD) {
    log("supplier balance is fine", { usd });
    return { usd, topupUrl: null };
  }

  const payment = await call<{ url?: string }>("POST", "balance/add", {
    summ: TOPUP_USD,
    paymentId: CARD_PAYMENT_ID,
  });
  const url = payment?.url;
  if (!url) {
    throw new Error(`supplier balance is down to $${usd} and the top-up creation failed, top up by hand`);
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
  return { usd, topupUrl: url };
}

// The cloud's cron.d entry runs this file directly; the worker imports it.
if (import.meta.filename === process.argv[1]) {
  balanceTopupPass().then(
    () => process.exit(0),
    (error) => {
      log("balance check failed", { error: String(error) });
      process.exit(1);
    }
  );
}
