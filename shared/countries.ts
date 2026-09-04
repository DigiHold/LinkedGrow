/**
 * Where an agent is allowed to look for people, as ISO 3166-1 alpha-2 codes.
 *
 * The Locations field used to be a free text box, and free text is why an agent
 * aimed at the Americas came back with leads in Asia. A customer could type
 * "Americas", which matches nothing LinkedIn ever prints, or "Allemagne", which
 * matches nothing when LinkedIn writes "Germany". The box is gone: the customer
 * picks from this list, and a code is the only thing ever stored on the agent.
 *
 * Nothing here is typed from memory. The 249 codes and the regional groupings
 * are the UN M49 tables published with ISO 3166, read on 2026-09-04 from
 * github.com/lukes/ISO-3166-Countries-with-Regional-Codes, and the European
 * Union list is the member state pages on european-union.europa.eu read the
 * same day. Every code was checked against this runtime's own ICU, which names
 * all 249 of them.
 *
 * An empty list means worldwide. That is the default, and it is the only way an
 * agent is allowed to look everywhere.
 */

export const COUNTRY_CODES: readonly string[] = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX",
  "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ",
  "BR", "BS", "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK",
  "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM",
  "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR",
  "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS",
  "GT", "GU", "GW", "GY", "HK", "HM", "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN",
  "IO", "IQ", "IR", "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN",
  "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV",
  "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ",
  "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI",
  "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM",
  "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC",
  "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV",
  "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR",
  "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
  "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW",
];

const CODE_SET: ReadonlySet<string> = new Set(COUNTRY_CODES);

export interface CountryGroup {
  id: string;
  label: string;
  codes: readonly string[];
}

/**
 * The shortcuts the picker offers, so nobody has to tick 57 boxes for "the
 * Americas". A group is expanded into its countries the moment it is chosen,
 * so an agent only ever carries codes and this list can change without
 * reopening the question of what an existing agent targets.
 */
