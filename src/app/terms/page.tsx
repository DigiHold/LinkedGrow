import { Metadata } from "next";
import Link from "next/link";
import { V3_ROOT } from "@/components/v3/root";
import { LegalHero } from "@/components/v3/legal-hero";
import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Terms of Service - LinkedGrow",
  description:
    "Read the Terms of Service for LinkedGrow, the AI-powered LinkedIn content platform. Understand your rights and responsibilities.",
  openGraph: {
    title: "Terms of Service - LinkedGrow",
    description:
      "Read the Terms of Service for LinkedGrow, the AI-powered LinkedIn content platform.",
    url: "https://linkedgrow.ai/terms",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow - AI-Powered LinkedIn Growth Platform",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Terms of Service - LinkedGrow",
    description:
      "Read the Terms of Service for LinkedGrow, the AI-powered LinkedIn content platform.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/terms",
  },
};

export default function TermsPage() {
  return (
    <main className={V3_ROOT}>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          { name: "Terms of Service", url: "https://linkedgrow.ai/terms" },
        ]}
      />
      <Header />
      <LegalHero eyebrow="Legal" title="Terms of Service" />

      <div className="pb-16 pt-[clamp(4px,0.8vw,12px)] md:pb-24">
        <div className="mx-auto max-w-4xl px-6">

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground mb-4">
                By accessing and using LinkedGrow (&quot;the Service&quot;), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">2. Description of Service</h2>
              <p className="text-muted-foreground mb-4">
                LinkedGrow is an AI-powered platform that helps users create, schedule, and optimize LinkedIn content. The Service operates on a BYOK (Bring Your Own Key) model where users provide their own AI API keys for content generation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">3. User Accounts</h2>
              <p className="text-muted-foreground mb-4">
                To use certain features of the Service, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Providing accurate and complete information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">4. API Keys and Third-Party Services</h2>
              <p className="text-muted-foreground mb-4">
                When you provide API keys for third-party AI services (OpenAI, Anthropic, Google, Kimi, etc.):
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>You are responsible for compliance with those services&apos; terms</li>
                <li>API keys are stored securely in your browser&apos;s local storage</li>
                <li>We do not store your API keys on our servers</li>
                <li>You are responsible for any charges incurred through your API usage</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">5. Acceptable Use</h2>
              <p className="text-muted-foreground mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>Generate spam, misleading, or fraudulent content</li>
                <li>Violate LinkedIn&apos;s Terms of Service or Community Guidelines</li>
                <li>Infringe on intellectual property rights</li>
                <li>Harass, abuse, or harm others</li>
                <li>Distribute malware or engage in hacking activities</li>
                <li>Impersonate others or misrepresent your affiliation</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">6. Subscription and Payments</h2>
              <p className="text-muted-foreground mb-4">
                Paid subscriptions are billed in advance on a monthly or annual basis. All payments are processed securely through Stripe. You may cancel your subscription at any time, and cancellation will take effect at the end of your current billing period.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">7. Refund Policy</h2>
              <p className="text-muted-foreground mb-4">
                We offer a 14-day money-back guarantee for new subscriptions. If you&apos;re not satisfied with our Service within the first 14 days, contact us at <a href="mailto:contact@linkedgrow.ai" className="text-cyan-600 hover:underline">contact@linkedgrow.ai</a> for a full refund.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">8. Intellectual Property</h2>
              <p className="text-muted-foreground mb-4">
                The Service and its original content, features, and functionality are owned by LinkedGrow and are protected by international copyright, trademark, and other intellectual property laws. Content you create using the Service belongs to you.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">9. Limitation of Liability</h2>
              <p className="text-muted-foreground mb-4">
                LinkedGrow shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service. Our total liability shall not exceed the amount paid by you in the twelve months preceding the claim.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">10. Changes to Terms</h2>
              <p className="text-muted-foreground mb-4">
                We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the Service. Continued use after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">11. Governing Law</h2>
              <p className="text-muted-foreground mb-4">
                These Terms shall be governed by and construed in accordance with the laws of France, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">12. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about these Terms, please contact us at:
              </p>
              <p className="text-muted-foreground">
                Email: <a href="mailto:contact@linkedgrow.ai" className="text-cyan-600 hover:underline">contact@linkedgrow.ai</a>
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
