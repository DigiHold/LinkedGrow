import { Metadata } from "next";
import { getAppUrl } from "@/lib/app-url";
import { isCloud } from "@/lib/edition";

// The trial belongs to the hosted service. An instance you run yourself takes
// no payment, so its description says what creating an account actually does.
const description = isCloud()
  ? "Create your LinkedGrow account and start a 7-day Pro trial. Bring your own API key for unlimited AI post generation. Everything included."
  : "Create your account on this LinkedGrow instance. Bring your own API key and generate posts through the provider you already pay for.";

export const metadata: Metadata = {
  title: "Sign Up - Create Your LinkedGrow Account",
  description,
  openGraph: {
    title: "Sign Up - Create Your LinkedGrow Account",
    description:
      "Create your free LinkedGrow account and start growing your LinkedIn presence with AI-powered content.",
    url: `${getAppUrl()}/sign-up`,
    siteName: "LinkedGrow",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Sign Up - LinkedGrow",
    description:
      "Create your free LinkedGrow account and start growing your LinkedIn presence.",
  },
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: `${getAppUrl()}/sign-up`,
  },
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
