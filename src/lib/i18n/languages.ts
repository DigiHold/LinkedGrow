export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", flag: "GB" },
  { code: "fr", name: "French", nativeName: "Francais", flag: "FR" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "DE" },
  { code: "es", name: "Spanish", nativeName: "Espanol", flag: "ES" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "IT" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export const LANGUAGE_STORAGE_KEY = "linkedgrow_language";

export function getLanguageByCode(code: string) {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
}

export function detectBrowserLanguage(): LanguageCode {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;

  // Get browser language
  const browserLang = navigator.language?.split("-")[0] || DEFAULT_LANGUAGE;

  // Check if it's a supported language
  const supported = SUPPORTED_LANGUAGES.find((lang) => lang.code === browserLang);

  return supported ? supported.code : DEFAULT_LANGUAGE;
}

// Map country codes to language codes
const COUNTRY_TO_LANGUAGE: Record<string, LanguageCode> = {
  // French-speaking
  FR: "fr", BE: "fr", CH: "fr", LU: "fr", MC: "fr",
  CA: "fr", // Canada - defaulting to French, could be EN
  // German-speaking
  DE: "de", AT: "de", LI: "de",
  // Spanish-speaking
  ES: "es", MX: "es", AR: "es", CO: "es", PE: "es", CL: "es", VE: "es", EC: "es",
  GT: "es", CU: "es", BO: "es", DO: "es", HN: "es", PY: "es", SV: "es", NI: "es",
  CR: "es", PA: "es", UY: "es",
  // Italian-speaking
  IT: "it", SM: "it", VA: "it",
};

/**
 * Get language from country code (from geolocation)
 */
export function getLanguageFromCountry(countryCode: string): LanguageCode {
  return COUNTRY_TO_LANGUAGE[countryCode.toUpperCase()] || DEFAULT_LANGUAGE;
}

export function getSavedLanguage(): LanguageCode | null {
  if (typeof window === "undefined") return null;

  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved && SUPPORTED_LANGUAGES.some((lang) => lang.code === saved)) {
    return saved as LanguageCode;
  }

  return null;
}

export function saveLanguage(code: LanguageCode) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
}
