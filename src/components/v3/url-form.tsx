"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { FILL, FILL_LIGHT, URLBAR, URLBAR_INPUT, URLWRAP } from "./kit";

/**
 * The website field that opens the funnel, shared by the home and every closing CTA.
 *
 * It used to live inline on the home twice with `onSubmit={(e) => e.preventDefault()}`,
 * so the field looked like the entry point and led nowhere. It carries what the
 * visitor typed to sign-up, which is the shortest path we actually have: one
 * field, one click, and the agent has the domain it needs to work out who buys.
 *
 * An empty field still goes to sign-up rather than blocking, because a visitor
 * who clicks the button has already decided.
 */

export function V3UrlForm({
  label = "Launch my agent for free",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [website, setWebsite] = useState("");

  return (
    <form
      className={`group ${URLWRAP} ${className}`}
      onSubmit={(event) => {
        event.preventDefault();
        const value = website.trim();
        router.push(value ? `/sign-up?website=${encodeURIComponent(value)}` : "/sign-up");
      }}
    >
      <div className={URLBAR}>
        <input
          aria-label="Your website"
          className={URLBAR_INPUT}
          onChange={(event) => setWebsite(event.target.value)}
          placeholder="yourcompany.com"
          type="text"
          value={website}
        />
        <button
          className={`${FILL} ${FILL_LIGHT} flex-none rounded-[13px] px-[22px] py-[14px] text-[15px] max-[600px]:w-full`}
          type="submit"
        >
          {label}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M5 12h13M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </form>
  );
}
