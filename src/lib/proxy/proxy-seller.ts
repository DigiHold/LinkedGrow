import {
  ProxyProviderError,
  type ProviderCountry,
  type ProxyAddress,
  type ProxyProvider,
  type ProxyQuote,
} from "./provider";

/**
 * Proxy-Seller, our first supplier of dedicated ISP addresses.
 *
 * Chosen in plan section 5b for one reason above the others: the ordering API
 * has no reseller gate and no minimum spend, so a customer picking a country
 * can have an address bought for them without a human in the loop. IPRoyal
 * carries more countries but puts programmatic ordering behind $10,000 of
 * lifetime spend, and Oxylabs shares an address with up to 3 users.
 *
 * Shapes below are taken from their published Node SDK
 * (github.com/proxy-seller/user-api-nodejs) rather than guessed, including the
 * `{status, data}` envelope and the `paymentId: 1` that means "pay from the
 * account balance".
 *
 * Two behaviours worth knowing before reading the code. **Ordering does not
 * return addresses**: `order/make` answers with an order id, and the addresses
 * appear in `proxy/list/isp`, so a purchase is two calls. And **the API is
 * locked to an IP allowlist** of at most 3 addresses set in their dashboard,
 * which is what makes a leaked key close to harmless and what will make this
 * fail from anywhere unexpected.
 */

const BASE = "https://proxy-seller.com/personal/api/v1";
const PAY_FROM_BALANCE = 1;
/** Their rate limit is 60 requests a minute, which we stay far below. */
const TIMEOUT_MS = 30_000;

/**
 * Every call leaves over IPv4, deliberately.
 *
 * Their API is locked to an allowlist of at most 3 addresses. Node resolves
 * dual-stack hosts to IPv6 first, so a box with both stacks calls out from an
 * address nobody registered and every request comes back "IP not allowed",
 * which is what happened on the first live attempt on 2026-07-30. Three slots
 * is not enough to register both families for a fleet, so the family is pinned
 * here rather than left to the resolver.
 */
let dispatcher: unknown;
async function ipv4Dispatcher(): Promise<unknown> {
  if (dispatcher !== undefined) return dispatcher;
  try {
    const { Agent } = await import("undici");
    dispatcher = new Agent({ connect: { family: 4 } });
  } catch {
    // Older runtime without undici exposed: fall back rather than fail, and
    // the allowlist error will say plainly what went wrong.
    dispatcher = null;
  }
  return dispatcher;
}

interface Envelope<T> {
  status?: string;
  data?: T;
  errors?: Array<{ message?: string }>;
}

/**
 * Their ISP reference list, read from the live API on 2026-07-30 rather than
 * assumed: `data.items` is an object with three arrays, countries are keyed by
 * **alpha3** rather than the two-letter code the rest of the product uses, and
 * periods are string ids like "1m" rather than a number of days.
 */
interface ReferenceList {
  items?: {
    country?: Array<{ id?: number; name?: string; alpha3?: string }>;
    period?: Array<{ id?: string; name?: string }>;
  };
}

/** Their alpha3 to the ISO 3166-1 alpha-2 the product speaks. Only the 24
 *  countries they actually carry, so an unknown code is a catalogue change we
 *  want to notice rather than paper over. */
const ALPHA3_TO_ALPHA2: Record<string, string> = {
  USA: "US", AUT: "AT", BRA: "BR", CAN: "CA", CZE: "CZ", GBR: "GB",
  FRA: "FR", DEU: "DE", HKG: "HK", IND: "IN", ISR: "IL", ITA: "IT",
  JPN: "JP", LVA: "LV", NLD: "NL", POL: "PL", ROU: "RO", SGP: "SG",
  KOR: "KR", ESP: "ES", TWN: "TW", THA: "TH", TUR: "TR", UKR: "UA",
};

/** Their period ids, and roughly how many days each is worth, so a caller can
 *  ask for a term in days without knowing their vocabulary. */
const PERIOD_DAYS: Array<{ id: string; days: number }> = [
  { id: "1w", days: 7 },
  { id: "2w", days: 14 },
  { id: "1m", days: 30 },
  { id: "2m", days: 60 },
  { id: "3m", days: 90 },
  { id: "6m", days: 180 },
  { id: "9m", days: 270 },
  { id: "12m", days: 365 },
];

interface OrderResult {
  orderId?: number;
  total?: number;
  balance?: number;
}

