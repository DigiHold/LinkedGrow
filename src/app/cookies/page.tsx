"use client";

import Link from "next/link";
import { PrelaunchHeader, PrelaunchFooter } from "@/components/prelaunch";
import { Button } from "@/components/ui/button";
import { clearConsent, COOKIE_CATEGORIES } from "@/lib/cookies/consent";
import { useState } from "react";
import { Check, RefreshCw } from "lucide-react";

export default function CookiesPage() {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleResetPreferences = () => {
    clearConsent();
    setShowConfirmation(true);
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-white dark:bg-slate-900">
      <PrelaunchHeader />

      <div className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">Cookie Policy</h1>
          <p className="text-muted-foreground mb-8">
            Last updated: January 2026
          </p>

          <div className="prose prose-gray  max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">1. What Are Cookies?</h2>
              <p className="text-muted-foreground">
                Cookies are small text files that are stored on your device when you visit a website. They help websites remember your preferences, keep you logged in, and understand how you use the site. Some cookies are essential for the website to function, while others help us improve your experience or show you relevant advertisements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">2. How We Use Cookies</h2>
              <p className="text-muted-foreground mb-4">
                LinkedGrow uses cookies and similar technologies for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Keep you signed in to your account</li>
                <li>Remember your preferences and settings</li>
                <li>Understand how you use our website</li>
                <li>Improve our services based on usage patterns</li>
                <li>Show you relevant advertisements on other platforms</li>
                <li>Measure the effectiveness of our marketing campaigns</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">3. Types of Cookies We Use</h2>

              {Object.entries(COOKIE_CATEGORIES).map(([key, category]) => (
                <div key={key} className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200">{category.name} Cookies</h3>
                    {category.required && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-800 text-cyan-700 dark:text-cyan-300">
                        Always Active
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-3">{category.description}</p>
                  <div className="space-y-2">
                    {category.cookies.map((cookie, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{cookie.name}:</span>{" "}
                          <span className="text-muted-foreground">{cookie.purpose}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">4. Third-Party Cookies</h2>
              <p className="text-muted-foreground mb-4">
                With your consent, we allow the following third parties to set cookies on our website:
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-medium mb-2 text-slate-800 dark:text-slate-200">Google Analytics (GA4)</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Helps us understand how visitors interact with our website, including page views, session duration, and user journeys.
                  </p>
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-600 hover:underline">
                    Google Privacy Policy →
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-medium mb-2 text-slate-800 dark:text-slate-200">Google Ads</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Used to track conversions from Google Ads and show you relevant ads based on your visit to LinkedGrow.
                  </p>
                  <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-600 hover:underline">
                    Google Ads Policy →
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-medium mb-2 text-slate-800 dark:text-slate-200">Meta (Facebook/Instagram) Pixel</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Tracks conversions from Meta ads and enables remarketing to show you relevant ads on Facebook and Instagram.
                  </p>
                  <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-600 hover:underline">
                    Meta Privacy Policy →
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-medium mb-2 text-slate-800 dark:text-slate-200">LinkedIn Insight Tag</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Tracks conversions from LinkedIn ads and provides insights about professional visitors to our site.
                  </p>
                  <a href="https://www.linkedin.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-600 hover:underline">
                    LinkedIn Privacy Policy →
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-medium mb-2 text-slate-800 dark:text-slate-200">TikTok Pixel</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Tracks conversions from TikTok ads and enables remarketing on the TikTok platform.
                  </p>
                  <a href="https://www.tiktok.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-600 hover:underline">
                    TikTok Privacy Policy →
                  </a>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">5. Your Cookie Choices</h2>
              <p className="text-muted-foreground mb-4">
                You have several options to manage cookies:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                <li><strong>Cookie Banner:</strong> When you first visit our site, you can accept all, reject all, or customize your preferences.</li>
                <li><strong>Browser Settings:</strong> Most browsers allow you to block or delete cookies through their settings.</li>
                <li><strong>Opt-Out Tools:</strong> You can opt out of interest-based advertising through the <a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">Digital Advertising Alliance</a>.</li>
              </ul>

              <div className="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800">
                <h4 className="font-medium mb-2 text-slate-800 dark:text-slate-200">Reset Your Cookie Preferences</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Click the button below to clear your cookie preferences and see the consent banner again.
                </p>
                <Button onClick={handleResetPreferences} variant="outline" className="gap-2">
                  {showConfirmation ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Preferences Cleared
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Reset Cookie Preferences
                    </>
                  )}
                </Button>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">6. EU/EEA Users</h2>
              <p className="text-muted-foreground">
                If you are located in the European Union or European Economic Area, we obtain your explicit consent before placing non-essential cookies on your device. You can withdraw your consent at any time by resetting your preferences above or adjusting your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">7. California Users (CCPA)</h2>
              <p className="text-muted-foreground">
                If you are a California resident, you have the right to opt out of the &quot;sale&quot; or &quot;sharing&quot; of your personal information. We do not sell your personal information in the traditional sense, but we may share it with advertising partners for targeted advertising purposes. You can opt out by rejecting marketing cookies in our consent banner.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">8. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">9. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about our use of cookies, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: <a href="mailto:contact@linkedgrow.ai" className="text-cyan-600 hover:underline">contact@linkedgrow.ai</a>
              </p>
              <p className="text-muted-foreground mt-4">
                For more information about how we handle your personal data, please see our{" "}
                <Link href="/privacy" className="text-cyan-600 hover:underline">Privacy Policy</Link>.
              </p>
            </section>
          </div>
        </div>
      </div>

      <PrelaunchFooter />
    </main>
  );
}
