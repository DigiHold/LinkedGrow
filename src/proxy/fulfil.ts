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

export async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
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

export interface ProxyRow {
  id?: number | string;
  order_id?: number | string;
  ip?: string;
  port_http?: number | string;
  port_socks?: number | string;
  login?: string;
  password?: string;
  date_end?: string;
}

export async function encryptFor(value: string): Promise<string> {
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

export interface ExitCheck {
  ip: string;
  asn: string | null;
  asnOrg: string | null;
  /** Where a geolocation database places this address today. */
  country: string | null;
  /** The country this address is REGISTERED to at the regional registry. */
  registryCountry: string | null;
  looksHosted: boolean;
  error?: string;
}

const HOSTING = /hosting|datacent|data center|\bserver\b|cloud|\bvps\b|colocation|leaseweb|hostroyale|m247|choopa|quadranet|ovh|hetzner|contabo|digitalocean|linode|vultr|scaleway|amazon|azure/i;

/**
 * The country an address is REGISTERED to, which is not the same question as
 * where a geolocation database currently places it.
 *
 * On 2026-07-31 LinkedIn emailed Nicolas three times about the same address,
 * 213.164.108.143. Once it said Paris. Twice it said Vilnius. ipinfo, ip-api
 * and iplocation all called it Paris, so the purchase check passed happily,
 * but the RIPE record for 213.164.108.0/24 says netname BITE-HRS, country LT,
 * UAB Init in Kaunas. The reseller had published a geofeed claiming Paris and
 * some databases believed it while LinkedIn's did not.
 *
 * A geofeed is a claim. The registry entry is a registration. When they
 * disagree the account is seen from two countries on different days, which no
 * real person does, and it is worse than being seen from one wrong country
 * consistently: the fingerprint says Europe/Paris while the address says
 * Vilnius, and that pair is a textbook proxy tell.
 *
 * Queried directly rather than through the proxy: this is a question about the
 * address, not from it. RDAP is the standard interface every registry serves,
 * and rdap.org routes to whichever one owns the block.
 */
export async function registryCountry(ip: string): Promise<string | null> {
  for (const url of [`https://rdap.org/ip/${ip}`, `https://rdap.db.ripe.net/ip/${ip}`]) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15_000),
        redirect: "follow",
      });
      if (!res.ok) continue;
      const body = (await res.json()) as { country?: string };
      if (body.country) return body.country.toUpperCase();
    } catch {
      // Try the other one. A registry being unreachable must not block a
      // purchase for ever, and the caller decides what to do with null.
    }
  }
  return null;
}

export async function checkExit(host: string, port: number, user: string, pass: string): Promise<ExitCheck> {
  const blank: ExitCheck = {
    ip: "",
    asn: null,
    asnOrg: null,
    country: null,
    registryCountry: null,
    looksHosted: false,
  };
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
    const ip = d.ip ?? "";
    return {
      ip,
      asn: m?.[1] ?? null,
      asnOrg,
      country: d.country ?? null,
      registryCountry: ip ? await registryCountry(ip) : null,
      looksHosted: asnOrg ? HOSTING.test(asnOrg) : false,
    };
  } catch (error) {
    return { ...blank, error: error instanceof Error ? error.message : "exit check failed" };
  }
}


/**
 * Takes an address out of the buffer instead of buying one.
 *
 * The buffer is every active allocation in this country with nobody attached:
 * one returned by a cancelled account, or one bought and never assigned. The
 * UPDATE names the free row in its WHERE clause, so two passes racing for the
 * same spare means exactly one of them gets it.
 */
async function claimFromPool(row: { id: string; country: string }): Promise<boolean> {
  const { rows } = await db().execute({
    sql: `SELECT id FROM proxy_allocations
           WHERE status = 'active' AND linkedin_account_id IS NULL AND country = ?
           ORDER BY created_at LIMIT 1`,
    args: [row.country],
  });
  const spare = rows[0];
  if (!spare) return false;

  const now = Math.floor(Date.now() / 1000);
  const { rows: owner } = await db().execute({
    sql: `SELECT linkedin_account_id, workspace_id FROM proxy_allocations WHERE id = ?`,
    args: [row.id],
  });
  const accountId = owner[0]?.linkedin_account_id ?? null;
  const workspaceId = owner[0]?.workspace_id ?? null;

  const taken = await db().execute({
    sql: `UPDATE proxy_allocations
             SET linkedin_account_id = ?, workspace_id = COALESCE(?, workspace_id), updated_at = ?
           WHERE id = ? AND status = 'active' AND linkedin_account_id IS NULL`,
    args: [accountId, workspaceId, now, String(spare.id)],
  });
  if (Number(taken.rowsAffected ?? 0) !== 1) return false;

  // The waiting row has served its purpose; the account now points at the spare.
  await db().batch([
    {
      sql: `UPDATE linkedin_accounts SET proxy_allocation_id = ?, updated_at = ? WHERE id = ?`,
      args: [String(spare.id), now, String(accountId ?? "")],
    },
    { sql: `DELETE FROM proxy_allocations WHERE id = ?`, args: [row.id] },
  ]);

  log("address taken from the buffer instead of bought", {
    allocation: String(spare.id),
    country: row.country,
  });
  return true;
}

/**
 * The login and password for an order, which do not live on the proxy row.
 *
 * `generateAuth: "Y"` on the order does create them, and the proxy listing then
 * reports an empty login and an empty password, which reads exactly like "this
 * address needs no credentials". It is not: the credentials are their own
 * objects, listed separately and tied back by an order number that starts with
 * the order id. Reading the proxy row alone produces an address that times out
 * on every request, which is what happened on 2026-07-30.
 */
