import type { Metadata } from "next";
import { FAQJsonLd, BreadcrumbJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";
import { ProfileViewsContent } from "./profile-views-content";

export const metadata: Metadata = {
  title: "How to See Who Viewed Your LinkedIn Profile (Free & Premium)",
  description:
    "See who viewed your LinkedIn profile without Premium. Understand view mechanics, privacy settings, and how to turn profile visitors into connections and leads.",
  openGraph: {
    title: "How to See Who Viewed Your LinkedIn Profile (Free & Premium)",
    description:
      "See who viewed your LinkedIn profile without Premium. Understand view mechanics, privacy settings, and how to turn profile visitors into connections and leads.",
    url: "https://linkedgrow.ai/linkedin-profile-views-guide",
    siteName: "LinkedGrow",
    type: "website",
    images: [
      {
        url: "https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp",
        width: 1200,
        height: 630,
        alt: "LinkedGrow - LinkedIn Profile Views Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to See Who Viewed Your LinkedIn Profile (Free & Premium)",
    description:
      "See who viewed your LinkedIn profile without Premium. Understand view mechanics, privacy settings, and how to turn profile visitors into connections and leads.",
    images: ["https://pub-86332bae77404495924b3ef7d4cbe7db.r2.dev/linkedgrow.webp"],
  },
  alternates: {
    canonical: "https://linkedgrow.ai/linkedin-profile-views-guide",
  },
};

const profileViewsFAQs = [
  {
    question: "Can I see who viewed my LinkedIn profile without Premium?",
    answer:
      "Yes, but with limitations. Free LinkedIn accounts can see the last 5 people who viewed your profile within the past 90 days. You will see their name, headline, and how they found you. However, you cannot see the full list of viewers, filter by date or industry, or view trend data. Premium members get access to all viewers for the past 365 days with detailed filtering. LinkedGrow helps you maximize your profile views through consistent content creation, so more of the right people visit your profile in the first place.",
  },
  {
    question: "Does LinkedIn notify someone when I view their profile?",
    answer:
      "It depends on your browsing mode. LinkedIn has three privacy settings for profile viewing. In public mode, the person sees your full name, headline, and photo. In semi-private mode, they see only your job title and company without your name. In private mode, they see only that an anonymous LinkedIn member visited. You can change your browsing mode in Settings, then Visibility, then Profile viewing options. Keep in mind that switching to private mode on a free account means you lose access to your own viewer list.",
  },
  {
    question: "Why did my LinkedIn profile views suddenly drop?",
    answer:
      "Profile view drops usually happen for one of three reasons. First, you stopped posting content. LinkedIn shows your profile to people who engage with your posts, so when you stop posting, fewer people discover you. Second, the algorithm changed. LinkedIn periodically adjusts how it distributes content and surfaces profiles. Third, you changed your profile and removed keywords that were driving search visibility. The fix for all three is the same: post consistently with relevant keywords in your content and keep your profile optimized with terms your target audience searches for.",
  },
  {
    question: "Can Premium users see who viewed their profile in private mode?",
    answer:
      "No. Private mode is private for everyone. When someone browses LinkedIn in private mode, their identity is hidden from all users regardless of whether the profile owner has Premium or not. The only thing Premium viewers see is that an anonymous LinkedIn member visited. This is why private mode is called private. The trade-off for free users is that enabling private mode also removes your ability to see who viewed your profile.",
  },
  {
    question: "How do I increase my LinkedIn profile views?",
    answer:
      "The most effective way to increase profile views is to post content consistently. People who see your posts in their feed and find them valuable will click through to your profile. Beyond posting, optimize your headline with keywords your target audience searches for, add a professional profile photo, and engage with other people's content through thoughtful comments. Each comment you leave shows your name and headline to that person's entire audience. LinkedGrow helps by generating content in your voice and scheduling it at optimal times so you stay visible without spending hours writing every day.",
  },
  {
    question: "What does the 'Who viewed your profile' section actually show?",
    answer:
      "LinkedIn's profile views section shows you a list of people who visited your profile, along with their name, headline, profile photo, and how they found you. It also shows your total view count and a general breakdown of viewer demographics like job titles and companies. Free accounts see the last 5 viewers from the past 90 days. Premium accounts see all viewers from the past 365 days and can filter by date range, company, industry, and location. Both tiers show viewer trend data so you can see if your visibility is going up or down over time.",
  },
  {
    question: "Should I view someone's profile before sending a connection request?",
    answer:
      "Yes, this is actually a smart networking tactic. When you view someone's profile, they get a notification. Many people will check out your profile in return. If your profile is well-optimized and your headline clearly communicates who you help, this creates a warm touchpoint before you ever send a message. Some LinkedIn users call this the 'profile view warmup' strategy. Visit a prospect's profile a few days before sending a connection request so your name feels familiar when they see the invite.",
  },
  {
    question: "How does LinkedGrow help me get more LinkedIn profile views?",
    answer:
      "LinkedGrow helps you get more profile views by making consistent content creation effortless. The AI post generator creates posts in your authentic voice using voice training. The scheduler publishes at optimal times when your audience is most active. The hook generator creates opening lines that stop people from scrolling. And the content calendar keeps your posting frequency on track week after week. More consistent, high-quality content means more people see your name in their feed and click through to your profile.",
  },
];

export default function LinkedinProfileViewsGuidePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://linkedgrow.ai" },
          {
            name: "LinkedIn Profile Views Guide",
            url: "https://linkedgrow.ai/linkedin-profile-views-guide",
          },
        ]}
      />
      <FAQJsonLd questions={profileViewsFAQs} />
      <SoftwareApplicationJsonLd
        name="LinkedGrow - LinkedIn Profile Views & Content Growth"
        url="https://linkedgrow.ai/linkedin-profile-views-guide"
        description="Get more LinkedIn profile views with AI-powered content creation, voice training, and optimal scheduling. Turn profile visitors into connections and leads. From $13/month."
        offers={{ price: "19", priceCurrency: "USD" }}
      />
      <ProfileViewsContent />
    </>
  );
}
