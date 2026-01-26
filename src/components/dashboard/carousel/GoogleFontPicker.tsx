"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
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

// Popular Google Fonts - curated list for performance
// These are commonly used fonts that work well for carousels
const GOOGLE_FONTS = [
  // Sans-serif
  { name: "Inter", category: "sans-serif" },
  { name: "Roboto", category: "sans-serif" },
  { name: "Open Sans", category: "sans-serif" },
  { name: "Lato", category: "sans-serif" },
  { name: "Montserrat", category: "sans-serif" },
  { name: "Poppins", category: "sans-serif" },
  { name: "Nunito", category: "sans-serif" },
  { name: "Raleway", category: "sans-serif" },
  { name: "Work Sans", category: "sans-serif" },
  { name: "DM Sans", category: "sans-serif" },
  { name: "Plus Jakarta Sans", category: "sans-serif" },
  { name: "Outfit", category: "sans-serif" },
  { name: "Manrope", category: "sans-serif" },
  { name: "Space Grotesk", category: "sans-serif" },
  { name: "Sora", category: "sans-serif" },
  { name: "Figtree", category: "sans-serif" },
  { name: "Lexend", category: "sans-serif" },
  { name: "Quicksand", category: "sans-serif" },
  { name: "Rubik", category: "sans-serif" },
  { name: "Karla", category: "sans-serif" },
  { name: "Mulish", category: "sans-serif" },
  { name: "Josefin Sans", category: "sans-serif" },
  { name: "Source Sans 3", category: "sans-serif" },
  { name: "Barlow", category: "sans-serif" },
  { name: "Ubuntu", category: "sans-serif" },
  { name: "Archivo", category: "sans-serif" },
  { name: "Cabin", category: "sans-serif" },
  { name: "Fira Sans", category: "sans-serif" },
  { name: "Nunito Sans", category: "sans-serif" },
  { name: "Titillium Web", category: "sans-serif" },
  { name: "Overpass", category: "sans-serif" },
  { name: "Exo 2", category: "sans-serif" },
  { name: "Red Hat Display", category: "sans-serif" },
  { name: "Albert Sans", category: "sans-serif" },
  { name: "Be Vietnam Pro", category: "sans-serif" },
  { name: "Bricolage Grotesque", category: "sans-serif" },

  // Serif
  { name: "Playfair Display", category: "serif" },
  { name: "Merriweather", category: "serif" },
  { name: "Lora", category: "serif" },
  { name: "Source Serif 4", category: "serif" },
  { name: "PT Serif", category: "serif" },
  { name: "Libre Baskerville", category: "serif" },
  { name: "Cormorant Garamond", category: "serif" },
  { name: "Crimson Text", category: "serif" },
  { name: "EB Garamond", category: "serif" },
  { name: "Bitter", category: "serif" },
  { name: "Noto Serif", category: "serif" },
  { name: "Spectral", category: "serif" },
  { name: "DM Serif Display", category: "serif" },
  { name: "Fraunces", category: "serif" },
  { name: "Young Serif", category: "serif" },
  { name: "Instrument Serif", category: "serif" },

  // Display
  { name: "Anton", category: "display" },
  { name: "Bebas Neue", category: "display" },
  { name: "Oswald", category: "display" },
  { name: "Archivo Black", category: "display" },
  { name: "Righteous", category: "display" },
  { name: "Russo One", category: "display" },
  { name: "Black Ops One", category: "display" },
  { name: "Alfa Slab One", category: "display" },
  { name: "Bangers", category: "display" },
  { name: "Bowlby One SC", category: "display" },
  { name: "Bungee", category: "display" },
  { name: "Passion One", category: "display" },
  { name: "Staatliches", category: "display" },
  { name: "Teko", category: "display" },
  { name: "Ultra", category: "display" },

  // Handwriting/Script
  { name: "Dancing Script", category: "handwriting" },
  { name: "Pacifico", category: "handwriting" },
  { name: "Caveat", category: "handwriting" },
  { name: "Satisfy", category: "handwriting" },
  { name: "Great Vibes", category: "handwriting" },
  { name: "Kalam", category: "handwriting" },
  { name: "Permanent Marker", category: "handwriting" },
  { name: "Indie Flower", category: "handwriting" },
  { name: "Sacramento", category: "handwriting" },
  { name: "Shadows Into Light", category: "handwriting" },
  { name: "Amatic SC", category: "handwriting" },
  { name: "Courgette", category: "handwriting" },

  // Monospace
  { name: "Roboto Mono", category: "monospace" },
  { name: "Source Code Pro", category: "monospace" },
  { name: "Fira Code", category: "monospace" },
  { name: "JetBrains Mono", category: "monospace" },
  { name: "IBM Plex Mono", category: "monospace" },
  { name: "Space Mono", category: "monospace" },
  { name: "Ubuntu Mono", category: "monospace" },
  { name: "Inconsolata", category: "monospace" },
];

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

interface GoogleFontPickerProps {
  value: string;
  onChange: (font: string) => void;
}

export function GoogleFontPicker({ value, onChange }: GoogleFontPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // Load the current font on mount
  React.useEffect(() => {
    if (value) {
      loadGoogleFont(value);
    }
  }, [value]);

  // Load fonts as they become visible in search results
  const filteredFonts = React.useMemo(() => {
    if (!search) return GOOGLE_FONTS;
    const searchLower = search.toLowerCase();
    return GOOGLE_FONTS.filter(
      (font) =>
        font.name.toLowerCase().includes(searchLower) ||
        font.category.toLowerCase().includes(searchLower)
    );
  }, [search]);

  // Preload visible fonts for preview
  React.useEffect(() => {
    if (open) {
      // Load first 20 visible fonts for preview
      filteredFonts.slice(0, 20).forEach((font) => {
        loadGoogleFont(font.name);
      });
    }
  }, [open, filteredFonts]);

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
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search fonts..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No font found.</CommandEmpty>
            <CommandGroup>
              {filteredFonts.map((font) => (
                <CommandItem
                  key={font.name}
                  value={font.name}
                  onSelect={() => handleSelect(font.name)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === font.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span
                    style={{ fontFamily: font.name }}
                    className="flex-1 truncate"
                  >
                    {font.name}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {font.category}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
