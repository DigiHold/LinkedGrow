"use client";

import { useState, useEffect } from "react";

export function CopyrightYear() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  // Show nothing during SSR, year after hydration
  if (!year) return <>2026</>;

  return <>{year}</>;
}
