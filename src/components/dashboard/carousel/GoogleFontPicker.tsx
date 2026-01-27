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

// Cache for fonts list
let fontsCache: GoogleFont[] | null = null;
let fontsCachePromise: Promise<GoogleFont[]> | null = null;

// Track which font stylesheets have been injected
const injectedStylesheets = new Set<string>();

/**
 * Load a Google Font by injecting its stylesheet and waiting until the browser
 * has actually parsed and made the font available for rendering.
 */
export async function loadGoogleFont(fontName: string): Promise<void> {
  // Inject the stylesheet if not already done
  if (!injectedStylesheets.has(fontName)) {
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, "+")}:wght@400;500;600;700&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    injectedStylesheets.add(fontName);

    // Wait for the <link> to load (CSS fetched and parsed)
    await new Promise<void>((resolve) => {
      link.onload = () => resolve();
      link.onerror = () => resolve();
      // Safety timeout - don't block forever
      setTimeout(resolve, 4000);
    });
  }

  // Now wait for the actual font face to be ready using the Font Loading API.
  // document.fonts.load() returns a promise that resolves when the matching
  // font face has been downloaded. We try multiple weights.
  try {
    await Promise.all([
      document.fonts.load(`400 16px "${fontName}"`),
      document.fonts.load(`700 16px "${fontName}"`),
    ]);
    // Final barrier - wait for all queued font loads
    await document.fonts.ready;
  } catch {
    // Ignore errors - font might only have some weights
  }
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

  fontsCachePromise = fetch(
    "https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyBwIX97bVWr3-6AIUvGkcNnmFgirefZ6Sw&sort=popularity&subset=latin"
  )
    .then((res) => res.json())
    .then((data) => {
      const fonts = data.items
        .filter((item: { family: string; category: string }) => isValidTextFont(item))
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

  // Load the current font on mount (just the one being used)
  React.useEffect(() => {
    if (value) {
      loadGoogleFont(value);
    }
  }, [value]);

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
    // Load the font and wait for it to be ready, THEN notify parent
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