export async function credentialsForOrder(
  orderId: string | number
): Promise<{ login: string; password: string } | null> {
  const list = await call<Array<{ login?: string; password?: string; orderNumber?: string; active?: boolean }>>(
    "GET",
    "auth/list"
  );
  const prefix = `${orderId}_`;
  const found = (list ?? []).find(
    (a) => a.active !== false && String(a.orderNumber ?? "").startsWith(prefix)
  );
  if (!found?.login) return null;
  return { login: String(found.login), password: String(found.password ?? "") };
}

/**
 * The address belonging to an order, waited for rather than read once.
 *
 * The supplier pays the order first and provisions the address a moment later,
 * so the listing is empty for a few seconds afterwards. Reading it once, two
 * seconds after buying, is what turned a provisioning delay into a second
 * purchase: the lookup found nothing, the row stayed waiting, and the next pass
 * bought another one. Two French addresses, five minutes apart, on 2026-07-30.
 */
export async function addressForOrder(orderId: string | number): Promise<ProxyRow | null> {
  const deadline = Date.now() + 90_000;
  for (let attempt = 0; ; attempt++) {
    const listed = await call<{ items?: ProxyRow[] }>("GET", "proxy/list/isp");
    const mine = (listed.items ?? []).find(
      (r) => String(r.order_id) === String(orderId)
    );
    if (mine?.ip) return mine;
    if (Date.now() >= deadline) return null;
    await new Promise((r) => setTimeout(r, Math.min(3_000 + attempt * 2_000, 15_000)));
  }
}

/** Records that this row's money is spent, before anything else can fail. */
async function recordOrder(rowId: string, orderId: string | number): Promise<void> {
  await db().execute({
    sql: `UPDATE proxy_allocations SET provider_ref = ?, updated_at = ? WHERE id = ?`,
    args: [String(orderId), Math.floor(Date.now() / 1000), rowId],
  });
}

/**
 * Buys one address for one waiting row, or leaves it waiting.
 *
 * A row that already carries a provider_ref has already been paid for, and this
 * will not buy it a second time under any circumstances. It goes looking for
 * the address that order bought instead.
 */
async function fulfil(row: { id: string; country: string; providerRef: string }): Promise<void> {
  let orderId = row.providerRef;

  if (!orderId) {
    // An address already paid for and not attached to anybody is worth more
    // than a new one: same country, same term already running. Until now every
    // account bought its own even when the buffer had one sitting free, which
    // is the plan's own model (5c) not being implemented rather than a choice.
    const reused = await claimFromPool(row);
    if (reused) return;

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

    // Written down immediately, before the address lookup, the exit check or
    // anything else that can throw. From this line on, no failure can cause
    // this row to be bought again.
    orderId = String(order.orderId);
    await recordOrder(row.id, orderId);
  }

  const mine = await addressForOrder(orderId);
  if (!mine?.ip) {
    throw new Error(
      `Order ${orderId} is paid and its address has not appeared yet. The next pass will look again without buying anything.`
    );
  }

  const host = String(mine.ip);
  // The HTTP port, because everything downstream speaks HTTP CONNECT: undici's
  // ProxyAgent here and Chrome's --proxy-server in the driver. Preferring the
  // socks port meant every single request through a bought address timed out.
  const port = Number(mine.port_http ?? mine.port_socks ?? 0);
  const auth = await credentialsForOrder(orderId);
  const user = auth?.login ?? String(mine.login ?? "");
  const pass = auth?.password ?? String(mine.password ?? "");

  const exit = await checkExit(host, port, user, pass);
  if (exit.error || !exit.ip) {
    throw new Error(`Bought ${host} but it did not answer: ${exit.error ?? "no exit"}`);
  }
  if (exit.country && exit.country.toUpperCase() !== row.country.toUpperCase()) {
    throw new Error(
      `Bought ${host} but it exits in ${exit.country} rather than ${row.country}`
    );
  }
  // The registry, second, and it is the one that catches a reseller's geofeed.
  // See registryCountry: a geolocation database can be talked into saying Paris
  // about a Lithuanian block, and LinkedIn's did not agree.
  if (
    exit.registryCountry &&
    exit.registryCountry !== row.country.toUpperCase()
  ) {
    throw new Error(
      `Bought ${host} and geolocation calls it ${exit.country}, but it is registered in ${exit.registryCountry}, not ${row.country}. Platforms follow the registration, so this address would have the account signing in from two different countries.`
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
      // The ORDER id, not the proxy row id. It is what says this row has been
      // paid for, and overwriting it here would let a later failure buy again.
      String(orderId),
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
    `SELECT id, country, COALESCE(provider_ref, '') AS provider_ref
       FROM proxy_allocations
      WHERE status = 'ordering'
      ORDER BY created_at
      LIMIT 5`
  );
  if (rows.length === 0) return;

  const paid = rows.filter((r) => String(r.provider_ref ?? "")).length;
  log("addresses to set up", { waiting: rows.length, alreadyPaid: paid });

  for (const row of rows) {
    const id = String(row.id);
    const country = String(row.country);
    const providerRef = String(row.provider_ref ?? "");
    try {
      await fulfil({ id, country, providerRef });
    } catch (error) {
      // Left as `ordering` on purpose: the customer sees an address being set
      // up rather than nothing, and the next pass tries again. It cannot buy
      // twice, because the order id is written down the moment it exists.
      logError("could not finish setting up an address", error, {
        allocation: id,
        country,
        order: providerRef || "none yet",
      });
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
