import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password - LinkedGrow",
  description:
    "Reset your LinkedGrow password. Enter your email address and we'll send you a link to reset your password.",
  keywords: [
    "LinkedGrow",
    "forgot password",
    "reset password",
    "account recovery",
  ],
  openGraph: {
    title: "Forgot Password - LinkedGrow",
    description:
      "Reset your LinkedGrow account password.",
    url: "https://linkedgrow.ai/forgot-password",
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
    canonical: "https://linkedgrow.ai/forgot-password",
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
