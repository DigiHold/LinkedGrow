import { db } from "../db.ts";
import { log, logError } from "../logger.ts";
import { decryptSecret } from "../crypto.ts";
import { requireEnv, optionalEnv } from "../config.ts";

/**
 * Buying the addresses the dashboard asked for.
 *
 * **The dashboard cannot do this itself.** Proxy-Seller locks their API to an
 * allowlist of at most three addresses, and Vercel functions leave from a pool
 * of hundreds that changes, so a purchase from a request handler would fail for
 * most customers and no amount of registering would fix it. The worker has one
 * fixed address, so it is the only thing in the system that talks to the
 * supplier.
 *
 * The dashboard writes a row with status `ordering` and no credentials. This
 * finds those rows, buys, verifies where the address actually exits, and flips
 * the row to `active`. Until that happens the account has no address and its
 * agents stay paused, which is the rule: no fallback, ever.
 *
 * A failure leaves the row as `ordering` rather than deleting it, so the
 * customer sees something being set up rather than nothing, and the next pass
 * retries. The one case that must never repeat silently is money leaving
 * without an address arriving, which is why the supplier's own dry run comes
 * first on every attempt.
 */

const BASE = "https://proxy-seller.com/personal/api/v1";
const PAY_FROM_BALANCE = 1;
const TERM_DAYS = 30;
/** Below this the fleet is one order away from failing in front of a customer. */
const LOW_BALANCE_USD = 15;

interface Envelope<T> {
  data?: T;
  errors?: Array<{ message?: string }>;
}

/**
 * Every call leaves over IPv4. Node prefers IPv6 on dual-stack hosts, and this
 * box has both, so without pinning it calls out from an address the supplier's
 * allowlist has never seen. That exact failure cost an hour on 2026-07-30.
 */
