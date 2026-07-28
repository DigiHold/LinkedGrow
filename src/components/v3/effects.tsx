"use client";

import { useEffect } from "react";
import { initV3Chrome } from "./chrome-effects";

/**
 * The v3 chrome effects, for a page that is a server component.
 *
 * The nav state, the reveals, the word splitter and the hero point network all
 * live in one init that has to run in the browser. A page rendered on the
 * server cannot call it, and making the whole page a client component to get a
 * canvas animating is a poor trade. This renders nothing and runs it.
 */
export function V3Effects() {
  useEffect(() => initV3Chrome(), []);
  return null;
}
