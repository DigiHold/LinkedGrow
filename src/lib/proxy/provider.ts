/**
 * The proxy supplier, behind one interface.
 *
 * Plan section 5b: the worker must never know which vendor an address came
 * from. Proxy-Seller is the first implementation because it is the only one
 * found that combines dedicated ISP addresses with an ordering API that has no
 * reseller gate, but the catalogue stops at 24 countries and a single supplier
 * for a whole fleet is a risk on its own. This interface is what makes it
 * possible to add IPRoyal for the missing countries, or move away entirely,
 * without touching a line of agent code.
 *
 * Nothing here talks to the database. Allocation, reuse and the account binding
 * live in `allocate.ts`, so a provider is only ever asked to quote, buy, extend
 * and release.
 */

/** An address as the provider hands it back, before it is bound to anything. */
export interface ProxyAddress {
  /** The provider's own identifier, needed later to prolong or release. */
  ref: string;
  host: string;
  port: number;
  username: string;
  password: string;
  /** ISO 3166-1 alpha-2, upper case. */
  country: string;
  /** End of the paid term. Renewal moves this forward and keeps the address. */
  expiresAt: Date;
}

export interface ProxyQuote {
  /** Total in USD for the quantity and period asked for. */
  totalUsd: number;
  /** What the provider refused, if anything. Empty means the order will pass. */
  errors: string[];
}

export interface ProviderCountry {
  /** ISO 3166-1 alpha-2, upper case. */
  code: string;
  /** The provider's own label, kept for support conversations. */
  label: string;
  /** How many addresses the provider says it can deliver right now. */
  available: number;
}

export interface ProxyProvider {
  readonly name: string;

  /** What this provider can actually deliver today, read live rather than
   *  hardcoded, because a picker offering a country with no stock behind it
   *  promises an address that cannot be allocated. */
  countries(): Promise<ProviderCountry[]>;

  /** Dry run. Returns the price and any validation error without spending. */
  quote(country: string, quantity: number, days: number): Promise<ProxyQuote>;

  /** Buys. Charges the balance and returns the addresses. */
  purchase(country: string, quantity: number, days: number): Promise<ProxyAddress[]>;

  /** Extends the term on an address we already hold, keeping the same IP. */
  prolong(ref: string, days: number): Promise<Date>;

  /** Current balance in USD, so a low one can be alerted on before an order
   *  fails in front of a customer. */
  balanceUsd(): Promise<number>;
}

export class ProxyProviderError extends Error {
  constructor(
    message: string,
    readonly provider: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "ProxyProviderError";
  }
}
