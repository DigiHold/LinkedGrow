import { Metadata } from "next";
import { requestAppUrl } from "@/lib/app-url-server";

export async function generateMetadata(): Promise<Metadata> {
  const APP_URL = await requestAppUrl();
  return {
    title: "Forgot Password - LinkedGrow",
    description:
      "Reset your LinkedGrow password. Enter your email address and we'll send you a link to reset your password.",
    openGraph: {
      title: "Forgot Password - LinkedGrow",
      description:
        "Reset your LinkedGrow account password.",
      url: `${APP_URL}/forgot-password`,
      siteName: "LinkedGrow",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: "Forgot Password - LinkedGrow",
      description: "Reset your LinkedGrow account password.",
    },
    robots: {
      index: false,
      follow: true,
    },
    alternates: {
      canonical: `${APP_URL}/forgot-password`,
    },
  };
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
