"use client";

import { V3_ROOT } from "@/components/v3/root";
import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { QuickAnswer } from "@/components/seo/quick-answer";
import { LandingPainPoints } from "@/components/landing/landing-pain-points";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingBYOK } from "@/components/landing/landing-byok";
import { LandingFAQ } from "@/components/landing/landing-faq";
import { LandingCTA } from "@/components/landing/landing-cta";
import { MarketingExitIntentPopup } from "@/components/marketing/exit-intent-popup";
import { LandingRelatedContent } from "@/components/landing/landing-related-content";
import {
  Bot,
  Radar,
  MessageSquare,
  CalendarCheck,
  Globe,
  Inbox,
  Brain,
  ShieldCheck,
  Sparkles,
  Users,
  CircleDollarSign,
  Database,
  ShoppingCart,
  Repeat,
  Unplug,
  AlertTriangle,
  Filter,
  BarChart3,
} from "lucide-react";

export function AiSalesAgentContent({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  return (
    <main className={V3_ROOT}>
      <Header />

      <LandingHero
        badge={{ icon: Bot, text: "AI Sales Agent" }}
        headline={{
          line1: "The AI sales agent that finds",
          gradient: "your clients on LinkedIn",
        }}
        descriptionBold="LinkedGrow is an AI sales agent for founders, consultants and agencies who sell on LinkedIn. You describe who you sell to, and it works your own account every working day."
        description="Most AI sales agents wrap software around a bought list and blast the same message to strangers. LinkedGrow works the other way around: it reads your website, learns who buys from you, then watches LinkedIn for the people already engaging around your topic. It writes each message from what that person actually posted, sends it from your own account at a human pace, and lands every reply in one inbox so you answer the ones worth your time."
        valuePropBadges={[
          { icon: Radar, text: "Finds buyers on LinkedIn" },
          { icon: MessageSquare, text: "Writes from real signals" },
          { icon: CalendarCheck, text: "Books the call" },
        ]}
        primaryCta={{ text: "Start your 7-day trial", href: "/sign-up" }}
        trustIndicators={[
          "7-day trial, card required",
          "Runs on your own account",
          "179+ founders on board",
        ]}
        video={{
          videoId: "1MVCdQZiN9I",
          thumbnailUrl:
            "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/video-thumb-agents.avif",
          duration: "1:22",
          ctaText: "See pricing",
          ctaHref: "/pricing",
        }}
      />

      <QuickAnswer
        question="What is an AI sales agent?"
        answer="An AI sales agent is software that runs the manual half of selling on its own: it finds people who match your buyer, starts the conversation, follows up, and hands over anyone who shows interest. LinkedGrow is the LinkedIn version, working your own account at a human pace inside the hours you set."
      />

      <LandingPainPoints
        badge={{ icon: AlertTriangle, text: "Why most AI sales agents fall flat" }}
        badgeColor="red"
        headline={{
          text: "A slicker message to a cold list",
          gradient: "is still a cold message.",
        }}
        descriptionBold="Buy a database, load it into a sequencer, let AI write a smoother opener. That is the shape of most AI sales agents, and it is why buyers stopped replying."
        description="AI made it faster to send more of the same outreach, not better at earning a reply. The data is still cold, the copy still reads like a template, and the volume is still what gets an account flagged. A LinkedIn seller needs the opposite: an agent that starts from who is already interested, and that treats the account it runs on as something to protect."
        problems={[
          {
            icon: Database,
            stat: "Cold",
            title: "AI on a bought list is still cold",
            description:
              "Most AI sales agents begin with purchased contact data, which is names and emails rather than intent. The AI writes a slicker line, but the person on row 4,000 never read your work or visited your site. You are still a stranger in a full inbox, and bought data ages fast as people change jobs and titles.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: ShoppingCart,
            stat: "Wrong job",
            title: "Built for carts and tickets, not B2B deals",
            description:
              "A lot of what gets sold as an AI sales agent recovers abandoned carts or answers support questions. Useful for a store, useless for a founder who needs real outbound. The tool automates the busywork of ecommerce, not the conversations that actually win a consulting or agency client.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: Repeat,
            stat: "Flagged",
            title: "Volume without relevance costs you the account",
            description:
              "The same template to 500 people gets ignored, reported, and eventually restricted. On LinkedIn that risks the profile you spent years building. An agent that bursts activity to chase a number is trading your account for a vanity stat, and the account is the thing you cannot buy back.",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: Unplug,
            stat: "None",
            title: "No line from a reply back to its cause",
            description:
              "Most tools hand you a reply with no context, so you never learn which post or topic brought that person in. Without that signal you cannot tell which sources are worth repeating, and you keep buying more data instead of doubling down on the channel that already works.",
            color: "from-rose-500 to-red-600",
          },
        ]}
      />

      <LandingHowItWorks
        badge="From website to first conversation"
        headline={{
          text: "How the AI sales agent works",
          gradient: "your LinkedIn account",
        }}
        description="You describe the business one time up front. The agent does the daily work, and you step in only when someone is worth talking to."
        steps={[
          {
            number: "01",
            title: "Point it at your website",
            description:
              "Paste your URL, and the agent reads what you sell, drafts your ideal customer profile, and proposes the buying signals to watch. You correct it in a sentence, and the targeting is done without a spreadsheet or a list to import.",
            icon: Globe,
            color: "from-cyan-500 to-blue-500",
            time: "5 min setup",
          },
          {
            number: "02",
            title: "Connect your LinkedIn account",
            description:
              "The agent runs on your own account through a real browser, on an address kept for you alone, so the activity looks like yours because it is. You set daily limits you are comfortable with, and nothing ever goes out faster than a person would send it.",
            icon: Users,
            color: "from-violet-500 to-purple-500",
            time: "2 min",
          },
          {
            number: "03",
            title: "Let it find and message buyers",
            description:
              "Each day the agent surfaces people engaging around your topic, writes a message from what they posted, and sends it at a human pace. Every lead arrives linked to the post that surfaced it, so you can see why each person is a fit the moment they land.",
            icon: Radar,
            color: "from-emerald-500 to-green-500",
            time: "Daily, hands-off",
          },
          {
            number: "04",
            title: "Answer the replies that matter",
            description:
              "Replies collect in a single inbox. The agent keeps threads warm and hands you the ones ready for a real conversation, with the history attached. You spend your time on live buyers instead of chasing people who will never answer.",
            icon: Inbox,
            color: "from-amber-500 to-yellow-500",
            time: "Ongoing",
          },
        ]}
        totalTime="Set up in under 10 minutes"
      />

      <LandingFeatures
        badge={{ icon: Sparkles, text: "What the agent actually does" }}
        headline={{
          text: "The AI sales agent that starts",
          gradient: "from a buying signal",
        }}
        description="LinkedGrow turns your own LinkedIn account into an AI sales agent that works while you do other things. You point it at your website, and it handles the discovery and the follow up from there."
        features={[
          {
            icon: Radar,
            title: "Finds buyers by real engagement",
            description:
              "Instead of a static database, the agent watches the posts and comments in your space and surfaces the people actively engaging there. Every lead is tied back to the exact post it came from, so a reply is never a mystery, and a warm signal is something a bought list can never give you.",
            highlights: ["Engagement mining", "Lead tied to its post", "Warm, not cold"],
            badge: "Buying signals",
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: Brain,
            title: "Writes each message from what they posted",
            description:
              "The agent drafts every connection note and message from what that specific person actually wrote, not a template with a merge field. It sends from your own account, at a human pace, so the outreach reads like you sat down and wrote it. No two messages come out the same, and the signal that surfaced them is never quoted back at them.",
            highlights: ["Per-person copy", "Human pace", "Your own account"],
            badge: "Outreach",
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: ShieldCheck,
            title: "Runs safely on your real account",
            description:
              "Each account runs in its own browser on an address kept for it alone, starts at 15 actions a day and grows weekly, and works only inside the hours you set. Nothing runs at night, nothing bursts, and the agent stops the moment LinkedIn asks a question. The account you built stays yours.",
            highlights: ["Dedicated address", "Slow warm-up", "Hard stop on a challenge"],
            badge: "Account safety",
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: CalendarCheck,
            title: "Aimed at booked calls",
            description:
              "Set the goal to meetings and the agent earns the reply first, then proposes two concrete windows once someone is warm. It never asks for time before a person has answered, so the call request lands as the next natural step rather than a cold pitch.",
            highlights: ["Meeting goal", "Earns the reply first", "Two clear windows"],
            badge: "Handover",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: Inbox,
            title: "One shared pool, one inbox",
            description:
              "Run several agents and they share one lead pool and one do-not-contact list, so two of them never write to the same person. Every conversation sits in one inbox with the history that led to it, plus an email the moment a lead turns warm.",
            highlights: ["No double-touch", "Unified inbox", "Warm-lead alert"],
            badge: "Reply management",
            color: "from-blue-500 to-indigo-600",
          },
          {
            icon: BarChart3,
            title: "Scores every source and drops what fails",
            description:
              "The agent tracks which posts, topics and audiences actually produce replies and meetings, then leans into the ones that pay and quietly stops the ones that do not. Over a few weeks your cost per real conversation falls, because the agent is learning where your buyers really spend their attention.",
            highlights: ["Source scoring", "Cost per lead falls", "Self-correcting"],
            badge: "Analytics",
            color: "from-teal-500 to-cyan-600",
          },
        ]}
        ctaText="Start your 7-day trial"
        ctaHref="/sign-up"
      />

      <LandingBYOK
        badge={{ icon: CircleDollarSign, text: "What it costs" }}
        headline={{
          text: "One AI sales agent, not a five-app stack",
          gradient: "billed by the seat",
        }}
        description="The autonomous AI sales agents built for enterprise sit behind a contact-sales quote, and the point tools each add a per-seat line. LinkedGrow is $99 a month for two agents, and the AI those agents run on is included in that price rather than billed on top."
        competitor={{
          name: "A typical AI sales stack",
          price: "$1,000s / year",
          issues: [
            { text: "Autonomous agents priced on request, often thousands a year" },
            { text: "A separate data tool and sequencer on top, billed per seat" },
            { text: "AI usage metered as credits that burn whether leads convert or not" },
            { text: "Built around a bought list, not live buying signals" },
            { text: "No link from a reply back to the signal that caused it" },
          ],
        }}
        linkedgrow={{
          price: "$99/month",
          apiCost: "agent AI included",
          benefits: [
            { text: "Two agents that find buyers and run the follow up, AI included" },
            { text: "Business plan at $179 a month adds seats, routing and a shared inbox" },
            { text: "Add another agent for $49 a month when you want more volume" },
            { text: "Leads come from live LinkedIn signals, not a bought list" },
            { text: "The optional content side runs on your own key for about $2 to $4 a month" },
          ],
        }}
        savingsText="Trade a metered enterprise agent for one that works live LinkedIn signals, and watch the cost per real reply fall."
      />

      <LandingFAQ
        headline={{
          text: "AI sales agent",
          gradient: "questions",
        }}
        description="What founders ask before they put an AI sales agent on their own LinkedIn account."
        faqs={faqs}
      />

      <LandingRelatedContent
        headline="Keep reading"
        links={[
          { title: "AI SDR software", href: "/ai-sdr-software", type: "page" },
          { title: "AI sales tools", href: "/ai-sales-tools", type: "page" },
          { title: "LinkedIn AI agent", href: "/linkedin-ai-agent", type: "page" },
          { title: "B2B lead generation tools", href: "/b2b-lead-generation-tools", type: "page" },
          { title: "LinkedIn prospecting", href: "/features/linkedin-prospecting", type: "feature" },
          { title: "Buying signals", href: "/features/buying-signals", type: "feature" },
          { title: "Book a demo", href: "/book-demo", type: "page" },
          { title: "Pricing", href: "/pricing", type: "page" },
        ]}
      />

      <LandingCTA
        badge="Your agent, running this week"
        headline={{
          line1: "Put an AI sales agent",
          gradient: "on your own LinkedIn account",
        }}
        description="Give it your website, pick who it should go after, and it starts working LinkedIn the same day. You get 7 days to judge it on the leads it actually brings you."
        primaryCta={{ text: "Start your 7-day trial", href: "/sign-up" }}
        trustIndicators={[
          "7-day trial, card required",
          "Agent AI included",
          "Cancel any time before day 7",
          "179+ founders on board",
        ]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
