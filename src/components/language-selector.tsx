"use client";

import { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SUPPORTED_LANGUAGES,
  LanguageCode,
  DEFAULT_LANGUAGE,
  detectBrowserLanguage,
  getSavedLanguage,
  saveLanguage,
  getLanguageFromCountry,
} from "@/lib/i18n/languages";

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check saved language first
    const saved = getSavedLanguage();
    if (saved) {
      setCurrentLanguage(saved);
      return;
    }

    // Try geolocation-based detection first, fall back to browser language
    const detectLanguage = async () => {
      try {
        const response = await fetch("/api/geo");
        if (response.ok) {
          const geo = await response.json();
          if (geo.countryCode) {
            const geoLang = getLanguageFromCountry(geo.countryCode);
            setCurrentLanguage(geoLang);
            saveLanguage(geoLang);
            return;
          }
        }
      } catch {
        // Geolocation failed, fall back to browser detection
      }

      // Fallback to browser language detection
      const detected = detectBrowserLanguage();
      setCurrentLanguage(detected);
      saveLanguage(detected);
    };

    detectLanguage();
  }, []);

  const handleSelectLanguage = (code: LanguageCode) => {
    setCurrentLanguage(code);
    saveLanguage(code);
    setIsOpen(false);
    // In a real app, this would trigger a page reload or i18n context update
    // For now, we just save the preference
  };

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9">
        <Globe className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9"
        title={`Language: ${currentLang?.name}`}
      >
        <Globe className="w-4 h-4" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-50 min-w-[180px] bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 overflow-hidden">
            <div className="max-h-[300px] overflow-y-auto">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                    currentLanguage === lang.code
                      ? "bg-slate-100 dark:bg-slate-700 text-cyan-600 dark:text-cyan-400"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className="text-base">{getFlagEmoji(lang.flag)}</span>
                  <span>{lang.nativeName}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
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