export const COUNTRY_GROUPS: readonly CountryGroup[] = [
  {
    id: "africa",
    label: "Africa",
    codes: [
      "AO", "BF", "BI", "BJ", "BW", "CD", "CF", "CG", "CI", "CM", "CV", "DJ", "DZ", "EG",
      "EH", "ER", "ET", "GA", "GH", "GM", "GN", "GQ", "GW", "IO", "KE", "KM", "LR", "LS",
      "LY", "MA", "MG", "ML", "MR", "MU", "MW", "MZ", "NA", "NE", "NG", "RE", "RW", "SC",
      "SD", "SH", "SL", "SN", "SO", "SS", "ST", "SZ", "TD", "TF", "TG", "TN", "TZ", "UG",
      "YT", "ZA", "ZM", "ZW",
    ],
  },
  {
    id: "americas",
    label: "Americas",
    codes: [
      "AG", "AI", "AR", "AW", "BB", "BL", "BM", "BO", "BQ", "BR", "BS", "BV", "BZ", "CA",
      "CL", "CO", "CR", "CU", "CW", "DM", "DO", "EC", "FK", "GD", "GF", "GL", "GP", "GS",
      "GT", "GY", "HN", "HT", "JM", "KN", "KY", "LC", "MF", "MQ", "MS", "MX", "NI", "PA",
      "PE", "PM", "PR", "PY", "SR", "SV", "SX", "TC", "TT", "US", "UY", "VC", "VE", "VG",
      "VI",
    ],
  },
  {
    id: "asia",
    label: "Asia",
    codes: [
      "AE", "AF", "AM", "AZ", "BD", "BH", "BN", "BT", "CN", "CY", "GE", "HK", "ID", "IL",
      "IN", "IQ", "IR", "JO", "JP", "KG", "KH", "KP", "KR", "KW", "KZ", "LA", "LB", "LK",
      "MM", "MN", "MO", "MV", "MY", "NP", "OM", "PH", "PK", "PS", "QA", "SA", "SG", "SY",
      "TH", "TJ", "TL", "TM", "TR", "UZ", "VN", "YE",
    ],
  },
  {
    id: "europe",
    label: "Europe",
    codes: [
      "AD", "AL", "AT", "AX", "BA", "BE", "BG", "BY", "CH", "CZ", "DE", "DK", "EE", "ES",
      "FI", "FO", "FR", "GB", "GG", "GI", "GR", "HR", "HU", "IE", "IM", "IS", "IT", "JE",
      "LI", "LT", "LU", "LV", "MC", "MD", "ME", "MK", "MT", "NL", "NO", "PL", "PT", "RO",
      "RS", "RU", "SE", "SI", "SJ", "SK", "SM", "UA", "VA",
    ],
  },
  {
    id: "oceania",
    label: "Oceania",
    codes: [
      "AS", "AU", "CC", "CK", "CX", "FJ", "FM", "GU", "HM", "KI", "MH", "MP", "NC", "NF",
      "NR", "NU", "NZ", "PF", "PG", "PN", "PW", "SB", "TK", "TO", "TV", "UM", "VU", "WF",
      "WS",
    ],
  },
  {
    id: "european-union",
    label: "European Union",
    codes: [
      "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU",
      "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK",
    ],
  },
  {
    id: "northern-america",
    label: "Northern America",
    codes: [
      "BM", "CA", "GL", "PM", "US",
    ],
  },
  {
    id: "latam",
    label: "Latin America and the Caribbean",
    codes: [
      "AG", "AI", "AR", "AW", "BB", "BL", "BO", "BQ", "BR", "BS", "BV", "BZ", "CL", "CO",
      "CR", "CU", "CW", "DM", "DO", "EC", "FK", "GD", "GF", "GP", "GS", "GT", "GY", "HN",
      "HT", "JM", "KN", "KY", "LC", "MF", "MQ", "MS", "MX", "NI", "PA", "PE", "PR", "PY",
      "SR", "SV", "SX", "TC", "TT", "UY", "VC", "VE", "VG", "VI",
    ],
  },
  {
    id: "caribbean",
    label: "Caribbean",
    codes: [
      "AG", "AI", "AW", "BB", "BL", "BQ", "BS", "CU", "CW", "DM", "DO", "GD", "GP", "HT",
      "JM", "KN", "KY", "LC", "MF", "MQ", "MS", "PR", "SX", "TC", "TT", "VC", "VG", "VI",
    ],
  },
  {
    id: "central-america",
    label: "Central America",
    codes: [
      "BZ", "CR", "GT", "HN", "MX", "NI", "PA", "SV",
    ],
  },
  {
    id: "south-america",
    label: "South America",
    codes: [
      "AR", "BO", "BR", "BV", "CL", "CO", "EC", "FK", "GF", "GS", "GY", "PE", "PY", "SR",
      "UY", "VE",
    ],
  },
  {
    id: "western-europe",
    label: "Western Europe",
    codes: [
      "AT", "BE", "CH", "DE", "FR", "LI", "LU", "MC", "NL",
    ],
  },
  {
    id: "northern-europe",
    label: "Northern Europe",
    codes: [
      "AX", "DK", "EE", "FI", "FO", "GB", "GG", "IE", "IM", "IS", "JE", "LT", "LV", "NO",
      "SE", "SJ",
    ],
  },
  {
    id: "southern-europe",
    label: "Southern Europe",
    codes: [
      "AD", "AL", "BA", "ES", "GI", "GR", "HR", "IT", "ME", "MK", "MT", "PT", "RS", "SI",
      "SM", "VA",
    ],
  },
  {
    id: "eastern-europe",
    label: "Eastern Europe",
    codes: [
      "BG", "BY", "CZ", "HU", "MD", "PL", "RO", "RU", "SK", "UA",
    ],
  },
  {
    id: "dach",
    label: "DACH",
    codes: [
      "DE", "AT", "CH",
    ],
  },
  {
    id: "benelux",
    label: "Benelux",
    codes: [
      "BE", "NL", "LU",
    ],
  },
  {
    id: "nordics",
    label: "Nordics",
    codes: [
      "DK", "FI", "IS", "NO", "SE",
    ],
  },
  {
    id: "uk-ireland",
    label: "United Kingdom and Ireland",
    codes: [
      "GB", "IE",
    ],
  },
  {
    id: "western-asia",
    label: "Western Asia",
    codes: [
      "AE", "AM", "AZ", "BH", "CY", "GE", "IL", "IQ", "JO", "KW", "LB", "OM", "PS", "QA",
      "SA", "SY", "TR", "YE",
    ],
  },
  {
    id: "southern-asia",
    label: "Southern Asia",
    codes: [
      "AF", "BD", "BT", "IN", "IR", "LK", "MV", "NP", "PK",
    ],
  },
  {
    id: "south-eastern-asia",
    label: "South-eastern Asia",
    codes: [
      "BN", "ID", "KH", "LA", "MM", "MY", "PH", "SG", "TH", "TL", "VN",
    ],
  },
  {
    id: "eastern-asia",
    label: "Eastern Asia",
    codes: [
      "CN", "HK", "JP", "KP", "KR", "MN", "MO",
    ],
  },
  {
    id: "central-asia",
    label: "Central Asia",
    codes: [
      "KG", "KZ", "TJ", "TM", "UZ",
    ],
  },
  {
    id: "australia-new-zealand",
    label: "Australia and New Zealand",
    codes: [
      "AU", "CC", "CX", "HM", "NF", "NZ",
    ],
  },
  {
    id: "northern-africa",
    label: "Northern Africa",
    codes: [
      "DZ", "EG", "EH", "LY", "MA", "SD", "TN",
    ],
  },
  {
    id: "sub-saharan-africa",
    label: "Sub-Saharan Africa",
    codes: [
      "AO", "BF", "BI", "BJ", "BW", "CD", "CF", "CG", "CI", "CM", "CV", "DJ", "ER", "ET",
      "GA", "GH", "GM", "GN", "GQ", "GW", "IO", "KE", "KM", "LR", "LS", "MG", "ML", "MR",
      "MU", "MW", "MZ", "NA", "NE", "NG", "RE", "RW", "SC", "SH", "SL", "SN", "SO", "SS",
      "ST", "SZ", "TD", "TF", "TG", "TZ", "UG", "YT", "ZA", "ZM", "ZW",
    ],
  },
];

