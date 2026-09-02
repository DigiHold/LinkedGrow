import { Metadata } from "next";
import { getAppUrl } from "@/lib/app-url";

export const metadata: Metadata = {
  title: "Forgot Password - LinkedGrow",
  description:
    "Reset your LinkedGrow password. Enter your email address and we'll send you a link to reset your password.",
  openGraph: {
    title: "Forgot Password - LinkedGrow",
    description:
      "Reset your LinkedGrow account password.",
    url: `${getAppUrl()}/forgot-password`,
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
    canonical: `${getAppUrl()}/forgot-password`,
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
