import { Metadata } from "next";
import Link from "next/link";
import { V3_ROOT } from "@/components/v3/root";
import { LegalHero } from "@/components/v3/legal-hero";
import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Privacy Policy - LinkedGrow",
  description:
    "Learn how LinkedGrow collects, uses, and protects your personal information. Read our comprehensive privacy policy.",
  openGraph: {
    title: "Privacy Policy - LinkedGrow",
    description:
      "Learn how LinkedGrow collects, uses, and protects your personal information.",
    url: "https://linkedgrow.ai/privacy",
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
    title: "Privacy Policy - LinkedGrow",
    description:
      "Learn how LinkedGrow collects, uses, and protects your personal information.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/privacy",
  },
};

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");

  return (
    <main className={V3_ROOT}>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          { name: "Privacy Policy", url: "https://linkedgrow.ai/privacy" },
        ]}
      />
      <Header />

      <LegalHero eyebrow="Legal" meta={t("lastUpdated")} title={t("title")} />

      <div className="pb-16 pt-[clamp(40px,5vw,64px)] md:pb-24">
        <div className="mx-auto max-w-4xl px-6">

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{t("section1.title")}</h2>
              <p className="text-muted-foreground mb-4">
                {t("section1.p1")}
              </p>
              <p className="text-muted-foreground">
                {t("section1.p2")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{t("section2.title")}</h2>

              <h3 className="text-xl font-medium mb-3 text-slate-800 dark:text-slate-200">{t("section2.sub1.title")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("section2.sub1.description")}
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                {(t.raw("section2.sub1.items") as string[]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-medium mb-3 text-slate-800 dark:text-slate-200">{t("section2.sub2.title")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("section2.sub2.description")}
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                {(t.raw("section2.sub2.items") as string[]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>

              <h3 className="text-xl font-medium mb-3 text-slate-800 dark:text-slate-200">{t("section2.sub3.title")}</h3>
              <p className="text-muted-foreground">
                {t("section2.sub3.description")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{t("section3.title")}</h2>
              <p className="text-muted-foreground mb-4">{t("section3.description")}</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                {(t.raw("section3.items") as string[]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{t("section4.title")}</h2>
              <p className="text-muted-foreground mb-4">
                {t("section4.p1")} <Link href="/cookies" className="text-cyan-600 hover:underline">{t("section4.cookieLink")}</Link>.
              </p>
              <p className="text-muted-foreground">
                {t("section4.p2")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{t("section5.title")}</h2>
              <p className="text-muted-foreground mb-4">{t("section5.description")}</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                {(t.raw("section5.items") as string[]).map((item, i) => (
                  <li key={i}><strong>{item.split(" - ")[0]}</strong> - {item.split(" - ")[1]}</li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{t("section6.title")}</h2>
              <p className="text-muted-foreground">
                {t("section6.description")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{t("section7.title")}</h2>
              <p className="text-muted-foreground mb-4">{t("section7.description")}</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                {(t.raw("section7.items") as string[]).map((item, i) => (
                  <li key={i}><strong>{item.split(" - ")[0]}</strong> - {item.split(" - ")[1]}</li>
                ))}
              </ul>
              <p className="text-muted-foreground mt-4">
                {t("section7.contact")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{t("section8.title")}</h2>
              <p className="text-muted-foreground">
                {t("section8.description")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{t("section9.title")}</h2>
              <p className="text-muted-foreground">
                {t("section9.description")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{t("section10.title")}</h2>
              <p className="text-muted-foreground">
                {t("section10.description")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{t("section11.title")}</h2>
              <p className="text-muted-foreground">
                {t("section11.description")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">{t("section12.title")}</h2>
              <p className="text-muted-foreground">
                {t("section12.description")}
              </p>
              <p className="text-muted-foreground mt-2">
                {t("section12.email")} <a href="mailto:contact@linkedgrow.ai" className="text-cyan-600 hover:underline">contact@linkedgrow.ai</a>
              </p>
              <p className="text-muted-foreground mt-2">
                {t("section12.company")}
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