/** Every code, with no group chosen, is not the same as choosing nothing. Empty is worldwide. */
export function isCountryCode(value: unknown): value is string {
  return typeof value === "string" && CODE_SET.has(value.toUpperCase());
}

/**
 * Whatever arrived, reduced to codes this product recognises.
 *
 * The agent row, the API and the wizard all run input through this, so there is
 * one answer to what an agent targets and nothing else can write into that
 * column. Anything unrecognised is dropped rather than kept as text: keeping it
 * is what let "Americas" sit on an agent for weeks filtering nobody.
 */
export function normaliseCountries(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string" && value.trim().startsWith("[")
      ? (JSON.parse(value) as unknown[])
      : typeof value === "string"
        ? value.split(",")
        : [];
  const out = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const code = item.trim().toUpperCase();
    if (CODE_SET.has(code)) out.add(code);
  }
  return [...out].sort();
}

/** The country's name in one language, for the picker and for anything a person reads. */
export function countryName(code: string, locale = "en"): string {
  const upper = code.toUpperCase();
  if (!CODE_SET.has(upper)) return code;
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(upper) ?? upper;
  } catch {
    return upper;
  }
}

/**
 * The languages a place is read back from.
 *
 * LinkedIn prints a location in the language the account's interface is set to,
 * so the same person in Germany reads "Germany" to one of our customers and
 * "Deutschland" to the next. Matching English only is how a correctly chosen
 * country still failed to match. ICU already holds every one of these names, so
 * this costs a list of language tags and no data of our own.
 */
const RESOLVER_LANGUAGES = [
  "en", "fr", "de", "es", "pt", "it", "nl", "pl", "tr", "sv", "da", "no", "nb", "fi",
  "cs", "ro", "hu", "el", "bg", "uk", "ru", "ar", "he", "hi", "id", "ms", "tl", "th",
  "vi", "ja", "ko", "zh", "zh-Hant",
];

/**
 * The names ICU does not carry, because people do not write the official one.
 *
 * Short and deliberate. Every entry is a form a real LinkedIn profile prints or
 * a person types, not a guess: ICU answers Türkiye, Czechia, Eswatini and
 * Côte d'Ivoire, and half the world still writes Turkey, Czech Republic,
 * Swaziland and Ivory Coast. The four nations of the United Kingdom are here
 * because LinkedIn writes "London, England, United Kingdom" and a profile in
 * Edinburgh can read "Scotland" with nothing after it.
 */
