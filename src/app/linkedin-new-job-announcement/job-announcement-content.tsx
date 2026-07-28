"use client";

import Link from "next/link";
import { V3_ROOT } from "@/components/v3/root";
import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingPainPoints } from "@/components/landing/landing-pain-points";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { LandingBYOK } from "@/components/landing/landing-byok";
import { LandingFAQ } from "@/components/landing/landing-faq";
import { LandingCTA } from "@/components/landing/landing-cta";
import { MarketingExitIntentPopup } from "@/components/marketing/exit-intent-popup";
import { LandingRelatedContent } from "@/components/landing/landing-related-content";
import type { FAQItem } from "@/components/landing/landing-faq";
import {
  Sparkles,
  AlertTriangle,
  Briefcase,
  Heart,
  MessageSquare,
  Repeat2,
  Rocket,
  ArrowUpRight,
  Users,
  PenTool,
  Clock,
  Mic,
  Target,
  RefreshCw,
  Building2,
  GraduationCap,
  Laptop,
  MapPin,
  UserPlus,
} from "lucide-react";

interface JobAnnouncementContentProps {
  faqs: FAQItem[];
}

export function JobAnnouncementContent({ faqs }: JobAnnouncementContentProps) {
  return (
    <main className={V3_ROOT}>
      <Header />

      <LandingHero
        badge={{ icon: Briefcase, text: "Job Announcement Templates 2026" }}
        headline={{
          line1: "LinkedIn New Job Announcement",
          gradient: "Templates That Get Engagement",
        }}
        descriptionBold="A LinkedIn new job announcement is the highest-engagement post most professionals will ever publish."
        description="Job announcements consistently outperform regular LinkedIn posts because your entire network wants to congratulate you. But most people waste that moment with a bland 'I'm excited to announce' opener that sounds like everyone else's. The templates below cover 10 different scenarios, from your first day to a career pivot to a comeback after a layoff, so your announcement actually tells a story worth reading. LinkedGrow's AI post generator can also write one from scratch in your voice, trained on your own writing style, ready to schedule at the optimal time."
        valuePropBadges={[
          { icon: PenTool, text: "10 copy-paste templates" },
          { icon: Mic, text: "AI voice matching" },
          { icon: Clock, text: "Schedule at peak time" },
        ]}
        primaryCta={{ text: "Generate your announcement", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={["7-day Pro trial included", "Cancel before day 8", "Cancel anytime"]}
      />

      <LandingPainPoints
        badge={{ icon: AlertTriangle, text: "Why Most Announcements Fall Flat" }}
        badgeColor="red"
        headline={{
          text: "Your network wants to celebrate with you.",
          gradient: "Don't waste the moment.",
        }}
        descriptionBold="Job announcements are rare. Most people change roles every 2 to 4 years, so each announcement is a once-in-years chance to reach your entire network."
        description="LinkedIn's algorithm gives job announcements a massive reach boost because congratulatory comments pile up fast. That early engagement signals to the algorithm that this post deserves wider distribution. But the boost only kicks in if people actually stop scrolling and engage. A generic 'thrilled to share' opener with no story, no hook, and no personality blends into the hundreds of other announcements your connections see every month. You get polite likes instead of genuine comments, and the algorithm moves on."
        problems={[
          {
            icon: Repeat2,
            stat: "Generic",
            title: "The 'thrilled to announce' opener kills engagement",
            description:
              "When every job announcement starts with the same three words, nobody reads past the first line. LinkedIn truncates posts after roughly 210 characters on mobile. If your hook is identical to everyone else's, people tap like out of politeness and keep scrolling. No comment, no conversation, no algorithmic boost. The most engaging announcements open with a story, a question, or an unexpected statement that makes people click 'see more' before they even know what the announcement is about.",
            color: "from-red-500 to-rose-600",
          },
          {
            icon: Heart,
            stat: "No story",
            title: "Skipping the 'why' behind the move",
            description:
              "A job title and company name are facts, not a story. Your network cares about the journey: why you left, what you learned, what pulled you toward this new role, who helped along the way. Announcements that include even a brief narrative about the transition get significantly more comments because people relate to the human experience, not the job title. The most shared announcements on LinkedIn are the ones that make someone think 'that reminds me of my own career' and compel them to write a personal response.",
            color: "from-orange-500 to-amber-600",
          },
          {
            icon: Clock,
            stat: "Bad timing",
            title: "Publishing at the wrong moment kills reach",
            description:
              "Posting your announcement on a Friday afternoon or a weekend means most of your network never sees it. LinkedIn's algorithm tests your post with a small group first, and if engagement is low in that first 60 minutes, it stops distributing further. Tuesday through Thursday mornings are when LinkedIn professionals are most active. Your announcement deserves the biggest possible audience, and timing is half the battle.",
            color: "from-red-500 to-orange-600",
          },
          {
            icon: MessageSquare,
            stat: "Dead end",
            title: "No call to action means no conversation",
            description:
              "Most job announcements end with a period and nothing else. There is no question, no invitation to connect, no reason for the reader to do anything except tap the thumbs-up button. A simple closing question like 'What is the best career advice you have ever received?' or 'I would love to connect with others in [industry] - drop a comment if you are working in this space' turns passive readers into active commenters. Comments drive reach. Reach drives new connections. That is the whole point of posting the announcement publicly.",
            color: "from-rose-500 to-red-600",
          },
        ]}
        bottomQuote="I changed my job title three months ago and never posted about it. I missed the biggest free engagement window of the year..."
      />

      <LandingFeatures
        badge={{ icon: Sparkles, text: "How to Write a Great LinkedIn New Job Announcement" }}
        headline={{
          text: "Five elements every strong",
          gradient: "job announcement includes",
        }}
        description="Whether you write it yourself or use LinkedGrow's AI generator, these five components turn a forgettable update into a post your network actually wants to engage with. Each element serves a specific purpose in the LinkedIn algorithm and in human psychology."
        features={[
          {
            icon: Target,
            title: "Open with a hook, not 'I'm excited to announce'",
            description:
              "Your first line determines whether anyone reads the rest. Start with the story behind the move, a question for your audience, or a surprising statement that creates curiosity. 'Two years ago I almost quit tech entirely' is a hook. 'Thrilled to share that I have joined Company X' is not. The hook does not need to be dramatic. It just needs to be different from the default template that LinkedIn auto-generates when you update your profile. LinkedGrow's hook generator creates dozens of opening lines you can test before picking the strongest one.",
            highlights: ["Story-driven opener", "Question hook", "Curiosity gap"],
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: Briefcase,
            title: "Share the role and why it matters to you",
            description:
              "After the hook, tell your network what the new role is, which company you are joining, and why this particular opportunity excites you. Be specific. 'I will be leading the product marketing team at [Company] focused on their enterprise expansion' tells people exactly what you do. A vague 'excited for this new chapter' tells them nothing. Specificity also helps LinkedIn's algorithm categorize your post and show it to the right people in your extended network.",
            highlights: ["Company + title", "Your focus area", "Why it excites you"],
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: Heart,
            title: "Express genuine gratitude",
            description:
              "Thank the people who helped you get here: a former manager who wrote a recommendation, a colleague who referred you, a mentor who gave career advice at the right moment. Tag 2 to 3 people maximum so they get notified and are likely to comment. Gratitude posts consistently outperform purely self-promotional ones because they feel authentic. If you are leaving a company, acknowledge what you learned there. Burning bridges in a public LinkedIn post never pays off, even if you are tempted.",
            highlights: ["Tag 2-3 people", "Acknowledge former team", "Keep it genuine"],
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: Rocket,
            title: "Look forward, not just backward",
            description:
              "Your announcement should make your network curious about what comes next. Mention a goal, a project, or something specific you are looking forward to in the new role. 'I cannot wait to dive into [specific area] and bring [your expertise] to the team' gives people a reason to follow your journey. This forward-looking element also sets up future content: you can reference this announcement months later when you share a win or lesson from the new role.",
            highlights: ["A specific goal", "What you bring", "Sets up future posts"],
            color: "from-amber-500 to-orange-600",
          },
          {
            icon: MessageSquare,
            title: "Close with a question or invitation",
            description:
              "End your announcement with something that invites a response. 'What is the best piece of career advice you have ever gotten?' or 'Would love to connect with others in [industry] - say hi in the comments' or 'Drop your favorite first-week tip below.' Questions generate comments. Comments signal to LinkedIn that this post is worth distributing to a wider audience. The difference between 20 likes and 200 can be a single well-placed question at the end of your post.",
            highlights: ["Open-ended question", "Industry connection invite", "Comment driver"],
            color: "from-pink-500 to-rose-600",
          },
        ]}
        ctaText="Generate your announcement with AI"
        ctaHref="/sign-up"
      />

      <LandingHowItWorks
        badge="10 Templates by Scenario"
        headline={{
          text: "Copy, customize, and post.",
          gradient: "Pick the scenario that fits your move.",
        }}
        description="Each template follows the five-element structure above. Replace the bracketed placeholders with your details, adjust the tone to match your voice, and publish. Or paste your scenario into LinkedGrow's AI generator and let it write a personalized version trained on your writing style."
        steps={[
          {
            number: "1",
            title: "First Day at a New Company",
            description:
              "Today was day one at [Company], and I already know this was the right call.\n\nAfter [X years/months] at [Previous Company], I was ready for a new challenge. What drew me to [Company] was [specific reason - the team, the mission, the product, the market]. I will be [your role/focus area], and the first project on my plate is [something specific if you can share it].\n\nHuge thank you to [Name] for the introduction, and to [Name] at [Previous Company] for being the kind of manager who genuinely roots for their people's next chapter.\n\nIf you are in [industry/function], I would love to connect. What is one thing you wish someone had told you during your first week at a new job?",
            icon: Briefcase,
            color: "from-cyan-500 to-blue-600",
          },
          {
            number: "2",
            title: "Promotion Within Your Company",
            description:
              "Three years ago I joined [Company] as a [previous title]. Today I am stepping into the role of [new title].\n\nThis was not a straight line. I learned [specific skill or lesson] the hard way, got mentored by people who pushed me when I wanted to coast, and shipped [a specific project or result] that proved what this team can do.\n\nThank you to [Name] and [Name] for betting on me before I fully bet on myself.\n\nIn this new role I will be focused on [specific area]. If you have been through a similar transition, what surprised you most about moving from [old role type] to [new role type]?",
            icon: ArrowUpRight,
            color: "from-emerald-500 to-green-600",
          },
          {
            number: "3",
            title: "Career Pivot to a New Industry",
            description:
              "I spent [X years] in [old industry]. Starting today, I am in [new industry].\n\nThe pivot was not impulsive. Over the past [timeframe], I realized that what I love most about my work, [specific skill like storytelling, problem-solving, building teams], translates directly to [new industry]. The skills are the same. The context is different. And that is exactly what makes it exciting.\n\nI am joining [Company] as [title] to [what you will be doing]. If you have ever made a career pivot, I would love to hear what the first 90 days felt like for you.",
            icon: RefreshCw,
            color: "from-violet-500 to-purple-600",
          },
          {
            number: "4",
            title: "Comeback After a Layoff",
            description:
              "Six months ago I was part of a layoff at [Previous Company]. Today I am starting as [title] at [New Company].\n\nI will not pretend the transition was easy. But it forced me to get clear about what I actually wanted from my career instead of just following the next logical step. I spoke with [X] people during the search, said no to [a few things that were not the right fit], and held out for a role where [specific reason this opportunity is right].\n\nThank you to everyone who reached out during the search. You know who you are.\n\nIf you are going through a transition right now, feel free to reach out. I am happy to share what worked for me.",
            icon: Rocket,
            color: "from-amber-500 to-orange-600",
          },
          {
            number: "5",
            title: "Return from a Career Break",
            description:
              "After [X months/years] away from the workforce, I am back. And it feels good.\n\nI stepped away to [brief reason - parenting, health, travel, education, personal project]. During that time I also [something you did that kept you sharp or taught you something relevant]. Returning to work after a break is its own kind of career pivot, and I learned that the gap on my resume tells a story, not a weakness.\n\nI am joining [Company] as [title]. If you have come back from a career break yourself, I would love to hear how you framed it during your search.",
            icon: UserPlus,
            color: "from-pink-500 to-rose-600",
          },
          {
            number: "6",
            title: "Founding or Joining a Startup",
            description:
              "I left my [title] role at [Previous Company] to [co-found / join] [Startup Name].\n\nFor the past [timeframe] I had been working on [the problem or idea] on evenings and weekends. The tipping point came when [a specific moment, metric, or realization]. We are building [one-sentence description of what the startup does] and our first [milestone - customers, users, product launch] is [timeframe].\n\nThis is the scariest and most exciting thing I have done in my career. If you are building something too, say hi. I want to know more founders in [space].",
            icon: Building2,
            color: "from-red-500 to-rose-600",
          },
          {
            number: "7",
            title: "First Job After Graduation",
            description:
              "Four years of [degree] at [University]. Hundreds of applications. And today it all became worth it.\n\nI am officially starting as [title] at [Company]. This is the role I was chasing since [a specific moment - an internship, a class, a project, a conversation with someone in the industry].\n\nThank you to [professor, mentor, career counselor] for the guidance, and to my [family/friends] for dealing with me during the job search.\n\nTo everyone still searching: it takes longer than you think, and it happens faster than you expect. Keep going.\n\nWhat is one thing you wish you knew before starting your first job?",
            icon: GraduationCap,
            color: "from-blue-500 to-indigo-600",
          },
          {
            number: "8",
            title: "Freelance to Full-Time Transition",
            description:
              "After [X years] of freelancing, I am going full-time again.\n\nI loved the autonomy of running my own [consulting practice / agency / freelance business]. I built [specific achievement - client roster, revenue, projects]. But what I missed was being part of a team working toward a shared goal where the problems are bigger than what one person can solve alone.\n\n[Company] offered exactly that. I am joining as [title] to [specific focus]. If you have ever gone from freelance back to full-time, I am curious: what surprised you most about the shift?",
            icon: Laptop,
            color: "from-teal-500 to-cyan-600",
          },
          {
            number: "9",
            title: "Relocation for a New Role",
            description:
              "Two weeks ago I was in [old city]. Today I am writing this from [new city], starting a new role as [title] at [Company].\n\nRelocating for a job is a decision that affects everything: your partner, your routine, your commute, your entire social circle. We made the call because [specific reason - the role, the city, the opportunity, a life change]. And after [X days/weeks] here, I can already tell it was the right one.\n\nIf you are based in [new city] or have gone through a job relocation, I would love to connect. Drop a restaurant recommendation in the comments. I need them.",
            icon: MapPin,
            color: "from-green-500 to-emerald-600",
          },
          {
            number: "10",
            title: "Lateral Move to a New Team or Function",
            description:
              "Same company, completely different job.\n\nAfter [X years] on the [previous team/function] at [Company], I am moving to [new team/function]. The skills that got me here, [specific skills], still apply. But the problems are different, the pace is different, and the learning curve is exactly what I was looking for.\n\nLateral moves do not get announced as often as new jobs, but they can be just as transformative. If you have made an internal move that changed your career trajectory, I would love to hear about it.",
            icon: Users,
            color: "from-orange-500 to-red-600",
          },
        ]}
      />

      {/* Algorithm Tips Section */}
      <LandingFeatures
        badge={{ icon: Target, text: "Maximize Your Announcement Reach" }}
        headline={{
          text: "LinkedIn algorithm tips",
          gradient: "specific to job announcements",
        }}
        description="Job announcements already get an engagement boost from LinkedIn's algorithm. These tactics push that boost even further so your announcement reaches second and third-degree connections, not just your immediate network."
        features={[
          {
            icon: Clock,
            title: "Post Tuesday through Thursday, 8-10 AM in your audience's timezone",
            description:
              "The first 60 minutes after you publish determine how far LinkedIn distributes your post. Publishing when your network is most active gives you the fastest initial engagement, which triggers wider distribution. If your network is spread across timezones, optimize for where the majority of your connections are. LinkedGrow's scheduling lets you write the announcement whenever you are ready and publish it at the exact right moment.",
            highlights: ["60-minute golden window", "Weekday mornings", "Schedule in advance"],
            color: "from-cyan-500 to-blue-600",
          },
          {
            icon: MessageSquare,
            title: "Reply to every comment within the first 2 hours",
            description:
              "Each reply you write counts as additional engagement on your post. If 30 people comment and you reply to all 30, that is 60 total interactions, which signals to the algorithm that this post is generating real conversation. Keep your replies genuine and personal. A quick 'thank you!' is fine, but a reply that references something specific about the commenter gets even more engagement because it invites a second response.",
            highlights: ["Every comment gets a reply", "Personal responses", "Double the interaction count"],
            color: "from-emerald-500 to-green-600",
          },
          {
            icon: Users,
            title: "Tag 2 to 3 people, never more than 5",
            description:
              "Tagging sends a notification and pulls the tagged person's network into your post's potential reach. But over-tagging looks desperate and can actually reduce your distribution. Tag the people who are genuinely part of your story: a mentor, a referral, a former manager. They are the most likely to leave a meaningful comment, which is far more valuable than a notification that gets ignored.",
            highlights: ["Notify their network", "Quality over quantity", "They will comment back"],
            color: "from-violet-500 to-purple-600",
          },
          {
            icon: PenTool,
            title: "Add a photo that is not the company logo",
            description:
              "Posts with images get more engagement than text-only posts on LinkedIn. For a job announcement, a photo of you on your first day, at the new office, or with your team performs better than a generic company logo or stock photo. If you do not have a photo yet, use a personal image that relates to the story you are telling. LinkedGrow's AI image generator can also create a custom visual if you want something polished without a photo shoot.",
            highlights: ["Real photo > logo", "First-day selfie works", "Personal over corporate"],
            color: "from-amber-500 to-orange-600",
          },
        ]}
        ctaText="Try LinkedGrow free for 7 days"
        ctaHref="/sign-up"
      />

      {/* Common Mistakes Section */}
      <section className="relative z-10 py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Mistakes to avoid in your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
                LinkedIn new job announcement
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              These are the patterns that turn a high-engagement opportunity into a forgettable post.
            </p>
          </div>
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                Badmouthing your previous employer
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Even if you left because the culture was toxic, the management was terrible, or you were
                treated unfairly, your LinkedIn announcement is not the place to air it. Hiring managers,
                future colleagues, and potential clients all read these posts. A negative comment about a
                former employer tells your network more about your judgment than about the company. Keep the
                focus on where you are going, not what you are leaving behind. If you cannot say something
                genuine about your previous role, simply skip the gratitude section and focus on the new
                opportunity.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                Posting before your employer is ready
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Some companies want to make the hire announcement internally before it goes public on
                LinkedIn. Others have a communications team that coordinates external announcements. Always
                check with your new employer before publishing your post. A premature announcement can create
                an awkward first impression with your new team. The safest window is after your first day or
                first week, once the company has confirmed the role publicly. LinkedGrow lets you write and
                schedule the announcement in advance so it goes live at exactly the right moment.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                Writing a wall of text with no formatting
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                LinkedIn is a mobile-first platform. A single dense paragraph of 300 words is unreadable
                on a phone screen. Break your announcement into short paragraphs of 1 to 3 sentences each.
                Use line breaks between sections. Your{" "}
                <Link
                  href="/blog/linkedin-post-formatting-guide"
                  className="text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  LinkedIn post formatting
                </Link>{" "}
                directly affects whether people read to the end or bounce after the first few lines. The
                templates above are already structured with proper spacing so you can paste them directly.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                Tagging 15 people for visibility
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Mass-tagging might seem like a reach hack, but it backfires. LinkedIn can shadow-limit posts
                that tag too many people, especially if those people do not engage. Your tagged connections
                also receive a notification that feels spammy rather than personal. Stick to 2 to 3 tags for
                the people who genuinely helped. Everyone else can be thanked in the comments or in a private
                message.
              </p>
            </div>
          </div>
        </div>
      </section>

      <LandingBYOK
        badge={{ icon: Sparkles, text: "Smart Economics" }}
        headline={{
          text: "AI-written job announcements should not cost",
          gradient: "$49 per month",
        }}
        description="Most LinkedIn AI tools charge a flat monthly fee and give you a handful of generations. LinkedGrow lets you bring your own AI key so you pay provider rates directly. Write and rewrite your announcement as many times as you need until it sounds exactly right."
        competitor={{
          name: "Typical LinkedIn AI Tools",
          price: "$49-99/month",
          issues: [
            { text: "Limited to 30-50 AI generations per month" },
            { text: "One hidden AI model with no voice training" },
            { text: "Generic output that sounds like every other user" },
            { text: "No scheduling or optimal time suggestions" },
            { text: "Extra charge for image generation" },
          ],
        }}
        linkedgrow={{
          price: "$99/month",
          apiCost: "$2-4/month",
          benefits: [
            { text: "Unlimited AI generations with your own key" },
            { text: "26 models from 6 providers, pick per draft" },
            { text: "Voice training from your past LinkedIn posts" },
            { text: "Built-in scheduling at optimal posting times" },
            { text: "AI image generation included on Pro" },
          ],
        }}
        savingsText="Write unlimited announcements and posts for under $25 per month"
      />

      <LandingFAQ
        headline={{
          text: "LinkedIn New Job Announcement",
          gradient: "FAQ",
        }}
        description="Common questions about writing and publishing a LinkedIn new job announcement"
        faqs={faqs}
      />

      <LandingRelatedContent
        headline="Related Resources"
        links={[
          { title: "LinkedIn Profile Optimization", href: "/blog/linkedin-profile-optimization" },
          { title: "LinkedIn Hook Examples and Formulas", href: "/blog/linkedin-hook-examples-formulas" },
          { title: "LinkedIn Post Formatting", href: "/blog/linkedin-post-formatting-guide" },
          { title: "LinkedIn Personal Branding", href: "/blog/linkedin-personal-branding-guide" },
          { title: "Personal Branding on LinkedIn", href: "/use-cases/personal-branding" },
          { title: "LinkedGrow for Solopreneurs", href: "/for/solopreneurs" },
        ]}
      />

      <LandingCTA
        badge="Write Your Announcement Today"
        headline={{
          line1: "Ready to announce your new role",
          gradient: "the right way?",
        }}
        description="Generate a LinkedIn new job announcement in your voice with LinkedGrow. Pick a template, customize it with AI, and schedule it at the perfect time."
        primaryCta={{ text: "Get started free", href: "/sign-up" }}
        secondaryCta={{ text: "See pricing", href: "/pricing" }}
        trustIndicators={[
          "7-day Pro trial included",
          "Cancel before day 8",
          "43 AI models",
          "Cancel anytime",
        ]}
      />

      <Footer />
      <MarketingExitIntentPopup />
    </main>
  );
}
