"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * The name of whatever the current page is about.
 *
 * The breadcrumb is built from the URL, which works everywhere except on a
 * detail page, where the last segment is an id. An agent read
 * "Home > Agents > F132fb0a ff67 44ab 993c 181f38687a90", which tells the
 * reader nothing and looks broken.
 *
 * The page that loads the record knows its name, so it hands it up here and the
 * top bar uses it for the last crumb. Nothing else changes: a page that says
 * nothing keeps the label derived from its path.
 */

type CrumbStore = {
  label: string | null;
  setLabel: (label: string | null) => void;
};

const CrumbContext = createContext<CrumbStore>({
  label: null,
  setLabel: () => {},
});

export function CrumbProvider({ children }: { children: React.ReactNode }) {
  const [label, setLabel] = useState<string | null>(null);
  const value = useMemo(() => ({ label, setLabel }), [label]);
  return <CrumbContext.Provider value={value}>{children}</CrumbContext.Provider>;
}

/** Read by the top bar. */
export function useCrumbLabel(): string | null {
  return useContext(CrumbContext).label;
}

/**
 * Name the last crumb from inside the page that knows the name.
 *
 * Clears itself on the way out, so navigating from one agent to a page with no
 * name of its own does not leave the previous agent's name in the bar.
 */
export function useNamedCrumb(label: string | null | undefined): void {
  const { setLabel } = useContext(CrumbContext);
  const set = useCallback(setLabel, [setLabel]);
  useEffect(() => {
    set(label ?? null);
    return () => set(null);
  }, [label, set]);
}
