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
import { ToolShortlist } from "@/components/compare/tool-shortlist";
import {
  Target,
  AlertTriangle,
  CircleDollarSign,
  Users,
  MessageSquare,
  Database,
  ShieldAlert,
  Unplug,
  Radar,
  Globe,
  Inbox,
  BarChart3,
  PenTool,
  Sparkles,
} from "lucide-react";

export function LinkedinProspectingToolsContent({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  return (
    <main className={V3_ROOT}>
      <Header />

      <LandingHero
        badge={{ icon: Target, text: "LinkedIn Prospecting Tools" }}
        headline={{
          line1: "LinkedIn prospecting tools",
          gradient: "that start from real interest",
        }}
        descriptionBold="LinkedGrow is a LinkedIn prospecting tool that runs an AI agent on your own account to find and message the buyers already active around what you sell."
        description="Most LinkedIn prospecting tools do one of two things: they hand you a database to export, or they fire connection requests through a browser bot until your account gets flagged. Both start from a list instead of a person. LinkedGrow works the other way. The agent reads your website, learns who you sell to, then watches LinkedIn for the people engaging with posts in your space. It writes each message from what that person actually posted, sends it from your own account at a human pace, and drops every reply into one inbox so you answer the ones worth your time."
        valuePropBadges={[
          { icon: Users, text: "Finds buyers on LinkedIn" },
          { icon: MessageSquare, text: "Messages from real signals" },
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
        question="What are LinkedIn prospecting tools?"
        answer="LinkedIn prospecting tools help you find and reach potential buyers on LinkedIn. They fall into three groups by where the leads come from: data tools and Sales Navigator that sell filtered contacts, automation bots that fire connection requests through a browser, and signal-based agents that act on live engagement. LinkedGrow is the last kind, an AI agent that finds buyers by their real activity and messages them from your own account at a human pace."
      />

      <LandingPainPoints
        badge={{ icon: AlertTriangle, text: "The list-first problem" }}
        badgeColor="red"
        headline={{
          text: "Most LinkedIn prospecting tools start from",
          gradient: "a list, not a buyer.",
        }}
        descriptionBold="Buy a database or point a bot at a search, then reach everyone on it. That is the model behind most LinkedIn prospecting tools, and it is why your connection requests get ignored."
        description="A name pulled from a filter never signaled a need. The message is the same one everyone else sends, and the volume is what puts your account at risk. The tools that promise the longest lists tend to produce the fewest real conversations. A prospecting tool that starts from interest reaches people while that interest is still fresh, which is the difference between a reply and a silent decline."
        problems={[
          {
            icon: Database,
            stat: "Cold",
            title: "A filtered list is still a list of strangers",
            description:
              "Data tools and Sales Navigator filters give you names and titles, not intent. The person on row 4,000 never read your work and never signaled a need, so your note lands as one more cold pitch. Contact data ages fast too, because people change roles constantly and a large share of any export is wrong within a year.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: ShieldAlert,
            stat: "Risky",
            title: "Connection bots put your account on the line",
            description:
              "Browser extensions and cloud bots fire invitations and messages at machine speed to reach a daily number. LinkedIn reads that rhythm, and the result runs from a warning to a temporary restriction to a lost account. You are risking the network you spent years building to save a few minutes a day.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: CircleDollarSign,
            stat: "Per seat",
            title: "The bill grows with every seat and every credit",
            description:
              "Most prospecting automation is priced per user, so the cost multiplies by headcount before anyone replies. Data platforms add credits that burn down whether or not the contacts convert, and enterprise tools quote on request into the thousands a year. You pay for the size of the list, not for the meetings it books.",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: Unplug,
            stat: "None",
            title: "No line from a reply back to what caused it",
            description:
              "Most tools hand you a reply with no context, so you never learn which post or topic brought that person in. Without that signal you cannot tell which sources are worth repeating, and you keep buying more data instead of leaning into the channel that already works. That blind spot keeps your cost per lead high.",
            color: "from-rose-500 to-red-600",
          },
        ]}
      />

      <LandingFeatures
        badge={{ icon: Sparkles, text: "Leads from buying signals" }}
        headline={{
          text: "A LinkedIn prospecting tool that",
          gradient: "starts from interest",
        }}
        description="LinkedGrow turns your own LinkedIn account into a prospecting tool that runs while you work. You point it at your website, and the agent handles the discovery and the follow-up from there."
        features={[
          {
            icon: Globe,
            title: "Reads your website and names your buyer",
            description:
              "Give the agent your site and it learns what you sell, who buys it, and which competitors you sit beside. From that it builds an ideal customer profile and a list of buying signals to watch, so you are not the one guessing which prospects deserve a message. The targeting is done for you and stays yours to edit.",
            highlights: ["Site analysis", "ICP built for you", "Competitor mapping"],
            badge: "Targeting",
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: Radar,
            title: "Mines LinkedIn engagement for warm prospects",
            description:
              "Instead of a static export, the agent watches the posts and comments in your space and surfaces the people actively engaging there. Every lead is tied back to the exact post it came from, so a reply is never a mystery. That link between a lead and its signal is what lets you repeat what works instead of guessing.",
            highlights: ["Engagement mining", "Lead tied to its post", "Fresh, not stale"],
            badge: "Buying signals",
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: MessageSquare,
            title: "Writes each message from what they posted",
            description:
              "The agent drafts every connection note and DM from what that specific person actually wrote, not a template with a merge field. It sends from your own account, on an address reserved for it, at a human pace, so the outreach reads like you sat down and wrote it yourself. No two messages come out the same.",
            highlights: ["Written per person", "Human pace", "Your own account"],
            badge: "Outreach",
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: Inbox,
            title: "One inbox, with a handover when it counts",
            description:
              "Every reply lands in a single inbox. The agent keeps each conversation moving on its own, and the moment someone is worth your attention, it hands you the thread with the context already attached. You spend your time on live buyers rather than on chasing people who will never answer.",
            highlights: ["Unified inbox", "Automatic follow-up", "Human handover"],
            badge: "Reply management",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: BarChart3,
            title: "Scores every source and drops what fails",
            description:
              "The agent tracks which posts, topics, and audiences actually produce replies and meetings, then leans into the ones that pay off and quietly stops the ones that do not. Over a few weeks your prospecting gets cheaper per lead, because the tool is learning where your buyers really spend their attention.",
            highlights: ["Source scoring", "Cost per lead falls", "Self-correcting"],
            badge: "Analytics",
            color: "from-blue-500 to-indigo-600",
          },
          {
            icon: PenTool,
            title: "Content that feeds the top of the funnel",
            description:
              "Because inbound and outbound work best together, it also writes posts in your voice from a blog, a video, or a raw idea. Steady content gives the agent more warm signals to act on, so the two halves of the tool compound instead of competing. The content side runs on your own AI key for a few dollars a month.",
            highlights: ["Posts in your voice", "Repurposing", "Feeds the agent"],
            badge: "Content",
            color: "from-teal-500 to-cyan-600",
          },
        ]}
        ctaText="Start your 7-day trial"
        ctaHref="/sign-up"
      />

      <ToolShortlist
        heading="The best LinkedIn prospecting tools, and who each one is for"
        intro="There is no single best LinkedIn prospecting tool, only a best fit for the shape of your work. Prices were checked on 29 July 2026 and move often, so confirm on each vendor's own page before you decide."
      />

      <LandingHowItWorks
        headline={{
          text: "Put a prospecting agent to work",
          gradient: "in 4 steps",
        }}
        description="The agent handles the full path from setup to warm reply. You approve the direction, and it does the daily work."
        steps={[
          {
            number: "01",
            title: "Point the agent at your website",
            description:
              "Paste in your website URL, and the agent reads what you sell, drafts your ideal customer profile, and proposes the buying signals to track. You review and adjust it in a few minutes, and the targeting is done without a spreadsheet or a list to import.",
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
              "Each day the agent surfaces people engaging around your topic, writes a message from what they posted, and sends it at a human pace. Every lead arrives linked to the post that surfaced it, so you can see exactly why each person is a fit the moment they land in your list.",
            icon: Radar,
            color: "from-emerald-500 to-green-500",
            time: "Daily, hands-off",
          },
          {
            number: "04",
            title: "Answer the replies that matter",
            description:
              "Replies collect in a single inbox. The agent keeps threads warm and hands you the ones ready for a real conversation, with the history attached. You step in only when there is a genuine buyer on the other end, which is the only step that needs you.",
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
          text: "LinkedIn prospecting that costs less than",
          gradient: "a data and outreach stack",
        }}
        description="A data source plus a per seat outreach tool adds up fast, and neither one writes the message for you. The Pro plan is $99 a month for one agent, and the agent's AI is included in that price rather than billed on top."
        competitor={{
          name: "Sales Navigator plus a sequencer",
          price: "$150+ / seat a month",
          issues: [
            { text: "Sales Navigator runs $89.99 to $159.99 a seat and sends nothing itself" },
            { text: "A separate outreach tool on top, billed per seat" },
            { text: "Automation bots add account risk for volume you may not need" },
            { text: "Credits and mailboxes billed as extras every cycle" },
            { text: "No link from a reply back to the signal that caused it" },
          ],
        }}
        linkedgrow={{
          price: "$99/month",
          apiCost: "agent AI included",
          benefits: [
            { text: "One agent that finds buyers and runs the follow-up, AI included" },
            { text: "Business plan at $179 a month adds seats, routing, and a shared inbox" },
            { text: "Add another agent for $49 a month when you want more volume" },
            { text: "Leads come from live LinkedIn signals, not a bought list" },
            { text: "The optional content side runs on your own key for about $2 to $4 a month" },
          ],
        }}
        savingsText="Replace a data subscription and a per seat bot with one agent that works live signals, and watch the cost per real reply fall."
      />

      <LandingFAQ
        headline={{
          text: "LinkedIn Prospecting Tools",
          gradient: "FAQ",
        }}
        description="Common questions about choosing, pricing, and safely using LinkedIn prospecting tools"
        faqs={faqs}
      />

      <LandingRelatedContent
        headline="Related Resources"
        links={[
          { title: "LinkedIn Prospecting", href: "/features/linkedin-prospecting", type: "feature" },
          { title: "AI SDR Software", href: "/ai-sdr-software", type: "page" },
          { title: "LinkedIn Lead Generation Tools", href: "/linkedin-lead-generation-tools", type: "page" },
          { title: "Buying Signals", href: "/features/buying-signals", type: "feature" },
          { title: "Lead Generation Use Case", href: "/use-cases/lead-generation", type: "page" },
          { title: "Cold Message Template", href: "/free-tools/linkedin-cold-message-template", type: "tool" },
          { title: "Book a Demo", href: "/book-demo", type: "page" },
        ]}
      />

      <LandingCTA
        badge="LinkedIn prospecting tools"
        headline={{
          line1: "Ready to trade a cold list",
          gradient: "for real LinkedIn buyers?",
        }}
        description="LinkedGrow points an AI agent at your own LinkedIn account, finds the buyers already active in your space, and messages them from what they actually posted. One prospecting tool for the whole path from signal to reply."
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
