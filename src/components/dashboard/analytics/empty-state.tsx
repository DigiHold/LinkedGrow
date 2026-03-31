"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Linkedin, BarChart3, Lock, Loader2 } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  type: "no-linkedin" | "no-data" | "upgrade";
  featureName?: string;
}

export function AnalyticsEmptyState({ type, featureName = "Analytics" }: EmptyStateProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    const popup = window.open(
      "/api/linkedin/auth?popup=true&mode=connect",
      "linkedin-auth",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "linkedin-success" || event.data?.type === "linkedin-error") {
        setIsConnecting(false);
        window.removeEventListener("message", handleMessage);
        if (event.data?.type === "linkedin-success") {
          window.location.reload();
        }
      }
    };
    window.addEventListener("message", handleMessage);

    const checkInterval = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkInterval);
        setIsConnecting(false);
        window.removeEventListener("message", handleMessage);
      }
    }, 1000);
  };

  if (type === "no-linkedin") {
    return (
      <Card>
        <CardContent className="py-16 px-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Linkedin className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Connect LinkedIn</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Connect your LinkedIn account to start tracking your analytics and performance metrics.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Linkedin className="w-4 h-4 mr-2" />
              )}
              Connect LinkedIn
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "no-data") {
    return (
      <Card>
        <CardContent className="py-16 px-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
            <p className="text-muted-foreground text-sm">
              Start publishing posts to LinkedIn to see your analytics data here. Your performance metrics will appear after your first published post.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-16 px-8">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Upgrade Required</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {featureName} requires a higher plan. Upgrade to unlock this feature.
          </p>
          <Link href="/dashboard/upgrade">
            <Button variant="primary" size="sm">
              Upgrade Plan
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
