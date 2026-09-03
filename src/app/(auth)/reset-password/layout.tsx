import { Metadata } from "next";
import { requestAppUrl } from "@/lib/app-url-server";

export async function generateMetadata(): Promise<Metadata> {
  const APP_URL = await requestAppUrl();
  return {
    title: "Reset Password - LinkedGrow",
    description:
      "Create a new password for your LinkedGrow account.",
    openGraph: {
      title: "Reset Password - LinkedGrow",
      description: "Create a new password for your LinkedGrow account.",
      url: `${APP_URL}/reset-password`,
      siteName: "LinkedGrow",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: "Reset Password - LinkedGrow",
      description: "Create a new password for your LinkedGrow account.",
    },
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `${APP_URL}/reset-password`,
    },
  };
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
