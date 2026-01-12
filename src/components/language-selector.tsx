"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  SUPPORTED_LANGUAGES,
  LanguageCode,
  DEFAULT_LANGUAGE,
  getLanguageFromCountry,
} from "@/lib/i18n/languages";

// Cookie helpers - using secure settings
function setLocaleCookie(locale: string) {
  // Set cookie for 1 year with proper settings for server-side reading
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `NEXT_LOCALE=${locale}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
}

function getLocaleCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
  return match ? match[1] : null;
}

export function LanguageSelector() {
  const t = useTranslations("language");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    // Check cookie first (user's explicit choice)
    const savedLocale = getLocaleCookie();
    if (savedLocale && SUPPORTED_LANGUAGES.some(lang => lang.code === savedLocale)) {
      setCurrentLanguage(savedLocale as LanguageCode);
      return;
    }

    // Use geolocation API to detect country and set language
    const detectLanguage = async () => {
      try {
        const response = await fetch("/api/geo");
        if (response.ok) {
          const geo = await response.json();
          if (geo.countryCode) {
            const langFromCountry = getLanguageFromCountry(geo.countryCode);
            setCurrentLanguage(langFromCountry);
            // Set cookie so next-intl picks it up
            setLocaleCookie(langFromCountry);
            // Refresh to apply the new locale
            startTransition(() => {
              router.refresh();
            });
            return;
          }
        }
      } catch {
        // Geolocation failed, use default
      }

      // Fallback to default English
      setCurrentLanguage(DEFAULT_LANGUAGE);
      setLocaleCookie(DEFAULT_LANGUAGE);
    };

    detectLanguage();
  }, [router]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectLanguage = (code: LanguageCode) => {
    setCurrentLanguage(code);
    setLocaleCookie(code);
    setIsOpen(false);

    // Refresh the page to apply new locale
    startTransition(() => {
      router.refresh();
    });
  };

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-9 px-3 gap-2 rounded-full">
        <Globe className="w-4 h-4 text-slate-500" />
        <span className="hidden sm:inline text-sm font-medium">EN</span>
      </Button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button - Modern pill design */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="h-9 px-3 gap-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
        title={`Language: ${currentLang?.name}`}
      >
        <span className="text-base">{getFlagEmoji(currentLang?.flag || "GB")}</span>
        <span className="hidden sm:inline text-sm font-medium text-slate-700 dark:text-slate-300">
          {currentLang?.code.toUpperCase()}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - ultra high z-index */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998]"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown - modern glassmorphism design with ultra high z-index */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-full mt-2 z-[9999] min-w-[240px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-black/30 border border-slate-200/80 dark:border-slate-700/80 overflow-hidden"
            >
              {/* Header with gradient accent */}
              <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {t("select")}
                  </p>
                </div>
              </div>

              {/* Language List with smooth scrolling */}
              <div className="max-h-[360px] overflow-y-auto py-1.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                {SUPPORTED_LANGUAGES.map((lang, index) => {
                  const isSelected = currentLanguage === lang.code;
                  return (
                    <motion.button
                      key={lang.code}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`w-full px-3 py-2.5 mx-1.5 my-0.5 text-left flex items-center gap-3 rounded-xl transition-all duration-150 ${
                        isSelected
                          ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/20 dark:to-blue-500/20"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800/70"
                      }`}
                      style={{ width: "calc(100% - 12px)" }}
                    >
                      {/* Flag with subtle shadow */}
                      <span className="text-xl drop-shadow-sm">{getFlagEmoji(lang.flag)}</span>

                      {/* Language info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isSelected
                            ? "text-cyan-700 dark:text-cyan-300"
                            : "text-slate-800 dark:text-slate-200"
                        }`}>
                          {lang.nativeName}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                          {lang.name}
                        </p>
                      </div>

                      {/* Check indicator */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600"
                        >
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function getFlagEmoji(countryCode: string): string {
  // Convert country code to flag emoji
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
