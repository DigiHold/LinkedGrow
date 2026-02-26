"use client";

import Link from "next/link";
import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import { clearConsent, COOKIE_CATEGORIES } from "@/lib/cookies/consent";
import { useState } from "react";
import { Check, RefreshCw } from "lucide-react";

interface CookiesTranslations {
  title: string;
  lastUpdated: string;
  section1: { title: string; description: string };
  section2: { title: string; description: string; items: string[] };
  section3: { title: string; alwaysActive: string };
  section4: {
    title: string;
    description: string;
    ga: { title: string; description: string; link: string };
    gads: { title: string; description: string; link: string };
    meta: { title: string; description: string; link: string };
    linkedin: { title: string; description: string; link: string };
    tiktok: { title: string; description: string; link: string };
  };
  section5: {
    title: string;
    description: string;
    items: string[];
    reset: { title: string; description: string; button: string; cleared: string };
  };
  section6: { title: string; description: string };
  section7: { title: string; description: string };
  section8: { title: string; description: string };
  section9: { title: string; description: string; email: string; moreInfo: string; privacyLink: string };
}

export default function CookiesClient({ translations }: { translations: CookiesTranslations }) {
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
      <Header />

      <div className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">{translations.title}</h1>
          <p className="text-muted-foreground mb-8">
            {translations.lastUpdated}
          </p>

          <div className="prose prose-gray  max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{translations.section1.title}</h2>
              <p className="text-muted-foreground">
                {translations.section1.description}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{translations.section2.title}</h2>
              <p className="text-muted-foreground mb-4">
                {translations.section2.description}
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                {translations.section2.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{translations.section3.title}</h2>

              {Object.entries(COOKIE_CATEGORIES).map(([key, category]) => (
                <div key={key} className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-medium text-slate-800 dark:text-slate-200">{category.name} Cookies</h3>
                    {category.required && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-800 text-cyan-700 dark:text-cyan-300">
                        {translations.section3.alwaysActive}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-3">{category.description}</p>
                  <div className="space-y-2">
                    {category.cookies.map((cookie, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
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
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{translations.section4.title}</h2>
              <p className="text-muted-foreground mb-4">
                {translations.section4.description}
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-medium mb-2 text-slate-800 dark:text-slate-200">{translations.section4.ga.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {translations.section4.ga.description}
                  </p>
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-600 hover:underline">
                    {translations.section4.ga.link} →
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-medium mb-2 text-slate-800 dark:text-slate-200">{translations.section4.gads.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {translations.section4.gads.description}
                  </p>
                  <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-600 hover:underline">
                    {translations.section4.gads.link} →
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-medium mb-2 text-slate-800 dark:text-slate-200">{translations.section4.meta.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {translations.section4.meta.description}
                  </p>
                  <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-600 hover:underline">
                    {translations.section4.meta.link} →
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-medium mb-2 text-slate-800 dark:text-slate-200">{translations.section4.linkedin.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {translations.section4.linkedin.description}
                  </p>
                  <a href="https://www.linkedin.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-600 hover:underline">
                    {translations.section4.linkedin.link} →
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-medium mb-2 text-slate-800 dark:text-slate-200">{translations.section4.tiktok.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {translations.section4.tiktok.description}
                  </p>
                  <a href="https://www.tiktok.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-600 hover:underline">
                    {translations.section4.tiktok.link} →
                  </a>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{translations.section5.title}</h2>
              <p className="text-muted-foreground mb-4">
                {translations.section5.description}
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
                {translations.section5.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>

              <div className="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800">
                <h4 className="font-medium mb-2 text-slate-800 dark:text-slate-200">{translations.section5.reset.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {translations.section5.reset.description}
                </p>
                <Button onClick={handleResetPreferences} variant="outline" className="gap-2">
                  {showConfirmation ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      {translations.section5.reset.cleared}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      {translations.section5.reset.button}
                    </>
                  )}
                </Button>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{translations.section6.title}</h2>
              <p className="text-muted-foreground">
                {translations.section6.description}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{translations.section7.title}</h2>
              <p className="text-muted-foreground">
                {translations.section7.description}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{translations.section8.title}</h2>
              <p className="text-muted-foreground">
                {translations.section8.description}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{translations.section9.title}</h2>
              <p className="text-muted-foreground">
                {translations.section9.description}
              </p>
              <p className="text-muted-foreground mt-2">
                {translations.section9.email} <a href="mailto:contact@linkedgrow.ai" className="text-cyan-600 hover:underline">contact@linkedgrow.ai</a>
              </p>
              <p className="text-muted-foreground mt-4">
                {translations.section9.moreInfo}{" "}
                <Link href="/privacy" className="text-cyan-600 hover:underline">{translations.section9.privacyLink}</Link>.
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
