import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isSelfHosted } from "@/lib/edition";
import { InstanceSettingsContent } from "./instance-settings-content";

export const metadata: Metadata = { title: "Instance" };

export const dynamic = "force-dynamic";

/** The administrator's page: everything the wizard asked, editable later. Self hosted only. */
export default async function InstanceSettingsPage() {
  if (!isSelfHosted()) notFound();
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard/settings");
  return <InstanceSettingsContent adminEmail={session.user.email ?? ""} />;
}
