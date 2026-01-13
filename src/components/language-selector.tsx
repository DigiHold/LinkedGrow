"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  SUPPORTED_LANGUAGES,
  LanguageCode,
  DEFAULT_LANGUAGE,
  getLanguageFromCountry,
} from "@/lib/i18n/languages";

// Flag SVG components
const flags: Record<string, React.ReactNode> = {
  GB: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5">
      <circle cx="256" cy="256" fill="#fff" r="256"/>
      <g fill="#d80027">
        <path d="m244.87 256h267.13c0-23.106-3.08-45.49-8.819-66.783h-258.311z"/>
        <path d="m244.87 122.435h229.556c-15.671-25.572-35.708-48.175-59.07-66.783h-170.486z"/>
        <path d="m256 512c60.249 0 115.626-20.824 159.356-55.652h-318.712c43.73 34.828 99.107 55.652 159.356 55.652z"/>
        <path d="m37.574 389.565h436.852c12.581-20.529 22.338-42.969 28.755-66.783h-494.362c6.417 23.814 16.174 46.254 28.755 66.783z"/>
      </g>
      <path d="m118.584 39.978h23.329l-21.7 15.765 8.289 25.509-21.699-15.765-21.699 15.765 7.16-22.037c-19.106 15.915-35.852 34.561-49.652 55.337h7.475l-13.813 10.035c-2.152 3.59-4.216 7.237-6.194 10.938l6.596 20.301-12.306-8.941c-3.059 6.481-5.857 13.108-8.372 19.873l7.267 22.368h26.822l-21.7 15.765 8.289 25.509-21.699-15.765-12.998 9.444c-1.301 10.458-1.979 21.11-1.979 31.921h256c0-141.384 0-158.052 0-256-50.572 0-97.715 14.67-137.416 39.978zm9.918 190.422-21.699-15.765-21.699 15.765 8.289-25.509-21.7-15.765h26.822l8.288-25.509 8.288 25.509h26.822l-21.7 15.765zm-8.289-100.083 8.289 25.509-21.699-15.765-21.699 15.765 8.289-25.509-21.7-15.765h26.822l8.288-25.509 8.288 25.509h26.822zm100.115 100.083-21.699-15.765-21.699 15.765 8.289-25.509-21.7-15.765h26.822l8.288-25.509 8.288 25.509h26.822l-21.7 15.765zm-8.289-100.083 8.289 25.509-21.699-15.765-21.699 15.765 8.289-25.509-21.7-15.765h26.822l8.288-25.509 8.288 25.509h26.822zm0-74.574 8.289 25.509-21.699-15.765-21.699 15.765 8.289-25.509-21.7-15.765h26.822l8.288-25.509 8.288 25.509h26.822z" fill="#0052b4"/>
    </svg>
  ),
  FR: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5">
      <circle cx="256" cy="256" fill="#fff" r="256"/>
      <path d="m512 256c0-110.071-69.472-203.906-166.957-240.077v480.155c97.485-36.172 166.957-130.007 166.957-240.078z" fill="#d80027"/>
      <path d="m0 256c0 110.071 69.473 203.906 166.957 240.077v-480.154c-97.484 36.171-166.957 130.006-166.957 240.077z" fill="#0052b4"/>
    </svg>
  ),
  DE: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5">
      <path d="m15.923 345.043c36.171 97.484 130.006 166.957 240.077 166.957s203.906-69.473 240.077-166.957l-240.077-22.26z" fill="#ffda44"/>
      <path d="m256 0c-110.071 0-203.906 69.472-240.077 166.957l240.077 22.26 240.077-22.261c-36.171-97.484-130.006-166.956-240.077-166.956z"/>
      <path d="m15.923 166.957c-10.29 27.733-15.923 57.729-15.923 89.043s5.633 61.31 15.923 89.043h480.155c10.29-27.733 15.922-57.729 15.922-89.043s-5.632-61.31-15.923-89.043z" fill="#d80027"/>
    </svg>
  ),
  ES: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5">
      <path d="m0 256c0 31.314 5.633 61.31 15.923 89.043l240.077 22.261 240.077-22.261c10.29-27.733 15.923-57.729 15.923-89.043s-5.633-61.31-15.923-89.043l-240.077-22.261-240.077 22.261c-10.29 27.733-15.923 57.729-15.923 89.043z" fill="#ffda44"/>
      <g fill="#d80027">
        <path d="m496.077 166.957c-36.171-97.484-130.006-166.957-240.077-166.957s-203.906 69.473-240.077 166.957z"/>
        <path d="m15.923 345.043c36.171 97.484 130.006 166.957 240.077 166.957s203.906-69.473 240.077-166.957z"/>
      </g>
    </svg>
  ),
  IT: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5">
      <circle cx="256" cy="256" fill="#fff" r="256"/>
      <path d="m512 256c0-110.071-69.472-203.906-166.957-240.077v480.155c97.485-36.172 166.957-130.007 166.957-240.078z" fill="#d80027"/>
      <path d="m0 256c0 110.071 69.472 203.906 166.957 240.077v-480.154c-97.485 36.171-166.957 130.006-166.957 240.077z" fill="#6da544"/>
    </svg>
  ),
  PT: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5">
      <path d="m0 256c0 110.07 69.472 203.905 166.955 240.076l22.262-240.077-22.262-240.076c-97.483 36.172-166.955 130.006-166.955 240.077z" fill="#6da544"/>
      <path d="m512 256c0-141.384-114.616-256-256-256-31.314 0-61.311 5.633-89.045 15.923v480.154c27.734 10.291 57.731 15.923 89.045 15.923 141.384 0 256-114.616 256-256z" fill="#d80027"/>
      <circle cx="166.957" cy="256" fill="#ffda44" r="89.043"/>
      <path d="m116.87 211.478v55.652c0 27.662 22.424 50.087 50.087 50.087s50.087-22.424 50.087-50.087v-55.652z" fill="#d80027"/>
      <path d="m166.957 283.826c-9.206 0-16.696-7.49-16.696-16.696v-22.26h33.391v22.261c0 9.205-7.49 16.695-16.695 16.695z" fill="#f0f0f0"/>
    </svg>
  ),
  NL: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-5 h-5">
      <circle cx="256" cy="256" fill="#f0f0f0" r="256"/>
      <path d="m256 0c-110.071 0-203.906 69.472-240.077 166.957h480.155c-36.172-97.485-130.007-166.957-240.078-166.957z" fill="#a2001d"/>
      <path d="m256 512c110.071 0 203.906-69.472 240.077-166.957h-480.154c36.171 97.485 130.006 166.957 240.077 166.957z" fill="#0052b4"/>
    </svg>
  ),
  PL: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512.01" className="w-5 h-5">
      <path d="m256 512c141.38 0 256-114.63 256-256s-114.62-256-256-256-256 114.63-256 256 114.62 256 256 256z" fill="#fff"/>
      <path d="m512 256c0 141.37-114.63 256-256 256s-256-114.62-256-256" fill="#d80027"/>
    </svg>
  ),
};

