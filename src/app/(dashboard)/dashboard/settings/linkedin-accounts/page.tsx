import type { Metadata } from "next";
import { LinkedInAccountsContent } from "./linkedin-accounts-content";

export const metadata: Metadata = { title: "LinkedIn accounts" };

export default function LinkedInAccountsSettingsPage() {
  return <LinkedInAccountsContent />;
}
