"use client";

import Link from "next/link";

import { V3_ROOT } from "@/components/v3/root";
import {
  CHROME_DOT_LT,
  CHROME_LT,
  CHROME_URL_LT,
  EM_GRAD,
  EM_SKY,
  H2,
  LEAD_MUT,
  NARROW,
  RV,
  SCREEN_UI,
  SEC,
  FINALE,
  RINGS_FIN,
  SH,
  SH_BUL,
  WRAP,
} from "@/components/v3/kit";
import { LpHero } from "@/components/v3/lp-hero";
import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";
import { LandingFAQ } from "@/components/landing/landing-faq";
import { LandingCTA } from "@/components/landing/landing-cta";
import { LandingRelatedContent } from "@/components/landing/landing-related-content";
import { QuickAnswer } from "@/components/seo/quick-answer";
import { MarketingExitIntentPopup } from "@/components/marketing/exit-intent-popup";
import { V3UrlForm } from "@/components/v3/url-form";

/**
 * The scraper page.
 *
 * Nicolas's call, 2026-07-29: rank for the term. The plan flagged the risk that
 * the word frames the product as scraping, which cuts against every safety
 * argument, so the page does not pretend to be a scraper. It answers the
 * question honestly, shows what a scraped row is missing, and offers the thing
 * the searcher actually wanted. Bespoke rather than the shared feature shell,
 * because the centrepiece is the argument.
 */

const CSV_ROW = [
  { field: "name", value: "Sarah Whitfield" },
  { field: "headline", value: "Head of Talent at Northwind" },
  { field: "company", value: "Northwind Recruitment" },
  { field: "location", value: "Manchester, UK" },
  { field: "url", value: "linkedin.com/in/…" },
];

