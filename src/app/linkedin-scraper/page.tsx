import type { Metadata } from "next";

import {
  BreadcrumbJsonLd,
  FAQJsonLd,
  SoftwareApplicationJsonLd,
} from "@/components/seo/json-ld";

import { LinkedinScraperContent } from "./scraper-content";

const URL = "https://linkedgrow.ai/linkedin-scraper";
const OG = "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp";
const DESCRIPTION =
  "What a LinkedIn scraper actually gets you, what it costs your account, and the alternative that finds the same people with the reason to write already attached.";

export const metadata: Metadata = {
  title: "LinkedIn Scraper: What It Gets You, and What It Costs",
  description: DESCRIPTION,
  openGraph: {
    title: "LinkedIn Scraper: What It Gets You, and What It Costs",
    description: DESCRIPTION,
    url: URL,
    siteName: "LinkedGrow",
    type: "website",
    images: [{ url: OG, width: 1200, height: 630, alt: "LinkedGrow - LinkedIn scraper" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkedIn Scraper: What It Gets You, and What It Costs",
    description: DESCRIPTION,
    images: [OG],
  },
  alternates: { canonical: URL },
};

const faqs = [
  {
    question: "What is a LinkedIn scraper?",
    answer:
      "A tool that visits profiles and copies what it finds into a spreadsheet: name, title, company, sometimes a guessed email. Most run as a browser extension on your own machine, using your own logged-in session to do the visiting.",
  },
  {
    question: "Is scraping LinkedIn allowed?",
    answer:
      "LinkedIn's user agreement prohibits automated data collection, and the platform actively detects it. Public data scraping has survived court challenges in the United States, but that is a question about the law rather than about your account, which LinkedIn can restrict at its own discretion.",
  },
  {
    question: "Will a LinkedIn scraper get my account banned?",
    answer:
      "It can. The pattern LinkedIn reacts to is volume without variation: hundreds of profile views in an hour, from an account that normally views 10 a day, often from a fresh address. Slow extraction from an established account is rarely noticed. Bulk extraction usually is.",
  },
  {
    question: "What do you actually get from a scrape?",
    answer:
      "Rows. Name, headline, company, location and a profile URL, plus whatever enrichment you pay for on top. What you do not get is why any of those people would answer you this week, which is the part that decides whether the list is worth anything.",
  },
  {
    question: "Is there an alternative to scraping LinkedIn?",
    answer:
      "Yes. Instead of copying profiles into a spreadsheet, LinkedGrow watches for public signals daily, keeps the post or comment that surfaced each person, and opens the conversation from your own account at a pace that account can carry. No export, no enrichment bill.",
  },
];

export default function LinkedinScraperPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          { name: "LinkedIn Scraper", url: URL },
        ]}
      />
      <FAQJsonLd questions={faqs} />
      <SoftwareApplicationJsonLd
        description="LinkedGrow finds LinkedIn leads from public signals with the source post attached, instead of exporting profiles to a spreadsheet."
        name="LinkedGrow"
        offers={{ price: "99", priceCurrency: "USD" }}
        url={URL}
      />
      <LinkedinScraperContent faqs={faqs} />
    </>
  );
}
