import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isSelfHosted } from "@/lib/edition";
import { COPY } from "@/components/setup/copy";
import { SetupWizard } from "./setup-wizard";

export const metadata: Metadata = {
  title: "Set up LinkedGrow",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The first login of a self hosted instance.
 *
 * The proxy sends every signed in account here until the wizard has run.
 * The administrator gets the wizard; anybody else gets told to wait, on a
 * page with no way forward, which is what keeps a redirect loop impossible.
 */
export default async function SetupPage() {
  if (!isSelfHosted()) notFound();
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/setup");
  if (session.user.isAdmin) return <SetupWizard adminEmail={session.user.email ?? ""} />;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white dark:bg-background">
      <div className="mx-auto flex min-h-full w-full max-w-[620px] items-center px-6 py-12">
        <div className="w-full rounded-2xl border border-border bg-card p-8 text-center text-card-foreground">
          <h1 className="text-[26px] font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">{COPY.nonAdmin.heading}</h1>
          <p className="mx-auto mt-3 max-w-[46ch] text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">{COPY.nonAdmin.text}</p>
        </div>
      </div>
    </div>
  );
}
