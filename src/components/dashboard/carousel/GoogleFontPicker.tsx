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
  variants: string[];
}

// Fonts to exclude - icon fonts, symbols, and fonts that don't render text properly
const EXCLUDED_FONTS = new Set([
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
  "Noto Sans Symbols",
  "Noto Sans Symbols 2",
  "Noto Sans Math",
  "Noto Sans SignWriting",
  "Noto Music",
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

// Cache for fonts list
let fontsCache: GoogleFont[] | null = null;
let fontsCachePromise: Promise<GoogleFont[]> | null = null;

// Track the currently active font stylesheet
let activeFontLink: HTMLLinkElement | null = null;
let activeFontName: string | null = null;

// The initial font loaded on mount - this one is never removed
let initialFont: string | null = null;

/**
 * Load a Google Font by injecting its stylesheet and waiting until the browser
 * has actually parsed and made the font available for rendering.
 * Removes the previous font's stylesheet to keep the DOM clean.
 */
export async function loadGoogleFont(fontName: string, keepPrevious = false): Promise<void> {
  // Already the active font
  if (activeFontName === fontName && activeFontLink) {
    try {
      await Promise.all([
        document.fonts.load(`400 16px "${fontName}"`),
        document.fonts.load(`700 16px "${fontName}"`),
      ]);
      await document.fonts.ready;
    } catch { /* ignore */ }
    return;
  }

  // Remove previous font stylesheet (keep only the initial font)
  if (!keepPrevious && activeFontLink && activeFontName && activeFontName !== initialFont) {
    activeFontLink.remove();
  }

  // Create and inject new stylesheet
  const link = document.createElement("link");
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, "+")}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
  link.rel = "stylesheet";
  document.head.appendChild(link);

  activeFontLink = link;
  activeFontName = fontName;

  // Wait for the <link> to load
  await new Promise<void>((resolve) => {
    link.onload = () => resolve();
    link.onerror = () => resolve();
    setTimeout(resolve, 4000);
  });

  // Wait for actual font faces to be ready
  try {
    await Promise.all([
      document.fonts.load(`400 16px "${fontName}"`),
      document.fonts.load(`700 16px "${fontName}"`),
    ]);
    await document.fonts.ready;
  } catch { /* ignore */ }
}

function isValidTextFont(font: { family: string; category: string }): boolean {
  if (EXCLUDED_FONTS.has(font.family)) return false;
  const lower = font.family.toLowerCase();
  if (lower.includes("icon") || lower.includes("symbol") || lower.includes("emoji")) return false;
  return true;
}

async function fetchGoogleFonts(): Promise<GoogleFont[]> {
  if (fontsCache) return fontsCache;
  if (fontsCachePromise) return fontsCachePromise;

  fontsCachePromise = fetch("/api/fonts/google")
    .then((res) => res.json())
    .then((data) => {
      const fonts = data.items
        .filter((item: { family: string; category: string }) => isValidTextFont(item))
        .map((item: { family: string; category: string; variants: string[] }) => ({
          family: item.family,
          category: item.category,
          variants: item.variants || [],
        }));
      fontsCache = fonts;
      return fonts;
    })
    .catch((error) => {
      console.error("Failed to fetch Google Fonts:", error);
      fontsCachePromise = null;
      return [
        { family: "Inter", category: "sans-serif", variants: ["300", "regular", "500", "600", "700", "800", "900"] },
        { family: "Roboto", category: "sans-serif", variants: ["100", "300", "regular", "500", "700", "900"] },
        { family: "Open Sans", category: "sans-serif", variants: ["300", "regular", "500", "600", "700", "800"] },
        { family: "Lato", category: "sans-serif", variants: ["100", "300", "regular", "700", "900"] },
        { family: "Montserrat", category: "sans-serif", variants: ["100", "200", "300", "regular", "500", "600", "700", "800", "900"] },
        { family: "Poppins", category: "sans-serif", variants: ["100", "200", "300", "regular", "500", "600", "700", "800", "900"] },
        { family: "Playfair Display", category: "serif", variants: ["regular", "500", "600", "700", "800", "900"] },
        { family: "Merriweather", category: "serif", variants: ["300", "regular", "700", "900"] },
      ];
    });

  return fontsCachePromise;
}

const WEIGHT_LABELS: Record<number, string> = {
  100: "Thin",
  200: "Extra Light",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "Semi Bold",
  700: "Bold",
  800: "Extra Bold",
  900: "Black",
};

// Eagerly fetch fonts list on module load (browser only) so weights are available
if (typeof window !== "undefined") {
  fetchGoogleFonts();
}

/**
 * Get available font weights for a given font family.
 * Returns numeric weights (100-900) from the Google Fonts API data.
 */
export function getFontWeights(fontFamily: string): { value: number; label: string }[] {
  if (!fontsCache) {
    return [
      { value: 400, label: "Regular" },
      { value: 700, label: "Bold" },
    ];
  }

  const font = fontsCache.find(f => f.family === fontFamily);
  if (!font) {
    return [
      { value: 400, label: "Regular" },
      { value: 700, label: "Bold" },
    ];
  }

  // Parse variants - Google Fonts API returns strings like "100", "300", "regular", "700", "italic", "300italic"
  const weights: { value: number; label: string }[] = [];
  const seen = new Set<number>();

  for (const variant of font.variants) {
    // Skip italic variants
    if (variant.includes("italic")) continue;

    const numWeight = variant === "regular" ? 400 : parseInt(variant, 10);
    if (!isNaN(numWeight) && !seen.has(numWeight) && WEIGHT_LABELS[numWeight]) {
      seen.add(numWeight);
      weights.push({ value: numWeight, label: WEIGHT_LABELS[numWeight] });
    }
  }

  // Sort by weight
  weights.sort((a, b) => a.value - b.value);

  return weights.length > 0 ? weights : [{ value: 400, label: "Regular" }];
}

/**
 * Ensure font cache is loaded. Returns a promise that resolves when fonts data is available.
 */
export function ensureFontsLoaded(): Promise<GoogleFont[]> {
  return fetchGoogleFonts();
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

  // Load the current font on mount only (mark as initial so it never gets removed)
  const mountedRef = React.useRef(false);
  React.useEffect(() => {
    if (value && !mountedRef.current) {
      mountedRef.current = true;
      initialFont = value;
      loadGoogleFont(value, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch font list when popover opens
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

  // Virtualized list - show 50 at a time, load more on scroll
  const [visibleCount, setVisibleCount] = React.useState(50);

  React.useEffect(() => {
    setVisibleCount(50);
  }, [search]);

  const visibleFonts = filteredFonts.slice(0, visibleCount);

  // Handle scroll to load more items (NOT fonts - just list items)
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;

    if (scrollHeight - scrollTop - clientHeight < 100) {
      setVisibleCount((prev) => Math.min(prev + 50, filteredFonts.length));
    }
  }, [filteredFonts.length]);

  const handleSelect = async (fontName: string) => {
    setOpen(false);
    setSearch("");
    await loadGoogleFont(fontName);
    onChange(fontName);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-8 text-sm font-normal"
          style={{ fontFamily: value ? `"${value}", sans-serif` : "Inter" }}
        >
          {value || "Select font..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-70 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search 1600+ fonts..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList
            ref={listRef}
            className="max-h-75"
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
                      <span className="flex-1 truncate">
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
