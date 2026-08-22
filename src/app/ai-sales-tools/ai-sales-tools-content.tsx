"use client";

import { V3_ROOT } from "@/components/v3/root";
import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { QuickAnswer } from "@/components/seo/quick-answer";
import { LandingPainPoints } from "@/components/landing/landing-pain-points";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { LandingBYOK } from "@/components/landing/landing-byok";
import { LandingFAQ } from "@/components/landing/landing-faq";
import { LandingCTA } from "@/components/landing/landing-cta";
import { MarketingExitIntentPopup } from "@/components/marketing/exit-intent-popup";
import { LandingRelatedContent } from "@/components/landing/landing-related-content";
import {
  Target,
  AlertTriangle,
  CircleDollarSign,
  Users,
  MessageSquare,
  Database,
  Mail,
  Layers,
  Unplug,
  Radar,
  Globe,
  Inbox,
  BarChart3,
  PenTool,
  Sparkles,
} from "lucide-react";

export function AiSalesToolsContent({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  return (
    <main className={V3_ROOT}>
      <Header />

      <LandingHero
        badge={{ icon: Target, text: "AI Sales Tools" }}
        headline={{
          line1: "AI sales tools that reach",
          gradient: "warm buyers first",
        }}
        descriptionBold="LinkedGrow is an AI sales tool for founders, consultants, and lean sales teams. It runs an agent on your own LinkedIn account to find the buyers already showing interest in what you sell, then messages them before a cold email ever would."
        description="The AI sales tools market is crowded with databases, sequencers, and dashboards, and most of them still start from a cold list. LinkedGrow works the warm end instead. It reads your website, learns who you sell to, then watches LinkedIn for the people engaging around your topic. It writes each message from what that person actually posted, sends it from your own account at a human pace, and collects every reply in one inbox so you answer the ones worth your time."
        valuePropBadges={[
          { icon: Users, text: "Finds buyers on LinkedIn" },
          { icon: MessageSquare, text: "Writes from real signals" },
          { icon: CircleDollarSign, text: "From $99/month" },
        ]}
        primaryCta={{ text: "Start your 7-day trial", href: "/sign-up" }}
        trustIndicators={[
          "7-day trial, card required",
          "Agent runs on your own account",
          "179+ founders on board",
        ]}
        video={{
          videoId: "1MVCdQZiN9I",
          thumbnailUrl:
            "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/video-thumb-agents.avif",
          duration: "1:22",
          ctaText: "See Pricing",
          ctaHref: "/pricing",
        }}
      />

      <QuickAnswer
        question="What are AI sales tools?"
        answer="AI sales tools are software that uses AI to help you sell, from contact databases and outreach sequencers to conversation intelligence, smart CRMs, and signal-based agents. LinkedGrow is the signal-based kind for LinkedIn: an AI sales tool that finds buyers by their real engagement and messages them from your own account, at a human pace."
      />

      <LandingPainPoints
        badge={{ icon: AlertTriangle, text: "The AI sales stack problem" }}
        badgeColor="red"
        headline={{
          text: "Most AI sales tools bolt onto",
          gradient: "the same cold list.",
        }}
        descriptionBold="Buy a database, load it into a sequencer, point a dashboard at the results. That is the shape of most AI sales stacks, and it is why buyers stopped replying to the outreach."
        description="AI made it faster to send more of the same message, not better at earning a reply. The data is still cold, the copy still reads like a template, and the volume is still what gets a domain flagged. A better AI sales tool starts from interest instead of a spreadsheet: it finds the people already active around your topic and reaches them while that interest is fresh, which is the one thing a bought list cannot do."
        problems={[
          {
            icon: Database,
            stat: "Cold",
            title: "AI on top of a cold list is still cold",
            description:
              "Most AI sales tools begin with bought contact data, which is names and emails rather than intent. The AI writes a slicker opener, but the person on row 4,000 never read your work or visited your site. You are still a cold email in a full inbox, and bought data ages fast as people change jobs and titles.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: Mail,
            stat: "Blast",
            title: "More volume, not more meetings",
            description:
              "Sequencers now use AI to spin thousands of variants of the same message. Send enough of it and email providers flag your domain, which quietly kills the campaigns you actually care about. Faster sending rarely produces more meetings. It usually just brings more unsubscribes and a sender reputation that follows you around.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: Layers,
            stat: "5+ tools",
            title: "The stack keeps growing and so does the bill",
            description:
              "A typical AI sales stack is a data tool, a sequencer, a CRM, a conversation intelligence app, and a forecasting dashboard, each billed per seat. The tools rarely talk to each other, so you spend more time wiring them together than selling. The cost climbs long before the pipeline does.",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: Unplug,
            stat: "None",
            title: "No line from a reply back to what caused it",
            description:
              "Most tools hand you a reply with no context, so you never learn which post or topic brought that person in. Without that signal you cannot tell which sources are worth repeating, and you keep buying more data instead of doubling down on the channel that already works.",
            color: "from-rose-500 to-red-600",
          },
        ]}
      />

      <LandingFeatures
        badge={{ icon: Sparkles, text: "A signal-based AI sales tool" }}
        headline={{
          text: "The AI sales tool that starts",
          gradient: "from a buying signal",
        }}
        description="LinkedGrow turns your own LinkedIn account into an AI sales tool that works while you are doing other things. You point it at your website, and the agent handles the discovery and the follow-up from there."
        features={[
          {
            icon: Globe,
            title: "Reads your website and names your buyer",
            description:
              "Give the agent your site and it works out what you sell, who buys it, and which competitors you sit beside. From that it drafts an ideal customer profile and the buying signals to watch, so you are not guessing which prospects deserve a message. The targeting is done for you and stays yours to edit.",
            highlights: ["Site analysis", "ICP built for you", "Competitor mapping"],
            badge: "Targeting",
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: Radar,
            title: "Mines LinkedIn engagement for warm prospects",
            description:
              "Instead of a static database, the agent watches the posts and comments in your space and surfaces the people actively engaging there. Every lead is tied back to the exact post it came from, so a reply is never a mystery. That link between a lead and its signal is what a cold list can never give you.",
            highlights: ["Engagement mining", "Lead tied to its post", "Warm, not cold"],
            badge: "Buying signals",
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: MessageSquare,
            title: "Writes each message from what they posted",
            description:
              "The agent drafts every connection note and DM from what that specific person actually wrote, not a template with a merge field. It sends from your own account, on an address kept for it alone, at a human pace, so the outreach reads like you sat down and wrote it. No two messages come out the same.",
            highlights: ["Per-person copy", "Human pace", "Your own account"],
            badge: "Outreach",
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: Inbox,
            title: "One inbox, with a handover when it counts",
            description:
              "Every reply lands in a single inbox. The agent keeps each thread moving on its own, and the moment someone is worth your attention, it hands you the conversation with the context already attached. You spend your time on live buyers instead of chasing people who will never answer.",
            highlights: ["Unified inbox", "Automatic follow-up", "Human handover"],
            badge: "Reply management",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: BarChart3,
            title: "Scores every source and drops what fails",
            description:
              "The agent tracks which posts, topics, and audiences actually produce replies and meetings, then leans into the ones that pay and quietly stops the ones that do not. Over a few weeks your cost per real conversation falls, because the tool is learning where your buyers really spend their attention.",
            highlights: ["Source scoring", "Cost per lead falls", "Self-correcting"],
            badge: "Analytics",
            color: "from-blue-500 to-indigo-600",
          },
          {
            icon: PenTool,
            title: "A content engine feeding the top of funnel",
            description:
              "Because inbound and outbound work better together, the tool also writes posts in your voice from a blog, a video, or a raw idea. Steady content gives the agent more warm signals to act on, so the two halves compound instead of competing. The content side runs on your own AI key for a few dollars a month.",
            highlights: ["Voice-trained posts", "Repurposing", "Feeds the agent"],
            badge: "Content",
            color: "from-teal-500 to-cyan-600",
          },
        ]}
        ctaText="Start your 7-day trial"
        ctaHref="/sign-up"
      />

      <LandingHowItWorks
        headline={{
          text: "Put an AI sales agent to work",
          gradient: "in 4 steps",
        }}
        description="The agent handles the whole path from setup to a warm reply. You approve the direction, and it does the daily work."
        steps={[
          {
            number: "01",
            title: "Point the agent at your website",
            description:
              "Paste your website URL, and the agent reads what you sell, drafts your ideal customer profile, and proposes the buying signals to track. You review and adjust it in a few minutes, and the targeting is done without a spreadsheet or a list to import.",
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
              "Each day the agent surfaces people engaging around your topic, writes a message from what they posted, and sends it at a human pace. Every lead arrives linked to the post that surfaced it, so you can see why each person is a fit the moment they land in your list.",
            icon: Radar,
            color: "from-emerald-500 to-green-500",
            time: "Daily, hands-off",
          },
          {
            number: "04",
            title: "Answer the replies that matter",
            description:
              "Replies collect in a single inbox. The agent keeps threads warm and hands you the ones ready for a real conversation, with the history attached. You step in only when there is a genuine buyer on the other end, which is the only part that needs you.",
            icon: Inbox,
            color: "from-amber-500 to-yellow-500",
            time: "Ongoing",
          },
        ]}
        totalTime="Set up in under 10 minutes"
      />

      <LandingBYOK
        badge={{ icon: CircleDollarSign, text: "What it costs" }}
        headline={{
          text: "One AI sales tool that costs less than",
          gradient: "a five-app stack",
        }}
        description="A full AI sales stack adds up fast: a data platform, a sequencer, a CRM, and a forecasting app, each billed per seat. The Pro plan is $99 a month for two agents, and the agents' AI is included in that price rather than billed on top."
        competitor={{
          name: "A typical AI sales stack",
          price: "$1,000s / year",
          issues: [
            { text: "Contact database priced on request, often thousands a year" },
            { text: "A separate outreach sequencer on top, billed per seat" },
            { text: "Conversation intelligence and forecasting apps each add a line" },
            { text: "Credits burn down whether or not the contacts convert" },
            { text: "No link from a reply back to the signal that caused it" },
          ],
        }}
        linkedgrow={{
          price: "$99/month",
          apiCost: "agent AI included",
          benefits: [
            { text: "Two agents that find buyers and run the follow-up, AI included" },
            { text: "Business plan at $179 a month adds seats, routing, and a shared inbox" },
            { text: "Add another agent for $49 a month when you want more volume" },
            { text: "Leads come from live LinkedIn signals, not a bought list" },
            { text: "The optional content side runs on your own key for about $2 to $4 a month" },
          ],
        }}
        savingsText="Replace a five-app stack with one agent that works live signals, and watch the cost per real reply fall."
      />

      <LandingFAQ
        headline={{
          text: "AI Sales Tools",
          gradient: "FAQ",
        }}
        description="Common questions about choosing and pricing AI sales tools"
        faqs={faqs}
      />

      <LandingRelatedContent
        headline="Related Resources"
        links={[
          { title: "AI SDR Software", href: "/ai-sdr-software", type: "page" },
          { title: "B2B Lead Generation Tools", href: "/b2b-lead-generation-tools", type: "page" },
          { title: "LinkedIn Lead Generation Tools", href: "/linkedin-lead-generation-tools", type: "page" },
          { title: "Buying Signals", href: "/features/buying-signals", type: "feature" },
          { title: "LinkedIn Prospecting", href: "/features/linkedin-prospecting", type: "feature" },
          { title: "Book a Demo", href: "/book-demo", type: "page" },
        ]}
      />

      <LandingCTA
        badge="AI sales tools"
        headline={{
          line1: "Ready to trade a five-app stack",
          gradient: "for one AI sales agent?",
        }}
        description="LinkedGrow points an agent at your own LinkedIn account, finds the buyers already active in your space, and messages them from what they actually posted. One AI sales tool for the whole path from signal to reply."
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
