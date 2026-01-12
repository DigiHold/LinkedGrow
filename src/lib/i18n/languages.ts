export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", flag: "GB" },
  { code: "fr", name: "French", nativeName: "Francais", flag: "FR" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "DE" },
  { code: "es", name: "Spanish", nativeName: "Espanol", flag: "ES" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "IT" },
  { code: "pt", name: "Portuguese", nativeName: "Portugues", flag: "PT" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "NL" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "PL" },
  { code: "ja", name: "Japanese", nativeName: "Nihongo", flag: "JP" },
  { code: "ko", name: "Korean", nativeName: "Hangugeo", flag: "KR" },
  { code: "zh", name: "Chinese", nativeName: "Zhongwen", flag: "CN" },
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
