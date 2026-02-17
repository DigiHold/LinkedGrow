"use client";

import { useState } from "react";
import { Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { redirectToCheckout } from "@/lib/checkout";
import { PlanId } from "@/lib/plans";

interface UpgradeButtonProps {
  requiredPlan: PlanId;
  userEmail: string;
  planName: string;
  planPrice: number;
  currentPlan?: PlanId;
  variant?: "default" | "inline";
}

async function redirectToPortal() {
  const response = await fetch("/api/stripe/portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const data = await response.json();
  if (data.url) {
    window.location.href = data.url;
  }
}

export function UpgradeButton({
  requiredPlan,
  userEmail,
  planName,
  planPrice,
  currentPlan = "free",
  variant = "default",
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);
  const isPaidUser = currentPlan !== "free";

  const handleClick = async () => {
    setLoading(true);
    try {
      if (isPaidUser) {
        await redirectToPortal();
      } else {
        await redirectToCheckout(requiredPlan, userEmail);
      }
    } finally {
      setLoading(false);
    }
  };

  if (variant === "inline") {
    return (
      <Button
        size="sm"
        className="bg-amber-600 hover:bg-amber-700 text-white"
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
        ) : (
          <Crown className="w-4 h-4 mr-1" />
        )}
        Upgrade to unlock
      </Button>
    );
  }

  return (
    <Button
      variant="linkedin"
      size="xl"
      className="shadow-lg w-full sm:w-auto text-white"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      ) : (
        <Crown className="w-5 h-5 mr-2" />
      )}
      Upgrade to {planName} - ${planPrice}/mo
    </Button>
  );
}
