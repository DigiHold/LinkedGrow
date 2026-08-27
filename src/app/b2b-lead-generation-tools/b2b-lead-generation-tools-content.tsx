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
  Unplug,
  Radar,
  Globe,
  Inbox,
  BarChart3,
  PenTool,
  Sparkles,
} from "lucide-react";

export function B2bLeadGenerationToolsContent({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  return (
    <main className={V3_ROOT}>
      <Header />

      <LandingHero
        badge={{ icon: Target, text: "B2B Lead Generation Tools" }}
        headline={{
          line1: "B2B lead generation tools",
          gradient: "built on real buying signals",
        }}
        descriptionBold="LinkedGrow is a B2B lead generation tool that runs an AI agent on your own LinkedIn account to find and message the buyers already showing interest in what you sell."
        description="Most B2B lead generation tools sell you the same thing: a database of contacts and a way to email all of them at once. That model is cheap to build and easy to ignore, which is why cold reply rates keep falling. It works the other end of the funnel. The agent reads your website, learns who you sell to, then watches LinkedIn for the people engaging with posts in your space. It writes each message from what that person actually wrote, sends it from your account at a human pace, and drops every reply into a single inbox so you answer the ones worth your time."
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
        question="What are B2B lead generation tools?"
        answer="B2B lead generation tools are software that helps a business find and reach potential buyers, from contact databases and email sequencers to signal-based tools that act on live activity. LinkedGrow is the signal-based kind for LinkedIn: an AI agent that finds buyers by their real engagement and messages them from your own account, at a human pace."
      />

      <LandingPainPoints
        badge={{ icon: AlertTriangle, text: "The cold-list problem" }}
        badgeColor="red"
        headline={{
          text: "Most B2B lead generation tools sell",
          gradient: "the same cold list.",
        }}
        descriptionBold="Buy a database, export 10,000 contacts, email all of them. That is the model behind most B2B lead generation tools, and it is the reason your prospects stopped replying."
        description="A purchased contact is a stranger who never asked to hear from you. The data is often stale, the message is the same one everyone else sends, and the volume is what gets your domain flagged. The tools that promise the biggest lists tend to produce the fewest real conversations. A better B2B lead generation tool starts from interest instead of a spreadsheet: it finds the people already active around your topic and reaches them while that interest is still fresh."
        problems={[
          {
            icon: Database,
            stat: "Cold",
            title: "A bought list is a list of strangers",
            description:
              "Contact databases sell you names and emails, not intent. The person on row 4,000 never read your work, never visited your site, and never signaled a need. You become one more cold email in a full inbox, and the reply rate shows it. Bought data ages fast too, because people change jobs constantly and a large share of any list is wrong within a year.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: Mail,
            stat: "Blast",
            title: "Volume email replaces the actual conversation",
            description:
              "Sequencer tools exist to send the same message to thousands of people with a few variable swaps. Send enough of it and email providers start marking your domain as spam, which quietly kills the campaigns you care about. More sends rarely means more meetings, and usually just brings more unsubscribes and a worse sender reputation that follows you around.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: CircleDollarSign,
            stat: "On request",
            title: "Enterprise data platforms hide the real price",
            description:
              "The largest B2B data tools like ZoomInfo, Cognism, and 6sense quote pricing on request, and the number lands in the thousands of dollars a year once seats and credits are added. For a solo founder or a small team, that is a lot to spend before a single lead replies. You pay for the size of the database whether or not it holds your buyers.",
            color: "from-amber-500 to-yellow-600",
          },
          {
            icon: Unplug,
            stat: "None",
            title: "No line from a reply back to what caused it",
            description:
              "Most tools hand you a reply with no context, so you never learn which post or topic brought that person in. Without that signal you cannot tell which sources are worth repeating, and you keep buying more data instead of doubling down on the channel that already works. That blind spot is what keeps cost per lead high.",
            color: "from-rose-500 to-red-600",
          },
        ]}
      />

      <LandingFeatures
        badge={{ icon: Sparkles, text: "Signal-based lead generation" }}
        headline={{
          text: "A B2B lead generation tool that",
          gradient: "starts from interest",
        }}
        description="LinkedGrow turns your own LinkedIn account into a B2B lead generation tool that works while you do other things. You point it at your website, and the agent handles the discovery and the follow-up from there."
        features={[
          {
            icon: Globe,
            title: "Reads your website and names your buyer",
            description:
              "Give the agent your site and it learns what you sell, who buys it, and which competitors you sit next to. From that it builds an ideal customer profile and a list of buying signals to watch for, so you are not the one guessing which prospects deserve a message. The targeting is done for you and stays editable.",
            highlights: ["Site analysis", "ICP built for you", "Competitor mapping"],
            badge: "Targeting",
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: Radar,
            title: "Mines LinkedIn engagement for warm prospects",
            description:
              "Instead of a static database, the agent watches the posts and comments in your space and surfaces the people actively engaging there. Every lead is tied back to the exact post it came from, so a reply is never a mystery. That link between a lead and its signal is what lets you repeat what works instead of guessing.",
            highlights: ["Engagement mining", "Lead tied to its post", "Fresh, not stale"],
            badge: "Buying signals",
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: MessageSquare,
            title: "Writes each message from what they posted",
            description:
              "The agent drafts every connection note and DM from what that specific person actually wrote, not a template with a merge field. It sends from your own account, on an address reserved for it, at a human pace, so the outreach reads like you sat down and wrote it yourself. No two messages come out the same.",
            highlights: ["Per-person copy", "Human pace", "Your own account"],
            badge: "Outreach",
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: Inbox,
            title: "One inbox, with a handover when it matters",
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
              "The agent tracks which posts, topics, and audiences actually produce replies and meetings, then leans into the ones that pay off and quietly stops the ones that do not. Over a few weeks your B2B lead generation gets cheaper per lead, because the tool is learning where your buyers really spend their attention.",
            highlights: ["Source scoring", "Cost per lead falls", "Self-correcting"],
            badge: "Analytics",
            color: "from-blue-500 to-indigo-600",
          },
          {
            icon: PenTool,
            title: "A content engine feeding the top of funnel",
            description:
              "Because inbound and outbound work best together, it also writes posts in your voice from a blog, a video, or a raw idea. Consistent content gives the agent more warm signals to act on, so the two halves of the tool compound instead of competing. The content side runs on your own AI key for a few dollars a month.",
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
          text: "Put a lead generation agent to work",
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
          text: "B2B lead generation that costs less than",
          gradient: "a data subscription",
        }}
        description="Enterprise data platforms price on request and run into the thousands of dollars a year. The Pro plan is $99 a month for one agent, and the agent's AI is included in that price rather than billed on top."
        competitor={{
          name: "A typical data + email stack",
          price: "$1,000s / year",
          issues: [
            { text: "Contact database priced on request, often thousands a year" },
            { text: "A separate email sequencer on top, billed per seat" },
            { text: "Credits burn down whether or not the contacts convert" },
            { text: "Cold data ages, so you re-buy much of the same list next year" },
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
        savingsText="Replace a bought database with an agent that works live signals, and watch the cost per real reply fall."
      />

      <LandingFAQ
        headline={{
          text: "B2B Lead Generation Tools",
          gradient: "FAQ",
        }}
        description="Common questions about choosing and pricing B2B lead generation tools"
        faqs={faqs}
      />

      <LandingRelatedContent
        headline="Related Resources"
        links={[
          { title: "AI SDR Software", href: "/ai-sdr-software", type: "page" },
          { title: "AI Sales Tools", href: "/ai-sales-tools", type: "page" },
          { title: "AI Sales Agent", href: "/ai-sales-agent", type: "page" },
          { title: "LinkedIn Prospecting Tools", href: "/linkedin-prospecting-tools", type: "page" },
          { title: "LinkedIn Lead Generation Tools", href: "/linkedin-lead-generation-tools", type: "page" },
          { title: "Buying Signals", href: "/features/buying-signals", type: "feature" },
          { title: "Lead Generation Use Case", href: "/use-cases/lead-generation", type: "page" },
          { title: "Cost Per Lead Calculator", href: "/free-tools/cost-per-lead-calculator", type: "tool" },
          { title: "Book a Demo", href: "/book-demo", type: "page" },
        ]}
      />

      <LandingCTA
        badge="B2B lead generation tools"
        headline={{
          line1: "Ready to trade a cold list",
          gradient: "for real LinkedIn buyers?",
        }}
        description="LinkedGrow points an AI agent at your own LinkedIn account, finds the buyers already active in your space, and messages them from what they actually posted. One tool for the whole path from signal to reply."
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
