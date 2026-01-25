"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Users, Loader2, CheckCircle, XCircle, LogIn, UserPlus } from "lucide-react";
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
    teamName: string;
    inviterName: string;
    role: string;
    email: string;
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
      const response = await fetch(`/api/team/invite/validate?token=${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid or expired invite");
      } else {
        setInvite(data.invite);
      }
    } catch (err) {
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
      const response = await fetch("/api/team/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to accept invite");
      } else {
        setSuccess(true);
        // Redirect to team page after 2 seconds
        setTimeout(() => {
          router.push("/dashboard/team");
        }, 2000);
      }
    } catch (err) {
      setError("Failed to accept invite");
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Validating invite...</p>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Invalid Invite</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link href="/sign-in">
            <Button className="w-full">Go to Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to the Team!</h1>
          <p className="text-muted-foreground mb-4">
            You've joined <strong>{invite?.teamName}</strong> as {invite?.role === "admin" ? "an Admin" : "a Member"}.
          </p>
          <p className="text-sm text-muted-foreground">Redirecting to team page...</p>
        </div>
      </div>
    );
  }

  // User needs to sign in or sign up
  if (status === "unauthenticated" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
              <Users className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Team Invitation</h1>
            <p className="text-muted-foreground">
              You've been invited to join <strong>{invite?.teamName}</strong> as {invite?.role === "admin" ? "an Admin" : "a Member"}.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-1">Invited by</p>
            <p className="font-medium">{invite?.inviterName}</p>
            <p className="text-sm text-muted-foreground mt-3 mb-1">Invited email</p>
            <p className="font-medium">{invite?.email}</p>
          </div>

          <p className="text-sm text-muted-foreground text-center mb-6">
            Sign in or create an account to accept this invitation.
          </p>

          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={() => signIn(undefined, { callbackUrl: `/team/invite?token=${token}` })}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
            <Link href={`/sign-up?callbackUrl=${encodeURIComponent(`/team/invite?token=${token}`)}`} className="block">
              <Button variant="outline" className="w-full">
                <UserPlus className="w-4 h-4 mr-2" />
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // User is logged in, show accept button
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
            <Users className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Team Invitation</h1>
          <p className="text-muted-foreground">
            You've been invited to join <strong>{invite?.teamName}</strong> as {invite?.role === "admin" ? "an Admin" : "a Member"}.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-6">
          <p className="text-sm text-muted-foreground mb-1">Invited by</p>
          <p className="font-medium">{invite?.inviterName}</p>
          <p className="text-sm text-muted-foreground mt-3 mb-1">Your role</p>
          <p className="font-medium capitalize">{invite?.role}</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button className="w-full" onClick={handleAccept} disabled={isAccepting}>
            {isAccepting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept Invitation
              </>
            )}
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" className="w-full">
              Decline
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TeamInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