function Centrepiece() {
  return (
    <section className={SEC}>
      <div className={WRAP}>
        <header className={`${SH} ${RV}`}>
          <span className={SH_BUL} />
          <div>
            <h2 className={H2}>
              Same person. One of these{" "}
              <em className={EM_GRAD}>tells you what to say.</em>
            </h2>
            <p className={`${LEAD_MUT} mt-[18px]`}>
              An export and a signal cost about the same to obtain. Only one of
              them survives contact with a blank message box.
            </p>
          </div>
        </header>

        <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-2">
          {/* Both panels end on the same widget, the box you have to type into.
              Empty on one side and already written on the other is the whole
              argument, so the two sides are deliberately built the same way:
              a label, the material, the message box, one closing line. */}
          <figure className={`${SCREEN_UI} ${RV} m-0 flex h-full flex-col`}>
            <div className={CHROME_LT}>
              <span className={CHROME_DOT_LT} />
              <span className={CHROME_DOT_LT} />
              <span className={CHROME_DOT_LT} />
              <span className={CHROME_URL_LT}>linkedin-export-2026-07-29.csv</span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-dashed border-v3-line px-3 py-1 font-v3-mono text-[10.5px] uppercase tracking-[.12em] text-v3-faint dark:border-v3-line-d dark:text-v3-faint-d">
                What a scraper hands you
              </span>

              <table className="mt-4 w-full border-collapse text-left">
                <tbody>
                  {CSV_ROW.map((cell, i) => (
                    <tr
                      className="border-b border-v3-line last:border-b-0 dark:border-v3-line-d"
                      key={cell.field}
                    >
                      <td className="w-[4ch] py-2.5 pr-3 text-right font-v3-mono text-[11px] text-v3-faint dark:text-v3-faint-d">
                        {i + 1}
                      </td>
                      <td className="w-[10ch] py-2.5 pr-4 font-v3-mono text-[11px] uppercase tracking-[.04em] text-v3-faint dark:text-v3-faint-d">
                        {cell.field}
                      </td>
                      <td className="truncate py-2.5 font-v3-mono text-[12.5px] text-v3-ink2 dark:text-v3-ink2-d">
                        {cell.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-auto pt-7">
                <p className="m-0 font-v3-mono text-[10.5px] uppercase tracking-[.12em] text-v3-faint dark:text-v3-faint-d">
                  Your first message to Sarah
                </p>
                <div className="mt-2.5 flex min-h-[104px] items-start rounded-[12px] border border-dashed border-v3-line bg-v3-wash/50 p-4 dark:border-v3-line-d dark:bg-v3-wash-d/40">
                  <span className="mr-px inline-block h-[18px] w-px bg-v3-faint dark:bg-v3-faint-d" />
                  <span className="text-[14.5px] leading-[1.6] text-v3-faint dark:text-v3-faint-d">
                    Nothing in the row tells you where to start.
                  </span>
                </div>
              </div>

              <p className="mt-5 border-t border-v3-line pt-4 text-[14.5px] leading-[1.6] text-v3-mut dark:border-v3-line-d dark:text-v3-mut-d">
                Five true facts, and not one of them says why this week matters
                rather than next year. Multiply the row by 800 and you have an
                enrichment bill on top of the same empty box.
              </p>
            </div>
          </figure>

          <figure
            className={`${SCREEN_UI} ${RV} m-0 flex h-full flex-col border-[rgba(21,93,252,.28)] shadow-[0_44px_90px_-46px_rgba(21,93,252,.4)] dark:border-[rgba(140,228,245,.22)]`}
            style={{ "--d0": "110ms" } as React.CSSProperties}
          >
            <div className={CHROME_LT}>
              <span className={CHROME_DOT_LT} />
              <span className={CHROME_DOT_LT} />
              <span className={CHROME_DOT_LT} />
              <span className={CHROME_URL_LT}>app.linkedgrow.ai/dashboard/agents</span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[rgba(21,93,252,.28)] bg-v3-wash px-3 py-1 font-v3-mono text-[10.5px] uppercase tracking-[.12em] text-v3-blue dark:border-[rgba(140,228,245,.24)] dark:bg-v3-wash-d dark:text-v3-sky">
                <i className="size-1.5 rounded-full bg-v3-blue dark:bg-v3-sky" />
                What the agent hands you
              </span>

              <div className="mt-4 flex items-start gap-3">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-v3-wash font-v3-display text-[14px] font-semibold text-v3-blue dark:bg-v3-wash-d dark:text-v3-sky">
                  SW
                </span>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[14.5px] font-semibold text-v3-ink dark:text-v3-ink-d">
                    Sarah Whitfield
                  </p>
                  <p className="m-0 text-[12.5px] text-v3-faint dark:text-v3-faint-d">
                    Head of Talent at Northwind · posted 2 days ago
                  </p>
                </div>
                <span className="flex-none rounded-full bg-v3-wash px-2.5 py-1 font-v3-mono text-[10.5px] tracking-[.08em] text-v3-blue dark:bg-v3-wash-d dark:text-v3-sky">
                  FIT 94
                </span>
              </div>

              <blockquote className="m-0 mt-4 rounded-[12px] border-l-2 border-v3-blue bg-v3-wash/60 py-3.5 pl-4 pr-4 text-[15.5px] leading-[1.62] text-v3-ink2 dark:border-v3-sky dark:bg-v3-wash-d/50 dark:text-v3-ink2-d">
                &ldquo;Third time this quarter we have lost a candidate between
                the second interview and the offer. It is always the scheduling
                gap. Anyone actually solved this?&rdquo;
              </blockquote>

              {/* Why she surfaced, in the words the agent scored her on. It
                  also fills the height the CSV rows take on the other side. */}
              <dl className="mt-5 grid gap-2.5">
                {[
                  ["Signal", "She stated the problem out loud"],
                  ["Timing", "Posted 2 days ago, still open"],
                ].map(([term, value]) => (
                  <div className="flex items-baseline gap-3" key={term}>
                    <dt className="w-[4.5rem] flex-none font-v3-mono text-[10.5px] uppercase tracking-[.1em] text-v3-faint dark:text-v3-faint-d">
                      {term}
                    </dt>
                    <dd className="m-0 text-[13.5px] text-v3-mut dark:text-v3-mut-d">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-auto pt-7">
                <p className="m-0 font-v3-mono text-[10.5px] uppercase tracking-[.12em] text-v3-faint dark:text-v3-faint-d">
                  Your first message to Sarah
                </p>
                <div className="mt-2.5 min-h-[104px] rounded-[12px] border border-[rgba(21,93,252,.3)] bg-v3-wash p-4 dark:border-[rgba(140,228,245,.26)] dark:bg-v3-wash-d">
                  <p className="m-0 text-[14.5px] leading-[1.6] text-v3-ink2 dark:text-v3-ink2-d">
                    Sarah, the gap between the second interview and the offer is
                    where we lost people too. What have you already tried there?
                  </p>
                </div>
              </div>

              <p className="mt-5 border-t border-v3-line pt-4 text-[14.5px] leading-[1.6] text-v3-mut dark:border-v3-line-d dark:text-v3-mut-d">
                The same person, plus the sentence that makes her worth writing
                to this week. The opening line comes out of her own words, so
                nobody has to invent a reason to be in her inbox.
              </p>
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}

const SECTIONS = [
  {
    title: "What a LinkedIn scraper actually does",
    paragraphs: [
      "A scraper visits profiles and copies the visible fields into a spreadsheet. Name, headline, company, location, profile URL. Most of them run as a Chrome extension using your own logged-in session, which is why they are cheap: your machine and your account are the infrastructure doing the visiting.",
      "Some add enrichment on top, guessing at an email address from the name and the company domain and charging per credit for the guess. The guess is right often enough to be useful and wrong often enough to hurt a sending domain, which is a separate problem you inherit the day you start using it.",
      "None of that is difficult technology. The reason scrapers exist is that LinkedIn does not let you export, and the reason that matters is the next section.",
    ],
  },
  {
    title: "What it costs you, honestly",
    paragraphs: [
      "LinkedIn's user agreement prohibits automated data collection, and the platform detects it by pattern rather than by tool. What stands out is volume without variation: an account that normally views 10 profiles a day suddenly viewing 400 in an hour, often from an address it has never used before. Slow extraction from an established account is rarely noticed. Bulk extraction usually is.",
      "The legal question and the account question are separate, and people conflate them constantly. Scraping public data has survived court challenges in the United States, which tells you something about what a court will do and nothing at all about what LinkedIn will do to your profile, which it can restrict at its own discretion under its own terms.",
      "So the real cost is not a lawsuit. It is a restriction on the account carrying a decade of your professional relationships, applied at a moment you did not choose, over a spreadsheet you could have filled a slower way.",
    ],
  },
  {
    title: "The thing you were actually trying to buy",
    paragraphs: [
      "Almost nobody wants a spreadsheet. They want conversations with people who might buy, and a scrape is the route they know. The trouble is that the export strips out the only thing that makes a cold message work, which is the reason you are writing this week.",
      "LinkedGrow takes the other route. You give it your website address, it reads the site and works out who buys from you, and then it watches LinkedIn every working day for those people: anyone engaging with a competitor, asking about the problem you solve in public, or newly in the seat that owns it. Nothing is exported and nothing is enriched.",
      "Each lead keeps the post or comment that surfaced it, linked. The invitation quotes that, one message follows once they accept, one follow-up after that, and then it stops. A reply cancels everything queued for that person and lands in your inbox.",
      "It runs from your own LinkedIn account through its own cloud session, on a dedicated residential address in the country you pick, inside your office hours, at a pace the account has earned through warm-up. That is the opposite pattern to a scrape: low volume, consistent address, boring rhythm, nothing that looks like a burst.",
    ],
  },
];

export function LinkedinScraperContent({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  return (
    <main className={V3_ROOT}>
      <Header />

      <LpHero
        annotations={{
          left: "no export,\nno enrichment bill",
          right: "every lead shows you\nthe post it came from",
        }}
        badge="An honest answer, from a tool that is not one"
        em={<em className={EM_SKY}>except a reason to write.</em>}
        formLabel="Show me my buyers"
        headline="Everything a LinkedIn scraper gives you,"
        lead="A spreadsheet is not a pipeline. LinkedGrow finds the same people from what they post in public, keeps the sentence that makes each one worth writing to, and opens the conversation from your own account. Nothing is exported and nothing is enriched."
        video={{
          url: "app.linkedgrow.ai/dashboard/agents",
          caption: "A lead arriving with the post that produced it, not a CSV row",
          number: "Video 01",
        }}
      />


      <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
        <QuickAnswer
          answer="A LinkedIn scraper copies profile fields into a spreadsheet, usually through a browser extension on your own account. It gives you names and titles, and it gives you no reason to write to any of them this week. LinkedGrow finds the same people from public signals, keeps the post that surfaced each one, and never exports anything."
          question="What is a LinkedIn scraper, and is it worth it?"
        />
      </div>

      <Centrepiece />

      {SECTIONS.map((block, index) => (
        <section
          className={`${SEC} ${index === 1 ? "bg-v3-bg2 dark:bg-v3-bg2-d" : ""}`}
          key={block.title}
        >
          <div className={NARROW}>
            <header className={`${SH} ${RV}`}>
              <span className={SH_BUL} />
              <h2 className={H2}>{block.title}</h2>
            </header>
            <div className="mt-8 grid gap-6 pl-[33px] max-[640px]:pl-0">
              {block.paragraphs.map((paragraph, i) => (
                <p
                  className={`${RV} max-w-[62ch] text-[16.5px] leading-[1.68] text-v3-mut dark:text-v3-mut-d`}
                  key={paragraph.slice(0, 40)}
                  style={{ "--d0": `${i * 60}ms` } as React.CSSProperties}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Mid-page ask. On the dark panel, because the url form is built for
          the hero's field: on a light card its input renders white on white
          and only the button survives. */}
      <section className="relative pb-[clamp(48px,6vw,84px)]">
        <div className={NARROW}>
          <div className={`${FINALE} ${RV}`}>
            <div className={RINGS_FIN}><i></i><i></i><i></i></div>
            <div className="relative z-[2]">
              <h2 className="m-0 mx-auto max-w-[20ch] font-v3-display! text-[clamp(24px,3vw,34px)] font-semibold! leading-[1.1]! tracking-[-.04em]! text-white">
                Try it on your own site
              </h2>
              <p className="mx-auto mt-[14px] max-w-[52ch] text-[15.5px] leading-[1.6]! text-[rgba(255,255,255,.76)]">
                Paste your address and the agent reads the page, works out who
                buys from you, and shows you the profile it built before it
                touches LinkedIn.
              </p>
              <V3UrlForm className="mt-7 w-full" label="Show me my buyers" />
              <p className="mt-5 text-[13.5px] text-[rgba(255,255,255,.55)]">
                Would rather do that part by hand? The{" "}
                <Link
                  className="font-medium text-v3-sky underline-offset-4 hover:underline"
                  href="/free-tools/ideal-customer-profile-template"
                >
                  ideal customer profile template
                </Link>{" "}
                is free and takes about 5 minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <LandingFAQ
        description="The questions people ask before deciding how to get leads off LinkedIn."
        faqs={faqs}
        headline={{ text: "Questions about", gradient: "scraping LinkedIn" }}
      />

      <LandingRelatedContent
        headline="Related"
        links={[
          { title: "LinkedIn prospecting", href: "/features/linkedin-prospecting" },
          { title: "Buying signals", href: "/features/buying-signals" },
          { title: "LinkedIn connection limit", href: "/features/linkedin-connection-limit" },
          { title: "Best LinkedIn automation tools", href: "/linkedin-automation-tools" },
          { title: "Ideal customer profile template", href: "/free-tools/ideal-customer-profile-template" },
        ]}
      />

      <LandingCTA
        badge="No export, no enrichment bill"
        description="Give the agent your website address. It works out who buys from you, watches for the week they start looking, and opens the conversation from your own account at a pace that account can carry."
        headline={{ line1: "Skip the spreadsheet.", gradient: "Start the conversation." }}
        primaryCta={{ text: "Launch my agent", href: "/sign-up" }}
        trustIndicators={["7-day trial", "Cancel before day 7", "Everything included"]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
