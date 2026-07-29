"use client";

import { motion } from "framer-motion";
import { Brain, Handshake, PauseCircle } from "lucide-react";

import { V3_ROOT } from "@/components/v3/root";
import {
  CARVE_BASE,
  EB_DOT_LT,
  EB_LT,
  EM_GRAD,
  H2,
  H3,
  HERO_FIELD,
  HERO_ORB_A,
  HERO_ORB_B,
  HERO_RINGS,
  LEAD_MUT,
  NARROW,
  RV,
  SEC,
  SH,
  SH_BUL,
  VPROP,
} from "@/components/v3/kit";
import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";
import { LandingFAQ } from "@/components/landing/landing-faq";
import { LandingCTA } from "@/components/landing/landing-cta";
import { LandingRelatedContent } from "@/components/landing/landing-related-content";
import { QuickAnswer } from "@/components/seo/quick-answer";
import { MarketingExitIntentPopup } from "@/components/marketing/exit-intent-popup";
import { V3UrlForm } from "@/components/v3/url-form";

/**
 * The agent page, for "linkedin ai agent" (110 / KD 1) and "ai agent for
 * linkedin" (50 / KD 0). Both are owned outright at that difficulty and both
 * describe the product exactly, so this is the page that should rank when
 * somebody searches for the category by its right name.
 *
 * The centrepiece is a working day rather than a feature grid, because the
 * difference between an agent and an automation is what it decides hour to
 * hour, and a grid cannot show a decision.
 */

const DAY = [
  {
    time: "09:00",
    title: "It looks at what changed overnight",
    body: "New comments on the competitor posts you named, questions in the topics you follow, people who started this month in the role that owns your problem. Everything it finds is scored against the profile it built from your website.",
  },
  {
    time: "09:40",
    title: "It picks today's few, not today's many",
    body: "The account can carry a fixed number of invitations, so the job is choosing. Weak fits never enter the queue, and anyone your other agents have already touched is dropped before you see them.",
  },
  {
    time: "10:15",
    title: "It warms before it asks",
    body: "A profile view, then one genuine like on the post that surfaced them. Your name appears twice before the invitation arrives, which is most of what familiarity means to a stranger.",
  },
  {
    time: "11:00",
    title: "It writes each note from a different sentence",
    body: "Not a template with a first name in it. The note quotes what that person actually said, which is why two people with the same title at the same company get two different messages.",
  },
  {
    time: "14:30",
    title: "It follows up once, and only once",
    body: "A single nudge about a week after somebody accepted without answering. There is no third message to configure, because a third message costs more than it returns.",
  },
  {
    time: "16:00",
    title: "It stops the moment anyone replies",
    body: "Everything queued for that person is cancelled and the thread lands in your inbox with the original post beside it. What happens next is a conversation between two people, and the agent has no part in it.",
  },
];

