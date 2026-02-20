import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { PostSchedulerContent } from "./scheduler-content";

export const metadata: Metadata = {
  title: "LinkedIn Post Scheduler - Schedule and Auto-Publish Posts | LinkedGrow",
  description:
    "Schedule LinkedIn posts to publish automatically at the perfect time. Visual content calendar, optimal time suggestions, direct publishing to profiles and company pages. From $19/month.",
  keywords: [
    "linkedin post scheduler",
    "schedule linkedin posts",
    "linkedin scheduling tool",
    "auto publish linkedin posts",
    "linkedin content scheduler",
    "schedule posts on linkedin",
    "linkedin post planner",
    "linkedin auto post scheduler",
  ],
  openGraph: {
    title: "LinkedIn Post Scheduler - Schedule and Auto-Publish Posts | LinkedGrow",
    description:
      "Schedule LinkedIn posts to auto-publish at the perfect time. Visual calendar, optimal timing, profiles and company pages.",
    url: "https://linkedgrow.ai/linkedin-post-scheduler",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og-default.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow - LinkedIn Post Scheduler",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkedIn Post Scheduler | LinkedGrow",
    description:
      "Schedule and auto-publish LinkedIn posts. Visual calendar, optimal timing, company pages.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/og-default.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/linkedin-post-scheduler",
  },
};

const schedulerFAQs = [
  {
    question: "How does the LinkedIn post scheduler work?",
    answer:
      "Create or generate a post with AI, then choose a date and time to publish. LinkedGrow automatically publishes the post to your LinkedIn profile or company page at the scheduled time. The visual content calendar shows all upcoming posts so you can plan your week at a glance.",
  },
  {
    question: "Can I schedule posts to LinkedIn company pages?",
    answer:
      "Yes. LinkedGrow supports scheduling and publishing to both personal profiles and company pages you manage. Connect your LinkedIn account, select your posting target, and schedule posts to either destination from the same dashboard.",
  },
  {
    question: "What is the best time to post on LinkedIn?",
    answer:
      "Generally, Tuesday through Thursday between 8 to 10 AM in your audience's timezone gets the highest engagement. However, optimal timing varies by industry and audience. LinkedGrow provides posting time suggestions based on when your content is most likely to reach your target audience.",
  },
  {
    question: "How many posts can I schedule?",
    answer:
      "The Starter plan at $19 per month includes scheduling for up to 10 posts at a time. The Pro plan at $39 per month and Business plan at $79 per month include unlimited scheduling. The free plan does not include scheduling but you can publish posts directly.",
  },
  {
    question: "Does the scheduler include a content calendar?",
    answer:
      "Yes. The visual content calendar shows a week and month view of all your scheduled, published, and draft posts. Drag and drop to reschedule, click to edit, and see your posting consistency at a glance. Color coding distinguishes drafts, scheduled, and published posts.",
  },
  {
    question: "Can I schedule AI-generated posts?",
    answer:
      "Yes. Generate a post with AI, review and edit it, then schedule it from the same editor. You can also batch-generate multiple posts and schedule them across the week using the content calendar. No copy-pasting between tools.",
  },
  {
    question: "What happens if I am offline when a scheduled post publishes?",
    answer:
      "Posts publish automatically regardless of whether you are online. LinkedGrow uses QStash (by Upstash) for reliable exact-time delivery. Once a post is scheduled, it will publish at the specified time without any manual intervention.",
  },
  {
    question: "Can I include images with scheduled posts?",
    answer:
      "Yes. Attach images, AI-generated photos, or carousels to your post before scheduling. The media is stored in Cloudflare R2 and published alongside your text at the scheduled time. Images are served via a global CDN for fast loading.",
  },
];

export default function LinkedinPostSchedulerPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          {
            name: "LinkedIn Post Scheduler",
            url: "https://linkedgrow.ai/linkedin-post-scheduler",
          },
        ]}
      />
      <FAQJsonLd questions={schedulerFAQs} />
      <SoftwareApplicationJsonLd
        name="LinkedGrow LinkedIn Post Scheduler"
        url="https://linkedgrow.ai/linkedin-post-scheduler"
        description="Schedule LinkedIn posts to auto-publish at the perfect time. Visual content calendar, optimal time suggestions, direct publishing to profiles and company pages."
        offers={{ price: "19", priceCurrency: "USD" }}
      />
      <PostSchedulerContent />
    </>
  );
}
