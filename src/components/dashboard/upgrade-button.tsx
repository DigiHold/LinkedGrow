"use client";

import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { redirectToCheckout } from "@/lib/checkout";
import { PlanId } from "@/lib/plans";

interface UpgradeButtonProps {
  requiredPlan: PlanId;
  userEmail: string;
  planName: string;
  planPrice: number;
  variant?: "default" | "inline";
}

export function UpgradeButton({
  requiredPlan,
  userEmail,
  planName,
  planPrice,
  variant = "default",
}: UpgradeButtonProps) {
  if (variant === "inline") {
    return (
      <Button
        size="sm"
        className="bg-amber-600 hover:bg-amber-700 text-white"
        onClick={() => redirectToCheckout(requiredPlan, userEmail)}
      >
        <Crown className="w-4 h-4 mr-1" />
        Upgrade to unlock
      </Button>
    );
  }

  return (
    <Button
      variant="linkedin"
      size="xl"
      className="shadow-lg w-full sm:w-auto text-white"
      onClick={() => redirectToCheckout(requiredPlan, userEmail)}
    >
      <Crown className="w-5 h-5 mr-2" />
      Upgrade to {planName} - ${planPrice}/mo
    </Button>
  );
}
