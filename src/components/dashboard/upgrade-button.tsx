"use client";

import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UPGRADE_PATH } from "@/lib/plans";

interface UpgradeButtonProps {
  planName: string;
  variant?: "default" | "inline";
}

export function UpgradeButton({
  planName,
  variant = "default",
}: UpgradeButtonProps) {
  if (variant === "inline") {
    return (
      <a href={UPGRADE_PATH}>
        <Button
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Crown className="w-4 h-4 mr-1" />
          Upgrade to unlock
        </Button>
      </a>
    );
  }

  return (
    <a href={UPGRADE_PATH}>
      <Button
        variant="linkedin"
        size="xl"
        className="shadow-lg w-full sm:w-auto text-white"
      >
        <Crown className="w-5 h-5 mr-2" />
        Upgrade to {planName}
      </Button>
    </a>
  );
}