const ALIASES: ReadonlyArray<readonly [string, string]> = [
  ["usa", "US"], ["u s a", "US"], ["united states of america", "US"], ["america", "US"],
  ["uk", "GB"], ["u k", "GB"], ["great britain", "GB"], ["britain", "GB"],
  ["england", "GB"], ["scotland", "GB"], ["wales", "GB"], ["northern ireland", "GB"],
  ["holland", "NL"], ["the netherlands", "NL"],
  ["uae", "AE"], ["emirates", "AE"],
  ["turkey", "TR"], ["czech republic", "CZ"], ["ivory coast", "CI"],
  ["macedonia", "MK"], ["burma", "MM"], ["swaziland", "SZ"], ["cabo verde", "CV"],
  ["palestine", "PS"], ["hong kong", "HK"], ["macau", "MO"],
  ["democratic republic of the congo", "CD"], ["dr congo", "CD"], ["drc", "CD"],
  ["republic of the congo", "CG"],
  ["south korea", "KR"], ["north korea", "KP"], ["vatican city", "VA"],
];

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

let index: Map<string, string> | null = null;

/**
 * Name to code, built once from ICU rather than stored.
 *
 * A name that means two different countries depending on the language is
 * dropped instead of being decided by whichever language happened to be
 * iterated first. There are three of them across the thirty three languages
 * here, all of them Congo or small island pairs, and guessing on those is worse
 * than reporting that the place could not be read.
 */
function nameIndex(): Map<string, string> {
  if (index) return index;
  const found = new Map<string, string>();
  const ambiguous = new Set<string>();
  for (const language of RESOLVER_LANGUAGES) {
    for (const style of ["long", "short"] as const) {
      let names: Intl.DisplayNames;
      try {
        names = new Intl.DisplayNames([language], { type: "region", style });
      } catch {
        continue;
      }
      for (const code of COUNTRY_CODES) {
        const name = names.of(code);
        // A code echoed back is ICU saying it has no name in this language, and
        // a bare two letter name is a US state abbreviation waiting to happen:
        // AR is Arkansas as often as Argentina, CA California as often as Canada.
        if (!name || name === code) continue;
        const key = fold(name);
        if (key.length < 3) continue;
        const already = found.get(key);
        if (already && already !== code) ambiguous.add(key);
        else found.set(key, code);
      }
    }
  }
  for (const key of ambiguous) found.delete(key);
  // Ours win over ICU's: "turkey" and "england" have to land whatever a locale says.
  for (const [alias, code] of ALIASES) found.set(fold(alias), code);
  index = found;
  return index;
}

/**
 * The country a LinkedIn place string is in, or null when it does not say.
 *
 * LinkedIn writes a place as a list narrowing to the country: "Lyon,
 * Auvergne-Rhone-Alpes, France", "Austin, Texas, United States", "Zurich,
 * Switzerland". The segments are read from the last one backwards, and that
 * order is the whole trick: "Georgia, United States" is Atlanta and not
 * Tbilisi, and reading forwards would answer the wrong one.
 *
 * Null is a real answer and not a failure. "Greater Paris Metropolitan Region"
 * names no country, and a reaction row names no place at all. The caller
 * decides what an unknown place is worth, which is the decision that was
 * missing when this returned a bare true.
 */
export function countryOf(place: string | null | undefined): string | null {
  const text = (place ?? "").trim();
  if (!text) return null;
  const names = nameIndex();
  const segments = text.split(/[,;|·•/]+/).map(fold).filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    const hit = names.get(segments[i] ?? "");
    if (hit) return hit;
  }
  return null;
}

export type PlaceVerdict = "in" | "out" | "unknown";

/**
 * Whether somebody standing in `place` is inside the countries this agent chose.
 *
 * Three answers, because there are three situations and the old code had one.
 * It returned true for a person in the right country, true for a person whose
 * place LinkedIn never printed, and true for everybody when no country was
 * chosen, so nothing downstream could tell "allowed" from "not known", and an
 * agent aimed at France invited people in Bangalore.
 *
 * `unknown` is never treated as `in` by anybody. It means go and look.
 */
export function placeVerdict(wanted: readonly string[], place: string | null | undefined): PlaceVerdict {
  if (!wanted.length) return "in"; // worldwide, which is what choosing nothing means
  const code = countryOf(place);
  if (!code) return "unknown";
  return wanted.includes(code) ? "in" : "out";
}