let dispatcher: unknown;
async function ipv4(): Promise<unknown> {
  if (dispatcher !== undefined) return dispatcher;
  try {
    const { Agent } = await import("undici");
    dispatcher = new Agent({ connect: { family: 4 } });
  } catch {
    dispatcher = null;
  }
  return dispatcher;
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const key = requireEnv("PROXY_SELLER_API_KEY");
  const agent = await ipv4();
  const response = await fetch(`${BASE}/${key}/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
    ...(agent ? { dispatcher: agent } : {}),
  } as RequestInit);
  const parsed = (await response.json()) as Envelope<T>;
  if (parsed.errors?.length) {
    throw new Error(parsed.errors[0]?.message ?? `Rejected by ${path}`);
  }
  return parsed.data as T;
}

const ALPHA2_TO_ID: Record<string, number> = {};

async function countryId(alpha2: string): Promise<number> {
  if (Object.keys(ALPHA2_TO_ID).length === 0) {
    const A3: Record<string, string> = {
      USA: "US", AUT: "AT", BRA: "BR", CAN: "CA", CZE: "CZ", GBR: "GB",
      FRA: "FR", DEU: "DE", HKG: "HK", IND: "IN", ISR: "IL", ITA: "IT",
      JPN: "JP", LVA: "LV", NLD: "NL", POL: "PL", ROU: "RO", SGP: "SG",
      KOR: "KR", ESP: "ES", TWN: "TW", THA: "TH", TUR: "TR", UKR: "UA",
    };
    const ref = await call<{
      items?: { country?: Array<{ id?: number; alpha3?: string }> };
    }>("GET", "reference/list/isp");
    for (const row of ref.items?.country ?? []) {
      const code = A3[(row.alpha3 ?? "").toUpperCase()];
      if (code && row.id) ALPHA2_TO_ID[code] = row.id;
    }
  }
  const id = ALPHA2_TO_ID[alpha2.toUpperCase()];
  if (!id) throw new Error(`No ISP stock listed for ${alpha2}`);
  return id;
}

function payload(id: number, quantity: number) {
  return {
    paymentId: PAY_FROM_BALANCE,
    generateAuth: "Y",
    countryId: id,
    periodId: "1m",
    quantity,
    authorization: "",
    coupon: "",
    // Their API rejects an empty one outright.
    customTargetName: "LinkedIn",
  };
}

interface ProxyRow {
  id?: number | string;
  order_id?: number | string;
  ip?: string;
  port_http?: number | string;
  port_socks?: number | string;
  login?: string;
  password?: string;
  date_end?: string;
}

async function encryptFor(value: string): Promise<string> {
  // The worker only ever decrypts elsewhere, but a bought credential has to be
  // written in the same shape the dashboard reads, so this is the one place it
  // encrypts. Same algorithm, same key, same iv:tag:data format.
  const { createCipheriv, randomBytes } = await import("node:crypto");
  const raw = Buffer.from(requireEnv("ENCRYPTION_KEY"), "hex");
  if (raw.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes of hex");
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", raw, iv);
  let out = cipher.update(value, "utf8", "hex");
  out += cipher.final("hex");
  return `${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${out}`;
}

interface ExitCheck {
  ip: string;
  asn: string | null;
  asnOrg: string | null;
  country: string | null;
  looksHosted: boolean;
  error?: string;
}

const HOSTING = /hosting|datacent|data center|\bserver\b|cloud|\bvps\b|colocation|leaseweb|hostroyale|m247|choopa|quadranet|ovh|hetzner|contabo|digitalocean|linode|vultr|scaleway|amazon|azure/i;

async function checkExit(host: string, port: number, user: string, pass: string): Promise<ExitCheck> {
  const blank: ExitCheck = { ip: "", asn: null, asnOrg: null, country: null, looksHosted: false };
  try {
    const { ProxyAgent } = await import("undici");
    const auth = user ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@` : "";
    const agent = new ProxyAgent({ uri: `http://${auth}${host}:${port}` });
    const r = await fetch("https://ipinfo.io/json", {
      signal: AbortSignal.timeout(20_000),
      dispatcher: agent,
    } as RequestInit);
    if (!r.ok) return { ...blank, error: `lookup returned HTTP ${r.status}` };
    const d = (await r.json()) as { ip?: string; org?: string; country?: string };
    const m = d.org?.match(/^(AS\d+)\s+(.*)$/);
    const asnOrg = m?.[2] ?? d.org ?? null;
    return {
      ip: d.ip ?? "",
      asn: m?.[1] ?? null,
      asnOrg,
      country: d.country ?? null,
      looksHosted: asnOrg ? HOSTING.test(asnOrg) : false,
    };
  } catch (error) {
    return { ...blank, error: error instanceof Error ? error.message : "exit check failed" };
  }
}

/** Buys one address for one waiting row, or leaves it waiting. */
async function fulfil(row: { id: string; country: string }): Promise<void> {
  const id = await countryId(row.country);

  // Dry run first, every time. It is the only way to see an insufficient
  // balance before the money is gone rather than after.
  const calc = await call<{ warning?: string; total?: number }>(
    "POST",
    "order/calc",
    payload(id, 1)
  );
  if (calc.warning) throw new Error(calc.warning);

  const order = await call<{ orderId?: number }>("POST", "order/make", payload(id, 1));
  if (!order.orderId) throw new Error("Order returned no id");

  // The order carries no addresses, so read them back.
  const listed = await call<{ items?: ProxyRow[] }>("GET", "proxy/list/isp");
  const mine = (listed.items ?? []).find(
    (r) => String(r.order_id) === String(order.orderId)
  );
  if (!mine?.ip) {
    throw new Error(
      `Order ${order.orderId} was paid for but no address came back. Check the supplier dashboard before retrying.`
    );
  }

  const host = String(mine.ip);
  const port = Number(mine.port_socks ?? mine.port_http ?? 0);
  const user = String(mine.login ?? "");
  const pass = String(mine.password ?? "");

  const exit = await checkExit(host, port, user, pass);
  if (exit.error || !exit.ip) {
    throw new Error(`Bought ${host} but it did not answer: ${exit.error ?? "no exit"}`);
  }
  if (exit.country && exit.country.toUpperCase() !== row.country.toUpperCase()) {
    throw new Error(
      `Bought ${host} but it exits in ${exit.country} rather than ${row.country}`
    );
  }
  if (exit.looksHosted) {
    log("address exits on what reads as a hosting network", {
      allocation: row.id,
      exit: exit.ip,
      org: exit.asnOrg,
    });
  }

  const end = mine.date_end ? new Date(String(mine.date_end).replace(" ", "T")) : null;
  await db().execute({
    sql: `UPDATE proxy_allocations
             SET host = ?, port = ?, username_encrypted = ?, password_encrypted = ?,
                 provider_ref = ?, status = 'active', expires_at = ?,
                 last_checked_at = ?, last_exit_ip = ?, last_asn = ?, last_asn_org = ?,
                 exit_looks_hosted = ?, updated_at = ?
           WHERE id = ? AND status = 'ordering'`,
    args: [
      host,
      port,
      await encryptFor(user),
      await encryptFor(pass),
      String(mine.id ?? ""),
      end && !Number.isNaN(end.getTime())
        ? Math.floor(end.getTime() / 1000)
        : Math.floor(Date.now() / 1000) + TERM_DAYS * 86_400,
      Math.floor(Date.now() / 1000),
      exit.ip,
      exit.asn,
      exit.asnOrg,
      exit.looksHosted ? 1 : 0,
      Math.floor(Date.now() / 1000),
      row.id,
    ],
  });

  log("address allocated", {
    allocation: row.id,
    country: row.country,
    exit: exit.ip,
    org: exit.asnOrg,
  });
}

/**
 * One pass over everything the dashboard asked for.
 *
 * Called from the worker loop before agents run, so an account that connected a
 * minute ago has its address by the time its first session would open.
 */
export async function fulfilPendingAllocations(): Promise<void> {
  if (!optionalEnv("PROXY_SELLER_API_KEY")) return;

  const { rows } = await db().execute(
    `SELECT id, country FROM proxy_allocations WHERE status = 'ordering' ORDER BY created_at LIMIT 5`
  );
  if (rows.length === 0) return;

  log("addresses to buy", { waiting: rows.length });

  for (const row of rows) {
    const id = String(row.id);
    const country = String(row.country);
    try {
      await fulfil({ id, country });
    } catch (error) {
      // Left as `ordering` on purpose: the customer sees an address being set
      // up rather than nothing, and the next pass tries again.
      logError("could not allocate an address", error, { allocation: id, country });
    }
  }

  try {
    const balance = await call<{ summ?: number | string }>("GET", "balance/get");
    const left = Number(balance?.summ ?? 0);
    if (left < LOW_BALANCE_USD) {
      log("SUPPLIER BALANCE LOW, top it up before the next signup", { usd: left });
    }
  } catch {
    // A balance read failing is not worth stopping a pass over.
  }
}
