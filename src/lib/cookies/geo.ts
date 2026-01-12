// MaxMind GeoLite2 - Free local database with 99.8% accuracy
// No API calls, runs entirely on server
// Used by major SaaS companies for GDPR geo-detection

import { open, Reader, CountryResponse } from "maxmind";
import * as geolite2 from "geolite2-redist";
import { GeoIpDbName } from "geolite2-redist";
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let readerPromise: Promise<any> | null = null;

// Initialize MaxMind reader (singleton pattern with auto-updates)
async function getReader(): Promise<Reader<CountryResponse>> {
  if (!readerPromise) {
    readerPromise = geolite2.open(GeoIpDbName.Country, (path) => {
      return open<CountryResponse>(path);
    });
  }
  const wrapped = await readerPromise;
  return wrapped as Reader<CountryResponse>;
}

export interface GeoResult {
  isEEA: boolean;
  countryCode: string;
  countryName: string;
}

/**
 * Get user's country from their IP address using MaxMind GeoLite2
 * Server-side only - call from API routes, middleware, or server components
 */
export async function getGeoFromIP(ip: string): Promise<GeoResult> {
  try {
    const maxmind = await getReader();
    const result = maxmind.get(ip);

    if (!result?.country?.iso_code) {
      // Default to EEA if we can't determine location (privacy-safe default)
      return {
        isEEA: true,
        countryCode: "",
        countryName: "Unknown",
      };
    }

    const countryCode = result.country.iso_code;

    return {
      isEEA: EEA_COUNTRIES.has(countryCode),
      countryCode,
      countryName: result.country.names?.en || "Unknown",
    };
  } catch (error) {
    console.error("MaxMind geo lookup error:", error);
    // Default to EEA for safety
    return {
      isEEA: true,
      countryCode: "",
      countryName: "Unknown",
    };
  }
}

/**
 * Get user's IP from request headers
 * Works with Vercel, Cloudflare, and most proxies
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();

  // Vercel
  const vercelIP = headersList.get("x-real-ip");
  if (vercelIP) return vercelIP;

  // Cloudflare
  const cfIP = headersList.get("cf-connecting-ip");
  if (cfIP) return cfIP;

  // Standard proxy header
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    // Get first IP in the chain
    return forwardedFor.split(",")[0].trim();
  }

  // Fallback
  return "127.0.0.1";
}

/**
 * Server-side function to check if user is in EEA
 * Use in API routes, middleware, or server components
 */
export async function isUserInEEA(): Promise<GeoResult> {
  const ip = await getClientIP();
  return getGeoFromIP(ip);
}
