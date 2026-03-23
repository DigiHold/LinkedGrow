"use client";

import { useState, useEffect } from "react";
import { SetupWizard } from "./setup-wizard";

export function OnboardingCheck() {
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/user/settings");
        if (!res.ok) return;
        const data = await res.json();
        if (!data.onboardingCompleted) {
          setShowWizard(true);
        }
      } catch {
        // Silently fail
      }
    };
    check();
  }, []);

  if (!showWizard) return null;

  return <SetupWizard onComplete={() => setShowWizard(false)} />;
}
