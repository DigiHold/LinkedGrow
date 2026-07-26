"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  /**
   * When a server component already resolved the session, hand it over so
   * useSession() is populated on first render. Without it, every page that
   * calls useSession() pays a /api/auth/session round trip before it can
   * render anything, on top of its own data fetches.
   */
  session?: Session | null;
}

export function SessionProvider({ children, session }: Props) {
  return (
    <NextAuthSessionProvider
      session={session}
      // Default is true: every return to the tab refires /api/auth/session.
      // The plan only changes through a checkout, which navigates and re-reads
      // the JWT anyway, so this buys nothing and costs a request every single
      // time the window regains focus.
      refetchOnWindowFocus={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
