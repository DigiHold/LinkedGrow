import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { JobAnnouncementContent } from "./job-announcement-content";

export const metadata: Metadata = {
  title: "LinkedIn New Job Announcement: 10 Templates (2026)",
  description:
    "10 LinkedIn new job announcement templates for every scenario. First day, promotion, career pivot, return from break, plus timing tips and an AI generator.",
  openGraph: {
    title: "LinkedIn New Job Announcement: 10 Templates (2026)",
    description:
      "10 LinkedIn new job announcement templates for every scenario. First day, promotion, career pivot, return from break, plus timing tips and an AI generator.",
    url: "https://linkedgrow.ai/linkedin-new-job-announcement",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp",
        width: 1200,
        height: 630,
        alt: "LinkedIn new job announcement templates",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkedIn New Job Announcement: 10 Templates (2026)",
    description:
      "10 LinkedIn new job announcement templates for every scenario. First day, promotion, career pivot, return from break, plus timing tips and an AI generator.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/linkedin-new-job-announcement",
  },
};

const jobAnnouncementFAQs = [
  {
    question: "When should you announce a new job on LinkedIn?",
    answer:
      "The best time to announce a new job on LinkedIn is after your first week, once you have settled in and your employer has made the hire public. Posting on a Tuesday, Wednesday, or Thursday morning between 8 and 10 AM in your audience's timezone gives you the widest reach. Avoid announcing before your start date unless your employer has already shared the news. LinkedGrow's scheduling feature lets you pick the exact date and time so you can write the announcement early and publish it at the optimal moment.",
  },
  {
    question: "How long should a LinkedIn new job announcement be?",
    answer:
      "A strong LinkedIn new job announcement is between 150 and 300 words. Long enough to tell a brief story and show gratitude, short enough to keep readers scrolling to the end. The first two lines matter most because LinkedIn truncates posts after roughly 210 characters on mobile. Start with a hook that makes people click to expand, then share the context, and close with a question or call to action that invites comments.",
  },
  {
    question: "Should you tag your old employer in a job announcement?",
    answer:
      "Tag your old employer only if you left on good terms and genuinely want to thank specific people. Tagging sends a notification and can drive engagement from their network. But if the departure was complicated, skip the tag and keep the focus on your new role. You can still express general gratitude without naming anyone. Never tag more than 3 to 5 people in the post itself because excessive tagging looks spammy and can reduce your reach.",
  },
  {
    question: "What if you got laid off before the new job?",
    answer:
      "Acknowledging a layoff in your new job announcement is powerful because it shows resilience and makes the story relatable. You do not need to share every detail. A simple line like 'After an unexpected transition earlier this year, I am thrilled to share that I have joined [Company]' is honest without being heavy. Posts that include a setback-to-success arc tend to get significantly more engagement than announcements that only share good news.",
  },
  {
    question: "Can you use AI to write a LinkedIn new job announcement?",
    answer:
      "Yes, and it works better than you might expect when the AI writes in your voice rather than a generic default. LinkedGrow trains a voice fingerprint from up to 5 of your past LinkedIn posts, then generates announcement drafts that match your natural writing style. You pick the scenario, add the details about your new role, and the AI handles the structure, hook, and closing call to action. The result sounds like you, not a chatbot.",
  },
  {
    question: "Does LinkedIn notify your network automatically when you update your job title?",
    answer:
      "Yes, LinkedIn sends an automatic notification to your connections when you update your current position in your profile. But that notification is a short, plain-text alert with no personality, no story, and no call to action. Writing a dedicated announcement post gives you control over the message, lets you tell the story behind the move, and generates far more engagement than the automatic update. Many professionals do both: update the profile for the record, and publish a post for the engagement.",
  },
];

export default function LinkedinNewJobAnnouncementPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          {
            name: "LinkedIn New Job Announcement Templates",
            url: "https://linkedgrow.ai/linkedin-new-job-announcement",
          },
        ]}
      />
      <FAQJsonLd questions={jobAnnouncementFAQs} />
      <SoftwareApplicationJsonLd
        name="LinkedGrow - LinkedIn New Job Announcement Generator"
        url="https://linkedgrow.ai/linkedin-new-job-announcement"
        description="Generate a LinkedIn new job announcement in your voice with LinkedGrow's AI post generator. 10 templates, voice training, and scheduling built in."
        offers={{
          price: "19",
          priceCurrency: "USD",
        }}
      />
      <JobAnnouncementContent faqs={jobAnnouncementFAQs} />
    </>
  );
}
