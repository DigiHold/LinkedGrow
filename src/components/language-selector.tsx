"use client";

import { useState, useEffect, useRef } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  SUPPORTED_LANGUAGES,
  LanguageCode,
  DEFAULT_LANGUAGE,
  getSavedLanguage,
  saveLanguage,
  getLanguageFromCountry,
} from "@/lib/i18n/languages";

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    // Check saved language first
    const saved = getSavedLanguage();
    if (saved) {
      setCurrentLanguage(saved);
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
            saveLanguage(langFromCountry);
            return;
          }
        }
      } catch {
        // Geolocation failed, use default
      }

      // Fallback to default English
      setCurrentLanguage(DEFAULT_LANGUAGE);
      saveLanguage(DEFAULT_LANGUAGE);
    };

    detectLanguage();
  }, []);

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
    saveLanguage(code);
    setIsOpen(false);
    // In a real app, this would trigger a page reload or i18n context update
    // For now, we just save the preference
  };

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-9 px-3 gap-2">
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline text-sm">EN</span>
      </Button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3 gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
        title={`Language: ${currentLang?.name}`}
      >
        <span className="text-lg">{getFlagEmoji(currentLang?.flag || "GB")}</span>
        <span className="hidden sm:inline text-sm font-medium">{currentLang?.code.toUpperCase()}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop with higher z-index */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100]"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown with much higher z-index */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 top-full mt-2 z-[101] min-w-[220px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Select Language
                </p>
              </div>

              {/* Language List */}
              <div className="max-h-[320px] overflow-y-auto py-2">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = currentLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-all ${
                        isSelected
                          ? "bg-cyan-50 dark:bg-cyan-900/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="text-xl">{getFlagEmoji(lang.flag)}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isSelected
                            ? "text-cyan-700 dark:text-cyan-400"
                            : "text-slate-700 dark:text-slate-300"
                        }`}>
                          {lang.nativeName}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {lang.name}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                      )}
                    </button>
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
