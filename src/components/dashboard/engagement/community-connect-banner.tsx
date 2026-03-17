"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Linkedin, Check, Loader2, Unplug } from "lucide-react";

interface CommunityConnectBannerProps {
  isConnected: boolean;
  profileName?: string;
  onDisconnect?: () => Promise<void>;
}

export function CommunityConnectBanner({
  isConnected,
  profileName,
  onDisconnect,
}: CommunityConnectBannerProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    const popup = window.open(
      "/api/linkedin/auth?app=community&popup=true&mode=connect",
      "linkedin-community-auth",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );

    const handleMessage = (event: MessageEvent) => {
      if (
        event.data?.type === "linkedin-success" ||
        event.data?.type === "linkedin-error"
      ) {
        setIsConnecting(false);
        window.removeEventListener("message", handleMessage);
        if (event.data?.type === "linkedin-success") {
          window.location.reload();
        }
      }
    };
    window.addEventListener("message", handleMessage);

    // Fallback timeout
    const checkInterval = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkInterval);
        setIsConnecting(false);
        window.removeEventListener("message", handleMessage);
      }
    }, 1000);
  };

  const handleDisconnect = async () => {
    if (!onDisconnect) return;
    setIsDisconnecting(true);
    try {
      await onDisconnect();
      window.location.reload();
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isConnected) {
    return (
      <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Community App Connected
                </p>
                {profileName && (
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                    Connected as {profileName}
                  </p>
                )}
              </div>
            </div>
            {onDisconnect && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="text-emerald-700 dark:text-emerald-300"
              >
                {isDisconnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unplug className="w-4 h-4 mr-1" />
                )}
                Disconnect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <Linkedin className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
              Connect Community App
            </h3>
            <p className="text-xs text-blue-700/80 dark:text-blue-300/80">
              Connect your LinkedIn Community App to view your feed, like, and
              comment on posts directly from LinkedGrow.
            </p>
          </div>
          <Button
            variant="linkedin"
            size="sm"
            onClick={handleConnect}
            disabled={isConnecting}
            className="shrink-0"
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Linkedin className="w-4 h-4 mr-2" />
            )}
            Connect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
