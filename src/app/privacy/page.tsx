import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";

export const metadata: Metadata = {
  title: "Privacy Policy | LinkedGrow",
  description: "Learn how LinkedGrow collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <Header />

      <div className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">
            Last updated: January 2026
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground mb-4">
                LinkedGrow (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services at linkedgrow.ai.
              </p>
              <p className="text-muted-foreground">
                By using LinkedGrow, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-medium mb-3">2.1 Personal Information</h3>
              <p className="text-muted-foreground mb-4">
                When you register for an account, we collect:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>Email address</li>
                <li>Name (optional)</li>
                <li>Password (encrypted)</li>
                <li>LinkedIn profile information (when you connect your account)</li>
                <li>Payment information (processed securely by Stripe)</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">2.2 Usage Data</h3>
              <p className="text-muted-foreground mb-4">
                We automatically collect certain information when you use our service:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>IP address and approximate location</li>
                <li>Browser type and version</li>
                <li>Pages visited and features used</li>
                <li>Time and date of visits</li>
                <li>Device information</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">2.3 AI API Keys</h3>
              <p className="text-muted-foreground">
                If you choose to bring your own AI API key (OpenAI, Anthropic, Google), we store it securely encrypted. We never use your API key for any purpose other than generating content at your request.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide and maintain our service</li>
                <li>Process your transactions and send related information</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Analyze usage patterns to improve our service</li>
                <li>Detect and prevent fraudulent activity</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Cookies and Tracking Technologies</h2>
              <p className="text-muted-foreground mb-4">
                We use cookies and similar tracking technologies to collect and track information about your browsing activity. For detailed information about the cookies we use and your choices regarding cookies, please see our <Link href="/cookies" className="text-cyan-600 hover:underline">Cookie Policy</Link>.
              </p>
              <p className="text-muted-foreground">
                You can manage your cookie preferences at any time through our cookie consent banner or by adjusting your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
              <p className="text-muted-foreground mb-4">We share your information with the following third-party services:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Stripe</strong> - Payment processing</li>
                <li><strong>LinkedIn</strong> - Account connection and posting</li>
                <li><strong>Google Analytics</strong> - Website analytics (with your consent)</li>
                <li><strong>Google Ads, Facebook, LinkedIn, TikTok</strong> - Advertising (with your consent)</li>
                <li><strong>Vercel</strong> - Website hosting</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your personal information for as long as your account is active or as needed to provide you services. You can request deletion of your account and associated data at any time by contacting us at privacy@linkedgrow.ai.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Your Rights (GDPR/CCPA)</h2>
              <p className="text-muted-foreground mb-4">Depending on your location, you may have the following rights:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Access</strong> - Request a copy of your personal data</li>
                <li><strong>Rectification</strong> - Request correction of inaccurate data</li>
                <li><strong>Erasure</strong> - Request deletion of your data</li>
                <li><strong>Portability</strong> - Request your data in a portable format</li>
                <li><strong>Objection</strong> - Object to processing of your data</li>
                <li><strong>Withdraw Consent</strong> - Withdraw previously given consent</li>
                <li><strong>Do Not Sell (CCPA)</strong> - Opt out of sale of personal information</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                To exercise these rights, contact us at privacy@linkedgrow.ai.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational measures to protect your personal information, including encryption, secure hosting, and regular security assessments. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
              <p className="text-muted-foreground">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers in compliance with GDPR and other applicable laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Children&apos;s Privacy</h2>
              <p className="text-muted-foreground">
                LinkedGrow is not intended for users under 16 years of age. We do not knowingly collect personal information from children under 16.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: <a href="mailto:privacy@linkedgrow.ai" className="text-cyan-600 hover:underline">privacy@linkedgrow.ai</a>
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