interface CalcResult {
  warning?: string;
  balance?: number;
  total?: number;
  quantity?: number;
  currency?: string;
}

/** `proxy/list/isp` answers with an object holding the rows, not a bare array. */
interface ProxyList {
  items?: ProxyRow[];
}

interface ProxyRow {
  id?: number | string;
  order_id?: number | string;
  ip?: string;
  ip_only?: string;
  protocol?: string;
  port_http?: number | string;
  port_socks?: number | string;
  login?: string;
  password?: string;
  country?: string;
  country_alpha3?: string;
  date_end?: string;
  can_prolong?: boolean;
}

export class ProxySellerProvider implements ProxyProvider {
  readonly name = "proxy-seller";

  constructor(private readonly apiKey: string) {
    if (!apiKey) throw new ProxyProviderError("Missing API key", "proxy-seller");
  }

  private async call<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const agent = await ipv4Dispatcher();
      const response = await fetch(`${BASE}/${this.apiKey}/${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
        ...(agent ? { dispatcher: agent } : {}),
      } as RequestInit);
      const text = await response.text();
      let parsed: Envelope<T>;
      try {
        parsed = JSON.parse(text) as Envelope<T>;
      } catch {
        throw new ProxyProviderError(
          `Non-JSON response from ${path} (HTTP ${response.status})`,
          this.name
        );
      }
      if (parsed.errors?.length) {
        throw new ProxyProviderError(
          parsed.errors[0]?.message ?? `Rejected by ${path}`,
          this.name
        );
      }
      if (!response.ok) {
        throw new ProxyProviderError(
          `HTTP ${response.status} from ${path}`,
          this.name
        );
      }
      return (parsed.data ?? (parsed as unknown)) as T;
    } catch (error) {
      if (error instanceof ProxyProviderError) throw error;
      throw new ProxyProviderError(`Request to ${path} failed`, this.name, error);
    } finally {
      clearTimeout(timer);
    }
  }

  /** Their reference list keys countries and periods by opaque numeric ids, so
   *  every order has to resolve them first. Cached per process because the
   *  catalogue changes on the order of months, not minutes. */
  private reference: Promise<ReferenceList> | null = null;

  private referenceList(): Promise<ReferenceList> {
    this.reference ??= this.call<ReferenceList>("GET", "reference/list/isp");
    return this.reference;
  }

  async countries(): Promise<ProviderCountry[]> {
    const list = await this.referenceList();
    const out: ProviderCountry[] = [];
    for (const row of list.items?.country ?? []) {
      const code = ALPHA3_TO_ALPHA2[(row.alpha3 ?? "").toUpperCase()];
      if (!code) continue;
      out.push({
        code,
        label: row.name ?? code,
        // Their reference list carries no stock figure, so availability is
        // proven by `order/calc` rather than promised here.
        available: 1,
      });
    }
    return out;
  }

  /** Resolves a country code and a term in days to the ids an order needs. */
  private async ids(
    country: string,
    days: number
  ): Promise<{ countryId: number; periodId: string }> {
    const list = await this.referenceList();
    const wanted = country.toUpperCase();
    const row = (list.items?.country ?? []).find(
      (c) => ALPHA3_TO_ALPHA2[(c.alpha3 ?? "").toUpperCase()] === wanted
    );
    if (!row?.id) {
      throw new ProxyProviderError(`No ISP stock listed for ${wanted}`, this.name);
    }
    // The shortest term at or above what was asked for, so a 30-day request
    // never quietly buys a week and expires under a live account.
    const offered = new Set(
      (list.items?.period ?? []).map((p) => String(p.id))
    );
    const chosen =
      PERIOD_DAYS.find((p) => p.days >= days && offered.has(p.id)) ??
      [...PERIOD_DAYS].reverse().find((p) => offered.has(p.id));
    if (!chosen) {
      throw new ProxyProviderError("No rental period on offer", this.name);
    }
    return { countryId: Number(row.id), periodId: chosen.id };
  }

  private payload(countryId: number, periodId: string, quantity: number) {
    return {
      paymentId: PAY_FROM_BALANCE,
      // Fresh credentials per order, so no two addresses share a login.
      generateAuth: "Y",
      countryId,
      periodId,
      quantity,
      authorization: "",
      coupon: "",
      // Their API rejects an empty one with "Set [customTargetName]", and the
      // label shows up in their dashboard, so it may as well say what these
      // addresses are for.
      customTargetName: "LinkedIn",
    };
  }

  async quote(country: string, quantity: number, days: number): Promise<ProxyQuote> {
    const { countryId, periodId } = await this.ids(country, days);
    const result = await this.call<CalcResult>(
      "POST",
      "order/calc",
      this.payload(countryId, periodId, quantity)
    );
    return {
      totalUsd: Number(result.total ?? 0),
      errors: result.warning ? [result.warning] : [],
    };
  }

  async purchase(
    country: string,
    quantity: number,
    days: number
  ): Promise<ProxyAddress[]> {
    const { countryId, periodId } = await this.ids(country, days);

    // Always dry-run first. It costs nothing and it is the only way to see an
    // insufficient-balance warning before the money is gone.
    const check = await this.call<CalcResult>(
      "POST",
      "order/calc",
      this.payload(countryId, periodId, quantity)
    );
    if (check.warning) {
      throw new ProxyProviderError(check.warning, this.name);
    }

    const order = await this.call<OrderResult>(
      "POST",
      "order/make",
      this.payload(countryId, periodId, quantity)
    );
    if (!order.orderId) {
      throw new ProxyProviderError("Order returned no id", this.name);
    }

    // The order does not carry the addresses, so read them back and keep only
    // the rows belonging to this order.
    const listed = await this.call<ProxyList>("GET", "proxy/list/isp");
    const mine = (listed.items ?? []).filter(
      (r) => String(r.order_id) === String(order.orderId)
    );
    if (mine.length === 0) {
      throw new ProxyProviderError(
        `Order ${order.orderId} placed but no addresses came back. Check the dashboard before retrying, the money has already left.`,
        this.name
      );
    }
    return mine.map((r) => this.toAddress(r, country));
  }

  private toAddress(row: ProxyRow, fallbackCountry: string): ProxyAddress {
    const host = row.ip ?? row.ip_only ?? "";
    const port = Number(row.port_socks ?? row.port_http ?? 0);
    if (!host || !port) {
      throw new ProxyProviderError("Address row missing host or port", this.name);
    }
    const end = row.date_end ? new Date(row.date_end.replace(" ", "T")) : null;
    return {
      ref: String(row.id ?? ""),
      host,
      port,
      username: row.login ?? "",
      password: row.password ?? "",
      country: (row.country ?? fallbackCountry).toUpperCase().slice(0, 2),
      // A missing end date is treated as one month out rather than as forever,
      // so the renewal job looks at it instead of ignoring it.
      expiresAt:
        end && !Number.isNaN(end.getTime())
          ? end
          : new Date(Date.now() + 30 * 86_400_000),
    };
  }

  async prolong(ref: string, days: number): Promise<Date> {
    const listed = await this.call<ProxyList>("GET", "proxy/list/isp");
    const row = (listed.items ?? []).find((r) => String(r.id) === String(ref));
    if (!row) {
      throw new ProxyProviderError(`Address ${ref} is not in the account`, this.name);
    }
    const country = (row.country ?? "").toUpperCase().slice(0, 2);
    const { periodId } = await this.ids(country, days);

    const check = await this.call<CalcResult>("POST", "prolong/calc/isp", {
      ids: [ref],
      periodId,
      coupon: "",
    });
    if (check.warning) throw new ProxyProviderError(check.warning, this.name);

    await this.call<OrderResult>("POST", "prolong/make/isp", {
      ids: [ref],
      periodId,
      coupon: "",
    });

    const after = await this.call<ProxyList>("GET", "proxy/list/isp");
    const updated = (after.items ?? []).find((r) => String(r.id) === String(ref));
    const end = updated?.date_end
      ? new Date(updated.date_end.replace(" ", "T"))
      : null;
    return end && !Number.isNaN(end.getTime())
      ? end
      : new Date(Date.now() + days * 86_400_000);
  }

  async balanceUsd(): Promise<number> {
    const result = await this.call<{ summ?: number | string }>("GET", "balance/get");
    return Number(result?.summ ?? 0);
  }

  /**
   * Cheap liveness check for the setup script. There is no `ping` at this base,
   * so the reference list stands in: it is a GET, it costs nothing, and it
   * fails loudly when the calling IP is not on their allowlist, which is the
   * failure worth catching early.
   */
  async ping(): Promise<boolean> {
    try {
      const list = await this.referenceList();
      return (list.items?.country?.length ?? 0) > 0;
    } catch {
      return false;
    }
  }
}
