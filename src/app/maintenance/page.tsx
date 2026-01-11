import { Wrench, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-linkedin/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-linkedin-gradient flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <span className="text-2xl font-bold">
            Linked<span className="text-linkedin">Grow</span>
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 sm:p-12 shadow-2xl border border-gray-200/50 dark:border-gray-800/50">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6">
            <Wrench className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Under Maintenance
          </h1>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-6">
            We&apos;re currently performing scheduled maintenance to improve your experience.
            We&apos;ll be back shortly!
          </p>

          {/* Estimated Time */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-8">
            <Clock className="w-4 h-4" />
            <span>Estimated downtime: ~30 minutes</span>
          </div>

          {/* What's happening */}
          <div className="text-left bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold mb-2 text-sm">What we&apos;re working on:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Final testing and quality assurance</li>
              <li>• Performance optimizations</li>
              <li>• Security hardening</li>
            </ul>
          </div>

          {/* Admin Login */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-muted-foreground mb-3">
              Are you an admin?
            </p>
            <Link href="/sign-in">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Admin Login
              </Button>
            </Link>
          </div>
        </div>

        {/* Contact */}
        <p className="mt-6 text-sm text-muted-foreground">
          Questions? Contact us at{" "}
          <a href="mailto:support@linkedgrow.ai" className="text-linkedin hover:underline">
            support@linkedgrow.ai
          </a>
        </p>
      </div>
    </div>
  );
}
