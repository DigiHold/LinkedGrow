"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";

export default function SignOutPage() {
  useEffect(() => {
    // Step 1: Clear next-auth client-side session cache
    signOut({ redirect: false }).finally(() => {
      // Step 2: Navigate to server endpoint that clears all cookies + redirects to /
      window.location.replace("/api/auth/signout");
    });
  }, []);

  return null;
}
