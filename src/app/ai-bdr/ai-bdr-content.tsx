"use client";

import { V3_ROOT } from "@/components/v3/root";
import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { QuickAnswer } from "@/components/seo/quick-answer";
import { LandingPainPoints } from "@/components/landing/landing-pain-points";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingFAQ } from "@/components/landing/landing-faq";
import { LandingCTA } from "@/components/landing/landing-cta";
import { LandingRelatedContent } from "@/components/landing/landing-related-content";
import {
  AlarmClock,
  Bot,
  Brain,
  Filter,
  Globe,
  Inbox,
  MessageSquare,
  Radar,
  Repeat,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRoundSearch,
  Wallet,
} from "lucide-react";

export function AiBdrContent({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  return (
    <main className={V3_ROOT}>
      <Header />

      <LandingHero
        badge={{ icon: Bot, text: "AI BDR for LinkedIn" }}
        headline={{
          line1: "The AI BDR that builds your",
          gradient: "pipeline on LinkedIn",
        }}
        descriptionBold="You describe who you sell to. The agent prospects your LinkedIn account every working day."
        description="LinkedGrow is an AI BDR for founders, consultants and agencies who win clients on LinkedIn. It finds the people who match your buyer, opens the conversation at a human pace, follows up, and hands you the ones worth a call."
        valuePropBadges={[
          { icon: Radar, text: "Finds buyers daily" },
          { icon: MessageSquare, text: "Writes every message" },
          { icon: TrendingUp, text: "Fills your pipeline" },
        ]}
        primaryCta={{ text: "Start your 7-day trial", href: "/sign-up" }}
        trustIndicators={["7-day trial", "Your own LinkedIn account", "Agents included in the price"]}
        video={{
          videoId: "1MVCdQZiN9I",
          thumbnailUrl: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/images/video-thumb-agents.avif",
          duration: "1:22",
          ctaText: "See pricing",
          ctaHref: "/pricing",
        }}
      />

      <QuickAnswer
        question="What is an AI BDR?"
        answer="An AI BDR is software that does a business development rep's outbound work: it finds the companies and people who fit your market, starts the conversation, follows up, and passes on anyone who shows real interest. LinkedGrow runs that on LinkedIn, from your own account, at a human pace, inside the hours you set."
      />

      <LandingPainPoints
        badge={{ icon: AlarmClock, text: "Why outbound stalls" }}
        headline={{ text: "Building pipeline is the job", gradient: "that never gets done" }}
        description="Every founder knows outbound works. Almost nobody runs it for 90 days without a break, and the pipeline goes to the ones who did."
        problems={[
          {
            icon: Search,
            stat: "2 hrs",
            title: "Finding buyers eats the morning",
            description:
              "Searching, reading profiles, guessing who is worth a message. It is the lowest skilled hour you own, and it is the one outbound needs from you every single day.",
            color: "blue",
          },
          {
            icon: Wallet,
            stat: "$5k+/mo",
            title: "A human BDR is slow and costly",
            description:
              "Salary, tooling, ramp and management, months before a first meeting lands. Most small teams cannot carry that cost while they are still working out what sells.",
            color: "violet",
          },
          {
            icon: Repeat,
            stat: "Spam",
            title: "Email bots blast and burn",
            description:
              "Most AI BDR tools work email at volume, so the strong inboxes filter the message and the domain that pays for it is yours. The replies you wanted never arrive.",
            color: "amber",
          },
          {
            icon: MessageSquare,
            stat: "Day 4",
            title: "The follow up never happens",
            description:
              "The first message goes out. The second one, the one that actually earns the reply, is still on your list 3 weeks later, under everything else the day threw at you.",
            color: "cyan",
          },
        ]}
      />

      <LandingHowItWorks
        badge="From your website to the first reply"
        headline={{ text: "How the AI BDR works", gradient: "your LinkedIn account" }}
        description="You set it up once in a few minutes. After that it does the daily outbound, and you step in only when a lead is worth your time."
        steps={[
          {
            number: "1",
            title: "It reads your website",
            description:
              "Give it a URL. It works out what you sell, who buys it and the words they use, then proposes the accounts and people to go after. You fix anything it got wrong in a sentence.",
            icon: Globe,
            color: "blue",
            time: "3 min",
          },
          {
            number: "2",
            title: "It hunts on live signals",
            description:
              "People posting about the problem you solve, a competitor's followers, a new role, fresh funding, someone who just viewed your profile. A stream that refreshes every day, not a list that goes stale.",
            icon: Radar,
            color: "cyan",
            time: "Daily",
          },
          {
            number: "3",
            title: "It warms up, then messages",
            description:
              "A like, a genuine comment, then the invitation, then a message written from what that person actually posts. Human pace, your working hours, your own account.",
            icon: MessageSquare,
            color: "violet",
            time: "Ongoing",
          },
          {
            number: "4",
            title: "You get the warm leads",
            description:
              "The moment somebody shows real buying interest, the agent stops and hands you the conversation with everything it learned about them along the way.",
            icon: Inbox,
            color: "emerald",
            time: "When it matters",
          },
        ]}
      />

      <LandingFeatures
        badge={{ icon: Sparkles, text: "What you get" }}
        headline={{ text: "A BDR that prospects", gradient: "every working day" }}
        description="The outbound half of business development, run on LinkedIn by LinkedGrow, without the salary or the ramp of a new hire."
        features={[
          {
            icon: UserRoundSearch,
            title: "It builds its own target list",
            description:
              "The agent finds fresh accounts and people every day from competitor engagement, keyword conversations and buying events, and scores each one before it writes a single word.",
            color: "blue",
          },
          {
            icon: Brain,
            title: "Messages written for one person",
            description:
              "It writes with no templates and no merge tags. Each message comes from what that person posts and does, and the signal that surfaced them is never quoted back at them.",
            color: "cyan",
          },
          {
            icon: ShieldCheck,
            title: "Built to keep your account safe",
            description:
              "A dedicated address for each account, a warm up that starts at 15 actions a day, strict working hours, and a hard stop the moment LinkedIn asks a question.",
            color: "violet",
          },
          {
            icon: TrendingUp,
            title: "Aimed at pipeline, not vanity",
            description:
              "It works toward replies and booked calls, not connection counts. Set the goal to meetings and it earns the answer first, then proposes 2 real windows.",
            color: "emerald",
          },
          {
            icon: Filter,
            title: "One pool, no double touch",
            description:
              "Run several agents and they share one lead pool and one do not contact list, so two of them never write to the same person on the same week.",
            color: "amber",
          },
          {
            icon: Inbox,
            title: "Every reply in one inbox",
            description:
              "One place for every conversation with the history that led to it, plus an email the moment a lead turns warm and is worth a human reply.",
            color: "rose",
          },
        ]}
      />

      <LandingFAQ
        headline={{ text: "Questions about", gradient: "AI BDR software" }}
        description="What founders ask before they let an agent prospect from their own LinkedIn account."
        faqs={faqs}
      />

      <LandingCTA
        badge="Your BDR, running this week"
        headline={{ line1: "Put an AI BDR", gradient: "on your LinkedIn" }}
        description="Give it your website, choose who it should chase, and it starts prospecting LinkedIn the same day. You get 7 days to judge it on the leads it puts in front of you."
        primaryCta={{ text: "Start your 7-day trial", href: "/sign-up" }}
        trustIndicators={["7-day trial", "2 agents included", "Cancel any time"]}
      />

      <LandingRelatedContent
        headline="Keep reading"
        links={[
          {
            title: "AI SDR software",
            href: "/ai-sdr-software",
            type: "page",
          },
          {
            title: "AI sales agent",
            href: "/ai-sales-agent",
            type: "page",
          },
          {
            title: "LinkedIn AI agent",
            href: "/linkedin-ai-agent",
            type: "page",
          },
          {
            title: "LinkedIn prospecting tools",
            href: "/linkedin-prospecting-tools",
            type: "page",
          },
          {
            title: "B2B lead generation tools",
            href: "/b2b-lead-generation-tools",
            type: "page",
          },
          {
            title: "AI sales tools",
            href: "/ai-sales-tools",
            type: "page",
          },
          {
            title: "LinkedGrow v2",
            href: "/blog/linkedgrow-v2",
            type: "blog",
          },
          {
            title: "Book a LinkedGrow demo",
            href: "/book-demo",
            type: "page",
          },
          {
            title: "Pricing",
            href: "/pricing",
            type: "page",
          },
        ]}
      />

      <Footer />
    </main>
  );
}