function WorkingDay() {
  return (
    <section className={SEC}>
      <div className={NARROW}>
        <header className={`${SH} ${RV}`}>
          <span className={SH_BUL} />
          <div>
            <h2 className={H2}>
              A day it works, while you{" "}
              <em className={EM_GRAD}>do something else.</em>
            </h2>
            <p className={`${LEAD_MUT} mt-[18px]`}>
              Office hours in your own timezone, at the pace your account has
              earned. Nothing happens at 3am, because nothing a person does
              happens at 3am.
            </p>
          </div>
        </header>

        {/* The rail is one line behind the chips, so a chip can never drift off
            it the way an offset positioned against the text column did. */}
        <ol className="relative mt-12 grid gap-0 pl-0">
          <span
            aria-hidden
            className="absolute bottom-8 left-[19px] top-8 w-px bg-v3-line dark:bg-v3-line-d"
          />
          {DAY.map((step, index) => (
            <li
              className={`${RV} relative grid grid-cols-[38px_1fr] items-start gap-x-6 pb-11 last:pb-0`}
              key={step.time}
              style={{ "--d0": `${index * 70}ms` } as React.CSSProperties}
            >
              {/* The step number, not the hour: two of the hours share a digit
                  and a chip reading 09 twice looks like a rendering fault. */}
              <span className="relative z-[1] grid h-[38px] w-[38px] place-items-center rounded-full border border-[rgba(21,93,252,.16)] bg-v3-wash font-v3-mono text-[11.5px] font-medium text-v3-blue dark:bg-v3-wash-d">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="pt-[5px]">
                <span className="block font-v3-mono text-[11px] uppercase tracking-[.16em] text-v3-blue">
                  {step.time}
                </span>
                <h3 className={`${H3} mt-[7px]`}>{step.title}</h3>
                <p className="mt-[9px] max-w-[56ch] text-[15.5px] leading-[1.62] text-v3-mut dark:text-v3-mut-d">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const SECTIONS = [
  {
    tinted: true,
    title: "What makes it an agent rather than an automation",
    paragraphs: [
      "Automation repeats an action you already decided on. You build a campaign, point it at a list, and it executes exactly that until you stop it. Every good outcome traces back to a decision you made before it started running, which is why the quality of the list is the whole game.",
      "An agent decides. It arrives at a set of people it found rather than a list you supplied, works out which of them are worth the invitations available today, reads the thing each one wrote, and writes from that. The same input produces different output for two people who look identical in a spreadsheet.",
      "The clearest test is what happens when somebody answers. An automation continues until a rule tells it to stop, which is how a follow-up lands two days after a reply. An agent treats the reply as the end of its job, because getting a conversation started was the job.",
    ],
  },
  {
    tinted: false,
    title: "It works your account, so it protects your account",
    paragraphs: [
      "Everything the agent does comes from your own profile through its own cloud session, on a dedicated residential address in the country you pick, kept for as long as the account exists. LinkedIn compares each sign-in against where the account has always signed in from, and an address that never moves is the least interesting thing it can see.",
      "Warm-up belongs to the account rather than to the campaign. A newly connected profile starts at a handful of invitations a day and climbs over weeks, and a profile that already served that ramp keeps the pace it earned even if you delete the agent and build a new one.",
      "When several agents run from one profile, they divide a single daily budget instead of each spending their own. That one decision is what stops the most common way a careful setup gets an account restricted: two campaigns, each configured safely, sending double between them.",
    ],
  },
  {
    tinted: true,
    title: "What it will not do",
    paragraphs: [
      "It never scrapes or exports profiles, and there is no spreadsheet anywhere in the product. It never sends email, so there is no domain to warm, no enrichment credits and no deliverability to manage. It never likes or comments on anything that is not part of warming a specific person you chose to approach.",
      "And it never answers for you. A reply is handed over with the post that started it, and the words you send back are yours. An agent that argued with your prospects on your behalf would be a liability rather than a feature, and it is not something you can switch on here.",
    ],
  },
];

export function LinkedinAiAgentContent({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  return (
    <main className={V3_ROOT}>
      <Header />

      <section className={`${HERO_FIELD} pb-[clamp(124px,13.5vw,190px)]`}>
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]">
          <span className={HERO_ORB_A}></span>
          <span className={HERO_ORB_B}></span>
          <div className={HERO_RINGS}><i></i><i></i><i></i></div>
        </div>
        <canvas
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
          id="net"
        ></canvas>

        <div className="relative z-[3] mx-auto max-w-[1220px] px-6 text-center">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 ${EB_LT}`}
            initial={{ opacity: 0, y: 20 }}
          >
            <i className={EB_DOT_LT} />
            One agent, one account
          </motion.div>

          <motion.h1
            animate={{ opacity: 1, y: 0 }}
            className="m-0 mb-4 flex flex-col items-center font-v3-display! text-[clamp(43px,6.8vw,88px)] font-semibold! leading-[.98]! tracking-[-.048em]! text-white"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.05 }}
          >
            <span className="leading-[1.18]">LinkedIn AI Agent:</span>{" "}
            <span className="leading-[1.18] text-v3-sky">
              It Works Your Account All Day
            </span>
          </motion.h1>

          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-8 max-w-[62ch] text-[clamp(16.5px,1.35vw,19px)] leading-[1.58]! text-[rgba(255,255,255,.76)]"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
          >
            It reads your website to learn who buys from you, watches LinkedIn
            every working day for those people, writes each note from what they
            actually posted, and hands you the conversation the moment somebody
            answers.
          </motion.p>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-[620px]"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.15 }}
          >
            <V3UrlForm label="Show me my buyers" />
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.2 }}
          >
            {[
              { icon: Brain, text: "It chooses, not just repeats" },
              { icon: Handshake, text: "From your own profile" },
              { icon: PauseCircle, text: "Stops on the first reply" },
            ].map((item) => (
              <div className={VPROP} key={item.text}>
                <item.icon className="h-[15px] w-[15px]" />
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <div className={`${CARVE_BASE} bg-v3-bg dark:bg-v3-bg-d`}></div>
      </section>

      <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
        <QuickAnswer
          answer="A LinkedIn AI agent works an account the way a person would rather than firing a campaign at a list. LinkedGrow's reads your website to learn who buys from you, finds those people daily from public signals, writes each note from what they posted, follows up once, and stops the moment anyone replies."
          question="What is a LinkedIn AI agent?"
        />
      </div>

      <WorkingDay />

      {SECTIONS.map((block) => (
        <section
          className={`${SEC} ${block.tinted ? "bg-v3-bg2 dark:bg-v3-bg2-d" : ""}`}
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

      <LandingFAQ
        description="What people ask before handing an agent their LinkedIn account."
        faqs={faqs}
        headline={{ text: "Questions about the", gradient: "LinkedIn AI agent" }}
      />

      <LandingRelatedContent
        headline="Related"
        links={[
          { title: "LinkedIn outreach automation", href: "/features/linkedin-outreach-automation" },
          { title: "LinkedIn prospecting", href: "/features/linkedin-prospecting" },
          { title: "Buying signals", href: "/features/buying-signals" },
          { title: "LinkedIn MCP server", href: "/features/linkedin-mcp" },
          { title: "Pricing", href: "/pricing" },
        ]}
      />

      <LandingCTA
        badge="Agent AI included"
        description="Give it your website address and it works out who buys from you before you type anything else. Two connected LinkedIn accounts on Pro, a dedicated address each, and the AI that writes is in the price."
        headline={{ line1: "Put it to work", gradient: "on your own account." }}
        primaryCta={{ text: "Launch my agent", href: "/sign-up" }}
        trustIndicators={["7-day Pro trial", "No credit card required", "Everything included"]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
