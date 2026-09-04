"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Globe, X } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COUNTRY_CODES, COUNTRY_GROUPS, countryName } from "@shared/countries.ts";

/**
 * Where an agent may look for people, chosen from a list rather than typed.
 *
 * This replaces a free text box, and the box is the reason a customer aimed an
 * agent at the Americas and the Caribbean and was handed leads in Asia and the
 * Middle East. Free text could not be matched: "Americas" is not a place
 * LinkedIn ever prints, and "Allemagne" never equals "Germany". A code can be,
 * in every language, so nothing is typed here any more.
 *
 * Worldwide comes first and is what an agent has until somebody chooses
 * otherwise. Clearing the last country returns to it, because an empty list and
 * worldwide are the same state and showing them as two would invite the
 * question of which one an agent is in.
 */

interface CountryPickerProps {
  /** ISO alpha-2 codes. Empty is worldwide. */
  value: string[];
  onChange: (codes: string[]) => void;
}

const SORTED_COUNTRIES = COUNTRY_CODES.map((code) => ({ code, name: countryName(code) })).sort(
  (a, b) => a.name.localeCompare(b.name)
);

function fold(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function CountryPicker({ value, onChange }: CountryPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const chosen = React.useMemo(() => new Set(value), [value]);
  const query = fold(search.trim());

  const countries = query
    ? SORTED_COUNTRIES.filter((c) => fold(c.name).includes(query) || fold(c.code) === query)
    : SORTED_COUNTRIES;
  const groups = query
    ? COUNTRY_GROUPS.filter((g) => fold(g.label).includes(query))
    : COUNTRY_GROUPS;

  const toggle = (code: string) => {
    onChange(chosen.has(code) ? value.filter((c) => c !== code) : [...value, code].sort());
  };

  /** A group is a shortcut, so it fills in what is missing and clears what is not. */
  const toggleGroup = (codes: readonly string[]) => {
    const all = codes.every((c) => chosen.has(c));
    onChange(
      all
        ? value.filter((c) => !codes.includes(c))
        : [...new Set([...value, ...codes])].sort()
    );
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-11 w-full justify-between text-sm font-normal"
          >
            <span className="flex items-center gap-2 truncate">
              {value.length === 0 ? (
                <>
                  <Globe className="h-4 w-4 shrink-0 opacity-60" />
                  Worldwide
                </>
              ) : (
                `${value.length} ${value.length === 1 ? "country" : "countries"}`
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search a country or a region..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-75">
              <CommandEmpty>Nothing matches that.</CommandEmpty>

              {!query && (
                <CommandGroup>
                  <CommandItem
                    value="worldwide"
                    onSelect={() => onChange([])}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value.length === 0 ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Globe className="mr-2 h-4 w-4 shrink-0 opacity-60" />
                    <span className="flex-1">Worldwide</span>
                    <span className="ml-2 shrink-0 text-[10px] text-slate-500 dark:text-slate-400">
                      anywhere on LinkedIn
                    </span>
                  </CommandItem>
                </CommandGroup>
              )}

              {groups.length > 0 && (
                <CommandGroup heading="Regions">
                  {groups.map((group) => {
                    const all = group.codes.every((c) => chosen.has(c));
                    return (
                      <CommandItem
                        key={group.id}
                        value={group.id}
                        onSelect={() => toggleGroup(group.codes)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4 shrink-0", all ? "opacity-100" : "opacity-0")}
                        />
                        <span className="flex-1 truncate">{group.label}</span>
                        <span className="ml-2 shrink-0 text-[10px] text-slate-500 dark:text-slate-400">
                          {group.codes.length}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {countries.length > 0 && (
                <CommandGroup heading="Countries">
                  {countries.map((country) => (
                    <CommandItem
                      key={country.code}
                      value={country.code}
                      onSelect={() => toggle(country.code)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          chosen.has(country.code) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="flex-1 truncate">{country.name}</span>
                      <span className="ml-2 shrink-0 text-[10px] text-slate-500 dark:text-slate-400">
                        {country.code}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => toggle(code)}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {countryName(code)}
              <X className="h-3 w-3 opacity-60" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange([])}
            className="inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Back to worldwide
          </button>
        </div>
      )}
    </div>
  );
}
