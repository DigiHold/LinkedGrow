"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface GoogleFont {
  family: string;
  category: string;
}

// Fonts to exclude - icon fonts, symbols, and fonts that don't render text properly
const EXCLUDED_FONTS = new Set([
  // Icon fonts
  "Material Icons",
  "Material Icons Outlined",
  "Material Icons Round",
  "Material Icons Sharp",
  "Material Icons Two Tone",
  "Material Symbols Outlined",
  "Material Symbols Rounded",
  "Material Symbols Sharp",
  "Noto Color Emoji",
  "Noto Emoji",
  // Symbol/special fonts
  "Noto Sans Symbols",
  "Noto Sans Symbols 2",
  "Noto Sans Math",
  "Noto Sans SignWriting",
  "Noto Music",
  // Fonts that often have rendering issues
  "Noto Sans Anatolian Hieroglyphs",
  "Noto Sans Cuneiform",
  "Noto Sans Egyptian Hieroglyphs",
  "Noto Sans Linear A",
  "Noto Sans Linear B",
  "Noto Sans Mayan Numerals",
  "Noto Sans Ogham",
  "Noto Sans Old Italic",
  "Noto Sans Old Persian",
  "Noto Sans Runic",
]);

// Categories that are not suitable for general text
const EXCLUDED_CATEGORIES = new Set<string>([
  // These are typically specialized fonts - empty for now but typed for future use
]);

// Cache for fonts list
let fontsCache: GoogleFont[] | null = null;
let fontsCachePromise: Promise<GoogleFont[]> | null = null;

// Track loaded fonts to avoid duplicate loading
const loadedFonts = new Set<string>();

function loadGoogleFont(fontName: string) {
  if (loadedFonts.has(fontName)) return;

  const link = document.createElement("link");
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, "+")}:wght@400;500;600;700&display=swap`;
  link.rel = "stylesheet";
  document.head.appendChild(link);
  loadedFonts.add(fontName);
}

function isValidTextFont(font: { family: string; category: string; subsets?: string[] }): boolean {
  // Exclude known icon/symbol fonts
  if (EXCLUDED_FONTS.has(font.family)) return false;

  // Exclude icon fonts by name pattern
  if (font.family.toLowerCase().includes("icon")) return false;
  if (font.family.toLowerCase().includes("symbol")) return false;
  if (font.family.toLowerCase().includes("emoji")) return false;

  // Exclude by category
  if (EXCLUDED_CATEGORIES.has(font.category)) return false;

  return true;
}

async function fetchGoogleFonts(): Promise<GoogleFont[]> {
  // Return cached fonts if available
  if (fontsCache) return fontsCache;

  // Return existing promise if fetch is in progress
  if (fontsCachePromise) return fontsCachePromise;

  // Fetch fonts from Google Fonts API with subset filter for latin
  fontsCachePromise = fetch(
    "https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyBwIX97bVWr3-6AIUvGkcNnmFgirefZ6Sw&sort=popularity&subset=latin"
  )
    .then((res) => res.json())
    .then((data) => {
      const fonts = data.items
        .filter((item: { family: string; category: string; subsets?: string[] }) => isValidTextFont(item))
        .map((item: { family: string; category: string }) => ({
          family: item.family,
          category: item.category,
        }));
      fontsCache = fonts;
      return fonts;
    })
    .catch((error) => {
      console.error("Failed to fetch Google Fonts:", error);
      fontsCachePromise = null;
      // Return a fallback list of popular fonts
      return [
        { family: "Inter", category: "sans-serif" },
        { family: "Roboto", category: "sans-serif" },
        { family: "Open Sans", category: "sans-serif" },
        { family: "Lato", category: "sans-serif" },
        { family: "Montserrat", category: "sans-serif" },
        { family: "Poppins", category: "sans-serif" },
        { family: "Playfair Display", category: "serif" },
        { family: "Merriweather", category: "serif" },
      ];
    });

  return fontsCachePromise;
}

interface GoogleFontPickerProps {
  value: string;
  onChange: (font: string) => void;
}

export function GoogleFontPicker({ value, onChange }: GoogleFontPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [fonts, setFonts] = React.useState<GoogleFont[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Load the current font on mount
  React.useEffect(() => {
    if (value) {
      loadGoogleFont(value);
    }
  }, [value]);

  // Fetch fonts when popover opens
  React.useEffect(() => {
    if (open && fonts.length === 0) {
      setIsLoading(true);
      fetchGoogleFonts().then((fetchedFonts) => {
        setFonts(fetchedFonts);
        setIsLoading(false);
      });
    }
  }, [open, fonts.length]);

  // Filter fonts based on search
  const filteredFonts = React.useMemo(() => {
    if (!search) return fonts;
    const searchLower = search.toLowerCase();
    return fonts.filter(
      (font) =>
        font.family.toLowerCase().includes(searchLower) ||
        font.category.toLowerCase().includes(searchLower)
    );
  }, [search, fonts]);

  // Only show first 100 fonts initially, load more on scroll
  const [visibleCount, setVisibleCount] = React.useState(50);

  // Reset visible count when search changes
  React.useEffect(() => {
    setVisibleCount(50);
  }, [search]);

  const visibleFonts = filteredFonts.slice(0, visibleCount);

  // Load fonts for visible items
  React.useEffect(() => {
    if (open) {
      // Load fonts for visible items (first 20 for preview)
      visibleFonts.slice(0, 20).forEach((font) => {
        loadGoogleFont(font.family);
      });
    }
  }, [open, visibleFonts]);

  // Handle scroll to load more fonts
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;

    // Load more when near bottom
    if (scrollHeight - scrollTop - clientHeight < 100) {
      setVisibleCount((prev) => Math.min(prev + 50, filteredFonts.length));
    }

    // Load fonts for newly visible items
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
    const startIndex = Math.floor(scrollPercentage * visibleFonts.length);
    const endIndex = Math.min(startIndex + 15, visibleFonts.length);

    for (let i = startIndex; i < endIndex; i++) {
      if (visibleFonts[i]) {
        loadGoogleFont(visibleFonts[i].family);
      }
    }
  }, [filteredFonts.length, visibleFonts]);

  const handleSelect = (fontName: string) => {
    loadGoogleFont(fontName);
    onChange(fontName);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-8 text-sm font-normal"
          style={{ fontFamily: value || "Inter" }}
        >
          {value || "Select font..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search 1600+ fonts..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList
            ref={listRef}
            className="max-h-[300px]"
            onScroll={handleScroll}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading fonts...</span>
              </div>
            ) : (
              <>
                <CommandEmpty>No font found.</CommandEmpty>
                <CommandGroup>
                  {visibleFonts.map((font) => (
                    <CommandItem
                      key={font.family}
                      value={font.family}
                      onSelect={() => handleSelect(font.family)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          value === font.family ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span
                        style={{ fontFamily: font.family }}
                        className="flex-1 truncate"
                      >
                        {font.family}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                        {font.category}
                      </span>
                    </CommandItem>
                  ))}
                  {visibleCount < filteredFonts.length && (
                    <div className="py-2 text-center text-xs text-muted-foreground">
                      Scroll for more ({filteredFonts.length - visibleCount} remaining)
                    </div>
                  )}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
