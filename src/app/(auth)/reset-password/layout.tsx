import { Metadata } from "next";
import { getAppUrl } from "@/lib/app-url";

export const metadata: Metadata = {
  title: "Reset Password - LinkedGrow",
  description:
    "Create a new password for your LinkedGrow account.",
  openGraph: {
    title: "Reset Password - LinkedGrow",
    description: "Create a new password for your LinkedGrow account.",
    url: `${getAppUrl()}/reset-password`,
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
    canonical: `${getAppUrl()}/reset-password`,
  },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
