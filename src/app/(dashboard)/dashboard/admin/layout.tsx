"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    // Redirect non-admin users to dashboard
    if (!session?.user?.isAdmin) {
      router.replace("/dashboard");
    }
  }, [session, status, router]);

  // Show loading or nothing while checking auth
  if (status === "loading" || !session?.user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
