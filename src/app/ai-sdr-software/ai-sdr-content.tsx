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
  CalendarCheck,
  Filter,
  Globe,
  Inbox,
  MessageSquare,
  Radar,
  Repeat,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundSearch,
  Wallet,
} from "lucide-react";

export function AiSdrContent({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  return (
    <main className={V3_ROOT}>
      <Header />

      <LandingHero
        badge={{ icon: Bot, text: "AI SDR software for LinkedIn" }}
        headline={{
          line1: "The AI SDR that finds your clients",
          gradient: "and starts the conversation",
        }}
        descriptionBold="You describe who you sell to. The agent works your LinkedIn account every working day."
        description="LinkedGrow is AI SDR software for founders, consultants and agencies who sell on LinkedIn. It finds people who match your buyer, warms them up, opens the conversation at a human pace, and hands you the ones worth your time."
        valuePropBadges={[
          { icon: Radar, text: "Finds leads daily" },
          { icon: MessageSquare, text: "Writes every message" },
          { icon: CalendarCheck, text: "Books the call" },
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
        question="What is AI SDR software?"
        answer="AI SDR software replaces the manual half of sales development: it finds people who match your ideal client, starts the conversation, follows up, and hands over the ones who reply with interest. LinkedGrow runs it on LinkedIn from your own account, at a human pace, inside the hours you choose."
      />

      <LandingPainPoints
        badge={{ icon: AlarmClock, text: "Why pipelines go quiet" }}
        headline={{ text: "Prospecting is the work nobody", gradient: "gets to on a busy week" }}
        description="Every founder knows what to do on LinkedIn. Almost nobody does it for 90 days straight, and the pipeline is built by the ones who did."
        problems={[
          {
            icon: Search,
            stat: "2 hrs",
            title: "Finding people eats the morning",
            description:
              "Scrolling searches, reading profiles, guessing who is worth a message. It is the least skilled hour of your day and it is the one you spend.",
            color: "blue",
          },
          {
            icon: MessageSquare,
            stat: "Day 4",
            title: "The follow-up never happens",
            description:
              "The first message goes out. The second one, the one that actually gets the reply, is still in your head three weeks later.",
            color: "cyan",
          },
          {
            icon: Wallet,
            stat: "$4k+",
            title: "A junior SDR costs more than the pipeline",
            description:
              "Hiring for outreach means salary, tooling, ramp-up and management, before a single meeting lands in the diary.",
            color: "violet",
          },
          {
            icon: Repeat,
            stat: "0 replies",
            title: "Blast tools burn the account",
            description:
              "The same template to 500 people gets ignored, reported, and eventually restricted. Volume without relevance costs you the profile you built.",
            color: "amber",
          },
        ]}
      />

      <LandingHowItWorks
        badge="From website to first conversation"
        headline={{ text: "How the agent works", gradient: "your LinkedIn account" }}
        description="You describe the business once. The agent does the daily work, and you step in when somebody is worth talking to."
        steps={[
          {
            number: "1",
            title: "It reads your website",
            description:
              "Give a URL. The agent works out what you sell, to whom, and which words your buyers use, then proposes the profile to go after. You correct it in a sentence.",
            icon: Globe,
            color: "blue",
            time: "3 min",
          },
          {
            number: "2",
            title: "It hunts on live signals",
            description:
              "Competitors' followers, people posting about the problem you solve, new roles, fresh funding, profile visitors. Not a static list, a stream that refreshes daily.",
            icon: Radar,
            color: "cyan",
            time: "Daily",
          },
          {
            number: "3",
            title: "It warms up, then talks",
            description:
              "A like, a relevant comment, then the invitation, then a message written for that person. Human pace, your working hours, your own account.",
            icon: MessageSquare,
            color: "violet",
            time: "Ongoing",
          },
          {
            number: "4",
            title: "You get the warm ones",
            description:
              "The moment somebody shows real buying interest, the agent stops and hands you the conversation with everything it knows about them.",
            icon: Inbox,
            color: "emerald",
            time: "When it matters",
          },
        ]}
      />

      <LandingFeatures
        badge={{ icon: Sparkles, text: "What you get" }}
        headline={{ text: "An SDR that never", gradient: "skips a follow-up" }}
        description="Everything a sales development rep does on LinkedIn, minus the salary, the ramp-up and the bad weeks."
        features={[
          {
            icon: UserRoundSearch,
            title: "Lead finding on autopilot",
            description:
              "The agent builds its own list every day from competitor engagement, keyword conversations and buying events, and scores each person before it writes anything.",
            color: "blue",
          },
          {
            icon: Brain,
            title: "Messages written for one person",
            description:
              "No templates and no merge tags. Each message is written from what that person actually posts and does, and the signal that surfaced them is never quoted back at them.",
            color: "cyan",
          },
          {
            icon: ShieldCheck,
            title: "Built to keep your account safe",
            description:
              "A dedicated address per account, a warm-up that starts at 15 actions a day, strict working hours, and a hard stop when LinkedIn asks a question.",
            color: "violet",
          },
          {
            icon: CalendarCheck,
            title: "Aimed at booked calls",
            description:
              "Set the goal to meetings and the agent earns the reply first, then proposes two concrete windows. It never asks for time before somebody has answered.",
            color: "emerald",
          },
          {
            icon: Filter,
            title: "One shared pool, no double-touch",
            description:
              "Run several agents and they share one lead pool and one do-not-contact list, so two of them never write to the same person.",
            color: "amber",
          },
          {
            icon: Inbox,
            title: "Replies land in one inbox",
            description:
              "Every conversation in one place with the history that led to it, plus an email the moment a lead turns warm.",
            color: "rose",
          },
        ]}
      />

      <LandingFAQ
        headline={{ text: "Questions about", gradient: "AI SDR software" }}
        description="What founders ask before they put an agent on their own LinkedIn account."
        faqs={faqs}
      />

      <LandingCTA
        badge="Your agent, running this week"
        headline={{ line1: "Put an AI SDR", gradient: "on your own account" }}
        description="Give it your website, pick who it should go after, and it starts working LinkedIn the same day. Seven days to judge it on the leads it brings you."
        primaryCta={{ text: "Start your 7-day trial", href: "/sign-up" }}
        trustIndicators={["7-day trial", "2 agents included", "Cancel any time"]}
      />

      <LandingRelatedContent
        headline="Keep reading"
        links={[
          {
            title: "LinkedIn lead generation tools",
            href: "/linkedin-lead-generation-tools",
            type: "page",
          },
          {
            title: "B2B lead generation tools",
            href: "/b2b-lead-generation-tools",
            type: "page",
          },
          {
            title: "LinkedIn prospecting tools",
            href: "/linkedin-prospecting-tools",
            type: "page",
          },
          {
            title: "AI BDR software",
            href: "/ai-bdr",
            type: "page",
          },
          {
            title: "LinkedIn AI agent",
            href: "/linkedin-ai-agent",
            type: "page",
          },
          {
            title: "AI sales tools",
            href: "/ai-sales-tools",
            type: "page",
          },
          {
            title: "AI sales agent",
            href: "/ai-sales-agent",
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
