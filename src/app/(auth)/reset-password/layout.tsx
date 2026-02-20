import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password - LinkedGrow",
  description:
    "Create a new password for your LinkedGrow account.",
  openGraph: {
    title: "Reset Password - LinkedGrow",
    description: "Create a new password for your LinkedGrow account.",
    url: "https://linkedgrow.ai/reset-password",
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
    canonical: "https://linkedgrow.ai/reset-password",
  },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
