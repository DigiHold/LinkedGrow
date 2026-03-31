// Geo detection using Vercel's built-in geo headers
// Fast and reliable - no external database needed

import { headers } from "next/headers";

// EEA country codes (EU + EEA + Switzerland + UK for GDPR)
const EEA_COUNTRIES = new Set([
  // EU Member States
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  // EEA non-EU
  "IS", "LI", "NO",
  // Switzerland (GDPR-equivalent via adequacy decision)
  "CH",
  // UK (GDPR equivalent)
  "GB",
]);

// Country names for common codes
const COUNTRY_NAMES: Record<string, string> = {
  AT: "Austria", BE: "Belgium", BG: "Bulgaria", HR: "Croatia", CY: "Cyprus",
  CZ: "Czech Republic", DK: "Denmark", EE: "Estonia", FI: "Finland", FR: "France",
  DE: "Germany", GR: "Greece", HU: "Hungary", IE: "Ireland", IT: "Italy",
  LV: "Latvia", LT: "Lithuania", LU: "Luxembourg", MT: "Malta", NL: "Netherlands",
  PL: "Poland", PT: "Portugal", RO: "Romania", SK: "Slovakia", SI: "Slovenia",
  ES: "Spain", SE: "Sweden", IS: "Iceland", LI: "Liechtenstein", NO: "Norway",
  CH: "Switzerland", GB: "United Kingdom", US: "United States", CA: "Canada",
  AU: "Australia", NZ: "New Zealand", JP: "Japan", KR: "South Korea",
  SG: "Singapore", HK: "Hong Kong", IN: "India", BR: "Brazil", MX: "Mexico",
};

export interface GeoResult {
  isEEA: boolean;
  countryCode: string;
  countryName: string;
}

/**
 * Server-side function to check if user is in EEA
 * Uses Vercel's built-in geo headers for fast, reliable detection
 */
export async function isUserInEEA(): Promise<GeoResult> {
  try {
    const headersList = await headers();

    // Vercel provides geo headers automatically
    const countryCode = headersList.get("x-vercel-ip-country") || "";

    if (!countryCode) {
      // Default to EEA if we can't determine location (privacy-safe default)
      return {
        isEEA: true,
        countryCode: "",
        countryName: "Unknown",
      };
    }

    return {
      isEEA: EEA_COUNTRIES.has(countryCode),
      countryCode,
      countryName: COUNTRY_NAMES[countryCode] || countryCode,
    };
  } catch (error) {
// Default to EEA for safety
    return {
      isEEA: true,
      countryCode: "",
      countryName: "Unknown",
    };
  }
}
