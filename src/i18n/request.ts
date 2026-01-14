import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, LanguageCode } from "@/lib/i18n/languages";

// Import all message files statically
import enMessages from "@/messages/en.json";
import frMessages from "@/messages/fr.json";
import deMessages from "@/messages/de.json";
import esMessages from "@/messages/es.json";
import itMessages from "@/messages/it.json";

// Use a more flexible type since not all languages have all sections (e.g., legal texts only in EN/FR)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const messagesMap: Record<string, any> = {
  en: enMessages,
  fr: frMessages,
  de: { ...deMessages, privacy: enMessages.privacy, cookies: enMessages.cookies },
  es: { ...esMessages, privacy: enMessages.privacy, cookies: enMessages.cookies },
  it: { ...itMessages, privacy: enMessages.privacy, cookies: enMessages.cookies },
};

export default getRequestConfig(async () => {
  // Get locale from cookie (set by language selector)
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;

  // Validate the locale
  const isValidLocale = localeCookie && SUPPORTED_LANGUAGES.some(lang => lang.code === localeCookie);
  const locale = isValidLocale ? (localeCookie as LanguageCode) : DEFAULT_LANGUAGE;

  // Get messages for the locale (fallback to English)
  const messages = messagesMap[locale] || messagesMap[DEFAULT_LANGUAGE];

  return {
    locale,
    messages,
  };
});
