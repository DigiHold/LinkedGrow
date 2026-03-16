import { BreadcrumbJsonLd, FAQJsonLd } from "@/components/seo/json-ld";
import { ClaudeCourseClient } from "./claude-course-client";

const courseFAQs = [
  {
    question: "Is this course really free?",
    answer:
      "Yes, 100% free. No credit card required, no hidden fees. You will receive 10 emails over 10 days, each one a complete tutorial on a specific Claude feature.",
  },
  {
    question: "Do I need a paid Claude account?",
    answer:
      "No. Most features in this course work on Claude's free plan. A few advanced features like memory import and unlimited Projects require Claude Pro ($20/month), but we always provide free alternatives.",
  },
  {
    question: "I have never used Claude before. Is this for me?",
    answer:
      "Absolutely. Day 1 starts from scratch - setting up your account and transferring your ChatGPT data. By Day 10, you will know more about Claude than 99% of users. No technical skills required.",
  },
  {
    question: "I am already using Claude. Will I still learn something?",
    answer:
      "Yes. Most Claude users only scratch the surface. This course covers Projects, Artifacts, Extended Thinking, Claude Code, Cowork, MCP integrations, and advanced prompting techniques that even experienced users rarely explore.",
  },
  {
    question: "What is the difference between ChatGPT and Claude?",
    answer:
      "Claude excels at natural writing, complex reasoning, coding, and document analysis. It has unique features like Artifacts (build interactive tools without code), Projects (persistent workspaces), Extended Thinking (deep reasoning mode), and Claude Code (build full websites and apps). This course teaches you all of them.",
  },
  {
    question: "Can I really build a website or app with no coding experience?",
    answer:
      "Yes. Day 8 and Day 9 cover exactly this. Claude Code and Cowork let you describe what you want in plain English and build fully functional websites and applications. Non-developers are building apps live on the App Store using only Claude.",
  },
  {
    question: "Will I lose my ChatGPT data if I switch?",
    answer:
      "No. Day 1 shows you how to transfer your entire ChatGPT memory - your preferences, projects, writing style - to Claude in under 60 seconds using Claude's built-in import feature. You do not start from zero.",
  },
  {
    question: "How long are the emails?",
    answer:
      "Each email is a complete tutorial - expect 8-15 minutes of reading with step-by-step instructions, real examples, and a hands-on task you can do right away. No fluff, no filler.",
  },
  {
    question: "Can I unsubscribe anytime?",
    answer:
      "Absolutely. Every email includes an unsubscribe link. But we think you will want to stay - each day builds on the previous one and teaches a genuinely useful skill.",
  },
  {
    question: "What is LinkedGrow?",
    answer:
      "LinkedGrow is an AI-powered LinkedIn content platform that uses your own AI API key (Claude, GPT, Gemini) for unlimited content generation. This course teaches you to master Claude - LinkedGrow is a tool that lets you put those skills to work for LinkedIn growth.",
  },
];

export default function SwitchToClaudePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          {
            name: "Switch to Claude - Free 10-Day Course",
            url: "https://linkedgrow.ai/switch-to-claude",
          },
        ]}
      />
      <FAQJsonLd questions={courseFAQs} />
      <ClaudeCourseClient faqs={courseFAQs} />
    </>
  );
}
