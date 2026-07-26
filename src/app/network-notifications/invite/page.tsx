"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Share2, Loader2, CheckCircle, XCircle, LogIn, UserPlus, Crown } from "lucide-react";
import { canAccessFeature } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invite, setInvite] = useState<{
    groupName: string;
    inviterName: string;
    emailHint: string;
  } | null>(null);

  useEffect(() => {
    if (token) {
      validateInvite();
    } else {
      setError("Invalid invite link - no token provided");
      setIsLoading(false);
    }
  }, [token]);

  const validateInvite = async () => {
    try {
      const response = await fetch(`/api/network-notifications/invite/${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid or expired invite");
      } else {
        setInvite(data);
      }
    } catch {
      setError("Failed to validate invite");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!token) return;
    setIsAccepting(true);
    setError(null);

    try {
      const response = await fetch(`/api/network-notifications/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to accept invite");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/dashboard/network-notifications"), 2000);
      }
    } catch {
      setError("Failed to accept invite");
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Validating invite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Invite Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link href="/sign-in">
            <Button variant="outline">Go to Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">You're in!</h1>
          <p className="text-muted-foreground mb-4">
            You've joined <strong>{invite?.groupName}</strong>. Redirecting to your dashboard...
          </p>
          <Loader2 className="w-5 h-5 animate-spin text-cyan-500 mx-auto" />
        </div>
      </div>
    );
  }

  // Not logged in
  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-6">
            <Share2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold mb-2">Network Notifications Invite</h1>
          <p className="text-muted-foreground mb-6">
            You've been invited to join <strong>{invite?.groupName}</strong> by{" "}
            <strong>{invite?.inviterName}</strong>. Sign in or create an account to accept.
          </p>
          <div className="space-y-3">
            <Link href={`/sign-in?callbackUrl=/network-notifications/invite?token=${token}`} className="block">
              <Button className="w-full" variant="outline">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </Link>
            <Link href={`/sign-up?callbackUrl=/network-notifications/invite?token=${token}`} className="block">
              <Button className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
                <UserPlus className="w-4 h-4 mr-2" />
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Logged in - check plan
  const userPlan = (session?.user?.plan || "free") as PlanId;
  const hasAccess = true;

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-6">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold mb-2">Pro Plan Required</h1>
          <p className="text-muted-foreground mb-6">
            <strong>{invite?.inviterName}</strong> invited you to join <strong>{invite?.groupName}</strong>,
            but Network Notifications requires a Pro plan or higher.
            Upgrade to start boosting each other's LinkedIn posts.
          </p>
          <Link href="/dashboard/upgrade" className="block">
            <Button className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Logged in + Pro plan - show accept button
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-linear-to-r from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-6">
          <Share2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-xl font-bold mb-2">Join Network Notifications Group</h1>
        <p className="text-muted-foreground mb-6">
          <strong>{invite?.inviterName}</strong> invited you to join <strong>{invite?.groupName}</strong>.
          When group members publish LinkedIn posts, you'll get notified so you can like, comment, and repost.
        </p>
        <Button
          onClick={handleAccept}
          disabled={isAccepting}
          className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
        >
          {isAccepting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          {isAccepting ? "Joining..." : "Accept Invitation"}
        </Button>
      </div>
    </div>
  );
}

export default function NetworkNotificationsInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
