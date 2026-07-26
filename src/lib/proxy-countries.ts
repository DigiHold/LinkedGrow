/**
 * The countries a dedicated residential address can be allocated in.
 *
 * Dedicated ISP proxies are sold and geolocated by country, never by city, so
 * this is the whole of the choice a customer makes. The list is what the
 * providers in plan section 5b actually carry; adding one here without stock
 * behind it would promise an address that cannot be allocated.
 *
 * The address must match where the person really is, not where their audience
 * is, because LinkedIn compares it against the account's own history.
 */
export const PROXY_COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" },
  { code: "FR", name: "France" },
  { code: "BE", name: "Belgium" },
  { code: "NL", name: "Netherlands" },
  { code: "DE", name: "Germany" },
  { code: "AT", name: "Austria" },
  { code: "CH", name: "Switzerland" },
  { code: "ES", name: "Spain" },
  { code: "PT", name: "Portugal" },
  { code: "IT", name: "Italy" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czechia" },
  { code: "RO", name: "Romania" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "SG", name: "Singapore" },
  { code: "JP", name: "Japan" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "ZA", name: "South Africa" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "IL", name: "Israel" },
] as const;

export type ProxyCountry = (typeof PROXY_COUNTRIES)[number]["code"];

export function isProxyCountry(code: string): code is ProxyCountry {
  return PROXY_COUNTRIES.some((c) => c.code === code);
}

export function countryName(code: string): string {
  return PROXY_COUNTRIES.find((c) => c.code === code)?.name ?? code;
}
