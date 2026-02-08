import { CMSPage, generateCMSMetadata } from "@/components/cms/cms-page";
import { getPublishedPage } from "@/lib/cms";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage("terms");
  if (!page) return { title: "Terms of Service - LinkedGrow" };
  return generateCMSMetadata(page);
}

export default async function TermsPage() {
  return <CMSPage slug="terms" />;
}