// Cookie helpers
function setLocaleCookie(locale: string) {
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const savedLocale = getLocaleCookie();
    if (savedLocale && SUPPORTED_LANGUAGES.some(lang => lang.code === savedLocale)) {
      setCurrentLanguage(savedLocale as LanguageCode);
      return;
    }

    const detectLanguage = async () => {
      try {
        const response = await fetch("/api/geo");
        if (response.ok) {
          const geo = await response.json();
          if (geo.countryCode) {
            const langFromCountry = getLanguageFromCountry(geo.countryCode);
            setCurrentLanguage(langFromCountry);
            setLocaleCookie(langFromCountry);
            startTransition(() => {
              router.refresh();
            });
            return;
          }
        }
      } catch {
        // Geolocation failed, use default
      }

      setCurrentLanguage(DEFAULT_LANGUAGE);
      setLocaleCookie(DEFAULT_LANGUAGE);
    };

    detectLanguage();
  }, [router]);

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

    startTransition(() => {
      router.refresh();
    });
  };

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full">
        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700" />
      </Button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button - Flag only */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="h-9 w-9 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        title={currentLang?.name}
      >
        {flags[currentLang?.flag || "GB"]}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998]"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-full mt-2 z-[9999] min-w-[200px] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden py-1"
            >
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = currentLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`w-full px-3 py-2.5 text-left flex items-center gap-3 transition-colors ${
                      isSelected
                        ? "bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
                        : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {flags[lang.flag]}
                    <span className="text-sm font-medium">{lang.nativeName}</span>
                    {isSelected && <Check className="w-4 h-4 ml-auto" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
