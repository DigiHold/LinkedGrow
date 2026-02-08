import { CMSPage, generateCMSMetadata } from "@/components/cms/cms-page";
import { getPublishedPage } from "@/lib/cms";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage("privacy");
  if (!page) return { title: "Privacy Policy - LinkedGrow" };
  return generateCMSMetadata(page);
}

export default async function PrivacyPage() {
  return <CMSPage slug="privacy" />;
}
