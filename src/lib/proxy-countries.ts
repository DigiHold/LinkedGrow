/**
 * The countries a dedicated residential address can be allocated in.
 *
 * **This list is the supplier's catalogue, read from their API on 2026-07-30
 * and not a wish.** Proxy-Seller carries dedicated ISP addresses in exactly
 * these 24 countries, and offering a country with no stock behind it would
 * promise an address that cannot be allocated, which fails in front of a
 * customer halfway through connecting their account.
 *
 * Thirteen countries were removed the day it was checked, Switzerland,
 * Ireland, Belgium, the Nordics and Australia among them, because nobody sells
 * static ISP there. That is the ceiling of the category rather than a weakness
 * of one supplier: an ISP address is a block leased from a real operator, so
 * coverage stops where the commercial agreements stop. Those customers take the
 * nearest country, which is what the connect dialog tells them to do, or bring
 * their own proxy through the advanced panel.
 *
 * Dedicated ISP proxies are sold and geolocated by country, never by city, so
 * this is the whole of the choice a customer makes. The address must match
 * where the person really is rather than where their audience is, because
 * LinkedIn compares it against the account's own history.
 */
export const PROXY_COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "DE", name: "Germany" },
  { code: "AT", name: "Austria" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czech Republic" },
  { code: "RO", name: "Romania" },
  { code: "LV", name: "Latvia" },
  { code: "UA", name: "Ukraine" },
  { code: "TR", name: "Turkey" },
  { code: "IL", name: "Israel" },
  { code: "IN", name: "India" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "TW", name: "Taiwan" },
  { code: "TH", name: "Thailand" },
  { code: "BR", name: "Brazil" },
] as const;

export type ProxyCountry = (typeof PROXY_COUNTRIES)[number]["code"];

export function isProxyCountry(code: string): code is ProxyCountry {
  return PROXY_COUNTRIES.some((c) => c.code === code);
}

export function countryName(code: string): string {
  return PROXY_COUNTRIES.find((c) => c.code === code)?.name ?? code;
}
