#!/usr/bin/env node
/* eslint-disable */
// Batch-applies AEO patterns to /use-cases, /for, /industries, /features pages:
//   1. New CTR title in page.tsx + metadata description
//   2. QuickAnswer import + block after LandingHero
//   3. (Headline rewrites are done in a separate later pass per-page since each
//       page has 5+ headlines that need bespoke question-form copy.)
//
// Run from repo root: node scripts/aeo-marketing-batch.js

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src", "app");

function escapeReplacement(str) {
  return str.replace(/\$/g, "$$$$");
}

const CONFIGS = [
  // ─── USE CASES ─────────────────────────────────────────────────────
  {
    dir: "use-cases/lead-generation",
    title:
      "LinkedIn Lead Generation in 2026: How to Generate Leads Through Content (Step-by-Step)",
    metaDesc:
      "How to generate leads on LinkedIn through content posting in 2026. Build a content-to-pipeline machine that attracts qualified inbound leads without cold DMs, spam, or paid ads.",
    qaQuestion:
      "How do you generate leads on LinkedIn through content in 2026?",
    qaAnswer:
      "Generating leads on LinkedIn in 2026 means posting valuable insights that attract prospects to you, not chasing them with cold DMs. Use voice-trained AI to publish 3-5 strategic posts per week, add specific CTAs (lead magnets, calls, demos), and track which content drives inbound replies. LinkedIn drives 80% of all B2B social leads.",
  },
  {
    dir: "use-cases/personal-branding",
    title:
      "LinkedIn Personal Branding in 2026: How to Build a Brand That Wins Inbound (Step-by-Step)",
    metaDesc:
      "How to build a personal brand on LinkedIn in 2026. Voice training, consistent posting, and content strategy that turns your profile into an inbound machine for clients and opportunities.",
    qaQuestion:
      "How do you build a personal brand on LinkedIn in 2026?",
    qaAnswer:
      "Building a personal brand on LinkedIn in 2026 starts with consistent posting in your authentic voice, optimizing your headline and About section for your ideal audience, and publishing content that reinforces a single positioning theme. Use voice-trained AI to publish 3-5 posts per week, share lessons not pitches, and engage daily to compound network effects.",
  },
  {
    dir: "use-cases/social-selling",
    title:
      "LinkedIn Social Selling in 2026: How to Get Clients Through Content (Step-by-Step)",
    metaDesc:
      "How to use LinkedIn for social selling in 2026. Get clients through valuable content posting instead of cold DMs. Build trust at scale and turn your profile into a sales channel.",
    qaQuestion:
      "How do you use LinkedIn for social selling in 2026?",
    qaAnswer:
      "Social selling on LinkedIn in 2026 means using content and conversations to build trust before pitching. Optimize your profile for your ideal customer, publish authority posts 3-5 times per week, comment thoughtfully on prospect content, and DM only after you've shown up in their feed for weeks. Avoid spam pitches; lead with value.",
  },
  {
    dir: "use-cases/automation",
    title:
      "LinkedIn Automation in 2026: Safe & Compliant Tools (What Actually Works)",
    metaDesc:
      "Best LinkedIn automation tools that are safe and compliant in 2026. What you can automate (content, scheduling, analytics) and what risks your account (DMs, connection spam, scraping).",
    qaQuestion:
      "Which LinkedIn automation tools are safe and compliant in 2026?",
    qaAnswer:
      "Safe LinkedIn automation in 2026 means automating content creation, scheduling, and analytics — never DMs, connection spam, or scraping. Tools using LinkedIn's official OAuth API (like LinkedGrow) are compliant. Browser automation tools that mimic clicks risk account restrictions or bans. Stick to API-based tools with official LinkedIn approval.",
  },
  {
    dir: "use-cases/content-repurposing",
    title:
      "Content Repurposing for LinkedIn in 2026: How to Turn Existing Content Into Posts",
    metaDesc:
      "How to repurpose existing content for LinkedIn posts in 2026. Turn blog articles, YouTube videos, podcasts, and webinars into authority posts using AI-powered repurposing tools.",
    qaQuestion:
      "How do you repurpose content for LinkedIn in 2026?",
    qaAnswer:
      "Repurposing content for LinkedIn in 2026 means feeding existing assets — blog articles, YouTube videos, podcasts, webinar recordings — into an AI tool that extracts key insights and reformats them into native LinkedIn posts. The best workflow: drop a URL or transcript, let AI pull 3-5 angles, edit for voice, schedule. One source can produce a month of content.",
  },
  {
    dir: "use-cases/thought-leadership",
    title:
      "LinkedIn Thought Leadership in 2026: How to Build Authority Through Content",
    metaDesc:
      "How to become a thought leader on LinkedIn in 2026. Build industry authority through consistent insight-driven content. Voice training, content strategy, and engagement that compounds.",
    qaQuestion:
      "How do you build thought leadership on LinkedIn in 2026?",
    qaAnswer:
      "Building LinkedIn thought leadership in 2026 means consistently sharing original insights, frameworks, and contrarian takes in your niche. Pick one positioning theme, publish 3-5 long-form posts per week with strong opinions, engage in comment threads of bigger creators in your space, and let your voice — not formatting tricks — be the differentiator.",
  },

  // ─── FOR (audiences) ──────────────────────────────────────────────
  {
    dir: "for/enterprises",
    title:
      "LinkedIn Content Platform for Enterprises in 2026: Activate Executive Thought Leadership",
    metaDesc:
      "Best LinkedIn content management platform for enterprise teams in 2026. Activate executive thought leadership at scale, brand governance, voice training, and compliance built in.",
    qaQuestion:
      "What is the best LinkedIn content platform for enterprises in 2026?",
    qaAnswer:
      "The best LinkedIn content platform for enterprises in 2026 supports executive voice training, brand governance, multi-user collaboration, and unlimited team scaling. LinkedGrow's Business plan offers 26 AI models, BYOK pricing (no per-seat fees), team workflows, brand-safe guardrails, and direct LinkedIn OAuth — built for activating leadership content at scale.",
  },
  {
    dir: "for/agencies",
    title:
      "LinkedIn Management Tool for Agencies in 2026: Manage Multiple Clients (Without Per-Seat Pricing)",
    metaDesc:
      "Best LinkedIn management tool for marketing agencies in 2026. Manage multiple client accounts, voice cloning per client, white-label dashboards, and flat-rate pricing that scales.",
    qaQuestion:
      "What is the best LinkedIn tool for marketing agencies in 2026?",
    qaAnswer:
      "The best LinkedIn tool for agencies in 2026 supports multiple client accounts with separate voice profiles, brand guardrails per client, and team collaboration without per-seat pricing. LinkedGrow's Business plan ($79/mo flat) handles unlimited clients with 26 AI models, BYOK pricing, and direct LinkedIn OAuth — far cheaper than $25-30 per client per month tools.",
  },
  {
    dir: "for/ghostwriters",
    title:
      "LinkedIn Ghostwriting Tool in 2026: Manage Multiple Client Voices (BYOK Pricing)",
    metaDesc:
      "Best LinkedIn ghostwriting tool to manage multiple client voices in 2026. Voice training per client, AI-assisted writing, scheduling, and BYOK pricing that scales with your roster.",
    qaQuestion:
      "What is the best LinkedIn ghostwriting tool in 2026?",
    qaAnswer:
      "The best LinkedIn ghostwriting tool in 2026 trains a separate AI voice profile per client so each client's posts sound authentically theirs. LinkedGrow offers per-client voice training, hooks generation, scheduling, and BYOK pricing starting at $13/mo — letting ghostwriters serve multiple clients without juggling separate logins or paying per seat.",
  },
  {
    dir: "for/creators",
    title:
      "LinkedIn Tools for Content Creators in 2026: Grow Fast With Voice-Trained AI",
    metaDesc:
      "Best LinkedIn tools for content creators in 2026. Voice training, hooks generation, scheduling, analytics, and BYOK pricing for full-time LinkedIn creators who want to grow fast.",
    qaQuestion:
      "What are the best LinkedIn tools for content creators in 2026?",
    qaAnswer:
      "The best LinkedIn tools for content creators in 2026 combine voice-trained AI generation, hook crafting, scheduling, and analytics. LinkedGrow offers all four at $13/mo (billed yearly) with 26 AI models from 6 providers via BYOK — saving creators 60-90% versus bundled tools like Taplio at $52/mo or Kleo at $99/mo.",
  },
  {
    dir: "for/coaches",
    title:
      "LinkedIn Tool for Coaches & Consultants in 2026: Get Clients Through Content",
    metaDesc:
      "Best LinkedIn tool for coaches and consultants in 2026. Voice training, content scheduling, lead-generation playbooks, and BYOK pricing — designed to get clients through inbound content.",
    qaQuestion:
      "What is the best LinkedIn tool for coaches and consultants in 2026?",
    qaAnswer:
      "The best LinkedIn tool for coaches and consultants in 2026 combines voice-trained AI content with lead-generation features. LinkedGrow offers voice training, hooks generation, scheduling, and analytics at $13/mo (BYOK pricing) — letting coaches publish 3-5 authority posts per week and turn LinkedIn into a steady client pipeline without paying $52+/mo for bundled platforms.",
  },
  {
    dir: "for/solopreneurs",
    title:
      "LinkedIn Tool for Solopreneurs in 2026: Build Personal Brand on a Budget",
    metaDesc:
      "Best LinkedIn content tool for solopreneurs on a budget in 2026. Voice training, scheduling, AI generation with BYOK pricing — $13/mo plus $2-4 in AI costs vs $52+ bundled tools.",
    qaQuestion:
      "What is the best LinkedIn tool for solopreneurs in 2026?",
    qaAnswer:
      "The best LinkedIn tool for solopreneurs in 2026 is one with BYOK pricing so you only pay for what you use. LinkedGrow starts at $13/mo (billed yearly) plus $2-4/mo in AI costs (your own keys), with 26 AI models, voice training, scheduling, and analytics — saving solopreneurs $400+/year versus bundled tools like Taplio.",
  },
  {
    dir: "for/teams",
    title:
      "LinkedIn Tool for Teams in 2026: Collaborate on Content Without Per-Seat Pricing",
    metaDesc:
      "Best LinkedIn content tool for teams to collaborate on content in 2026. Multi-user workflows, voice training per member, brand guardrails, and flat-rate pricing without per-seat fees.",
    qaQuestion:
      "What is the best LinkedIn tool for teams in 2026?",
    qaAnswer:
      "The best LinkedIn tool for teams in 2026 supports multi-user collaboration without per-seat pricing. LinkedGrow's Business plan ($79/mo flat) handles unlimited team members with separate voice profiles per person, role-based permissions, brand guardrails, and approval workflows — far cheaper than $10-30 per user per month tools as your team grows.",
  },
  {
    dir: "for/small-businesses",
    title:
      "LinkedIn Marketing Tool for Small Business in 2026: Win on a Lean Budget",
    metaDesc:
      "Best LinkedIn marketing tool for small business owners in 2026. Voice training, scheduling, analytics, and BYOK pricing — built for small businesses that need LinkedIn results without enterprise costs.",
    qaQuestion:
      "What is the best LinkedIn tool for small businesses in 2026?",
    qaAnswer:
      "The best LinkedIn marketing tool for small businesses in 2026 combines AI content generation, scheduling, and analytics at a price small budgets handle. LinkedGrow starts at $13/mo (billed yearly) with BYOK pricing — total monthly cost under $20 — letting small business owners publish consistently without spending hundreds on enterprise tools or per-seat platforms.",
  },

  // ─── INDUSTRIES ───────────────────────────────────────────────────
  {
    dir: "industries/saas",
    title:
      "LinkedIn for SaaS in 2026: Content Strategy That Drives Pipeline (Step-by-Step)",
    metaDesc:
      "Best LinkedIn marketing strategy for SaaS companies in 2026. Founder-led content, employee advocacy, product-led posts, and the pipeline-driving content engine that B2B SaaS needs.",
    qaQuestion:
      "What is the best LinkedIn strategy for SaaS companies in 2026?",
    qaAnswer:
      "The best LinkedIn strategy for SaaS companies in 2026 combines founder-led content, employee advocacy, and product-storytelling posts. Founders publish 3-5 weekly authority posts about the problem and journey, employees amplify via personal profiles (561% more reach than company pages), and product updates get framed as customer wins, not feature dumps.",
  },
  {
    dir: "industries/consulting",
    title:
      "LinkedIn for Consultants in 2026: How to Get Clients Consistently (Through Content)",
    metaDesc:
      "How to use LinkedIn to get consulting clients consistently in 2026. Content strategy, voice training, and inbound systems that turn your profile into a steady client pipeline.",
    qaQuestion:
      "How do consultants get clients on LinkedIn in 2026?",
    qaAnswer:
      "Consultants get clients on LinkedIn in 2026 by publishing 3-5 authority posts per week that solve the same problems prospects pay for. Pick one positioning niche, share frameworks and case studies (anonymized), engage with prospects' content for weeks before any DM, and add a clear CTA in your About section. Content builds trust before any sales call.",
  },
  {
    dir: "industries/financial-services",
    title:
      "LinkedIn for Financial Advisors in 2026: Compliant Content That Wins Trust",
    metaDesc:
      "Best LinkedIn strategy for financial advisors and wealth managers in 2026. Compliance-aware content, voice training, and trust-building posts that grow your client book.",
    qaQuestion:
      "How do financial advisors win on LinkedIn in 2026?",
    qaAnswer:
      "Financial advisors win on LinkedIn in 2026 by publishing compliance-aware educational content — never advice, always principles. Use voice-trained AI to draft posts about market dynamics, retirement planning principles, or behavioral finance traps, then run every post through your firm's compliance review. Consistency over virality builds long-term trust with high-net-worth prospects.",
  },
  {
    dir: "industries/real-estate",
    title:
      "LinkedIn for Real Estate Agents in 2026: Lead Generation Through Content",
    metaDesc:
      "How to use LinkedIn for real estate lead generation in 2026. Content strategy for agents, market insights, listing-promotion tactics, and the inbound system top agents use.",
    qaQuestion:
      "How do real estate agents generate leads on LinkedIn in 2026?",
    qaAnswer:
      "Real estate agents generate leads on LinkedIn in 2026 by publishing local market insights, neighborhood breakdowns, and buyer-side or seller-side education content. Post 3-5 times per week with specific local data, use carousels to show market trends, engage in local LinkedIn groups, and add a calendar-booking link in your headline for direct prospect outreach.",
  },
  {
    dir: "industries/healthcare",
    title:
      "LinkedIn for Healthcare in 2026: Marketing & Recruitment Content That Works",
    metaDesc:
      "How to use LinkedIn for healthcare marketing and recruitment in 2026. HIPAA-aware content, voice training, employer branding, and patient education without compliance risk.",
    qaQuestion:
      "How do healthcare organizations win on LinkedIn in 2026?",
    qaAnswer:
      "Healthcare organizations win on LinkedIn in 2026 by publishing HIPAA-safe educational content — population health insights, employer branding posts, clinician spotlights, and recruitment angles. Avoid patient-specific details, focus on principles and culture, and run every post through compliance review. Personal-profile posts from clinicians outperform company-page content by 5-10x.",
  },
  {
    dir: "industries/ecommerce",
    title:
      "LinkedIn for E-commerce in 2026: B2B Partnerships & Brand Building Strategy",
    metaDesc:
      "How to use LinkedIn for e-commerce B2B partnerships in 2026. Build distributor relationships, win retail buyer attention, and grow your DTC brand through founder-led content.",
    qaQuestion:
      "How do e-commerce brands win on LinkedIn in 2026?",
    qaAnswer:
      "E-commerce brands win on LinkedIn in 2026 by using founder-led content to attract B2B partners — distributors, retail buyers, wholesale accounts. Publish 3-5 weekly posts on supply-chain learnings, customer wins, and category insights. LinkedIn outperforms Instagram for B2B partnerships and is where retail buyers and bigger DTC operators actively look for new vendors.",
  },

  // ─── FEATURES (top by impressions) ─────────────────────────────────
  {
    dir: "features/reddit-to-linkedin",
    title:
      "Reddit to LinkedIn Content in 2026: How to Repurpose Reddit Posts Into LinkedIn",
    metaDesc:
      "How to repurpose Reddit posts into LinkedIn content in 2026. Turn viral Reddit threads into authority LinkedIn posts using voice-trained AI. Save hours, win the algorithm.",
    qaQuestion:
      "How do you turn Reddit posts into LinkedIn content in 2026?",
    qaAnswer:
      "Turning Reddit posts into LinkedIn content in 2026 means feeding a high-engagement Reddit thread URL into a voice-trained AI that extracts the core insight and rewrites it for a professional audience. LinkedGrow's Reddit-to-LinkedIn feature does this in one click — keeping the insight, swapping the tone, adding your voice. Saves 30-60 minutes per post.",
  },
  {
    dir: "features/web-to-linkedin",
    title:
      "Turn Web Articles Into LinkedIn Posts in 2026: AI-Powered Repurposing",
    metaDesc:
      "How to turn any web article into a LinkedIn post in 2026. Drop a URL, get a voice-matched LinkedIn post in seconds. AI-powered web-to-LinkedIn repurposing for content creators.",
    qaQuestion:
      "How do you turn a web article into a LinkedIn post in 2026?",
    qaAnswer:
      "Turning a web article into a LinkedIn post in 2026 means dropping the URL into an AI tool that extracts the article's core thesis and rewrites it as a native LinkedIn post in your voice. LinkedGrow's web-to-LinkedIn feature does this in one click — fetches the article, extracts key points, rewrites in your voice with a hook and CTA. 30 seconds per post.",
  },
  {
    dir: "features/blog-to-linkedin",
    title:
      "Convert Blog Posts to LinkedIn in 2026: AI-Powered Content Repurposing",
    metaDesc:
      "How to convert blog posts into LinkedIn content automatically in 2026. AI-powered blog-to-LinkedIn repurposing turns your existing articles into voice-matched LinkedIn posts in seconds.",
    qaQuestion:
      "How do you convert blog posts to LinkedIn content in 2026?",
    qaAnswer:
      "Converting blog posts to LinkedIn content in 2026 means feeding your blog URL into an AI tool that extracts the thesis and rewrites it as a native LinkedIn post in your voice. LinkedGrow's blog-to-LinkedIn feature pulls your article, identifies key insights, and produces 1-3 LinkedIn-ready posts per article — letting one blog feed weeks of LinkedIn content.",
  },
  {
    dir: "features/ai-image-generation",
    title:
      "AI LinkedIn Image Generation in 2026: Create Post Visuals Cheap (BYOK)",
    metaDesc:
      "How to generate AI images for LinkedIn posts cheaply in 2026. 14 image models from 3 providers via BYOK pricing — pay $0.02-$0.08 per image instead of bundled monthly caps.",
    qaQuestion:
      "How do you generate AI images for LinkedIn posts in 2026?",
    qaAnswer:
      "Generating AI images for LinkedIn posts in 2026 with BYOK pricing means using your own OpenAI, Google, or Replicate API keys for $0.02-$0.08 per image — far cheaper than bundled tools that cap you at 20-30 images per month. LinkedGrow supports 14 image models across GPT Image, Imagen 4, Nano Banana, and FLUX with full resolution control.",
  },
  {
    dir: "features/bring-your-own-key",
    title:
      "BYOK AI Tool for LinkedIn in 2026: Use Your Own API Keys (Save 60-90%)",
    metaDesc:
      "Bring your own AI API key LinkedIn tool in 2026. Use your OpenAI, Anthropic, Google, or Grok keys for unlimited generation at $2-4/mo in AI costs. Save 60-90% vs bundled tools.",
    qaQuestion:
      "What is BYOK pricing for LinkedIn AI tools in 2026?",
    qaAnswer:
      "BYOK (Bring Your Own Key) pricing for LinkedIn AI tools in 2026 means you connect your own API keys from OpenAI, Anthropic, Google, Grok, Perplexity, or Kimi, and pay providers directly for usage. LinkedGrow charges a flat $13/mo subscription, you pay $2-4/mo to AI providers — total cost 60-90% less than bundled tools like Taplio ($52+/mo) or Kleo ($99/mo).",
  },
  {
    dir: "features/ai-post-generator",
    title:
      "AI LinkedIn Post Generator in 2026: Write Posts in Your Voice (BYOK)",
    metaDesc:
      "How to generate LinkedIn posts with AI automatically in 2026. Voice-trained AI with 26 models from 6 providers via BYOK — generates posts in your authentic voice in 30 seconds.",
    qaQuestion:
      "How do you generate LinkedIn posts with AI in 2026?",
    qaAnswer:
      "Generating LinkedIn posts with AI in 2026 means training the AI on your past posts so output matches your voice, then prompting it with a topic. LinkedGrow trains a personal voice profile from 5 sample posts and uses 26 AI models across 6 providers via BYOK pricing — generating in-voice posts in 30 seconds for $0.001-$0.01 per post.",
  },
  {
    dir: "features/voice-training",
    title:
      "AI Writing Voice Clone for LinkedIn in 2026: Train AI in Your Style",
    metaDesc:
      "How to train AI to write LinkedIn posts in your voice in 2026. Voice-cloning technology that learns your style from 5 sample posts. AI-generated content that actually sounds like you.",
    qaQuestion:
      "How do you train AI to write LinkedIn posts in your voice in 2026?",
    qaAnswer:
      "Training AI to write in your LinkedIn voice in 2026 takes 5 sample posts. LinkedGrow's voice-training analyzes your sentence rhythm, vocabulary, hooks, and structure, then generates new posts that match it. You also set business context, target audience, and topics to never mention — producing AI content that 95%+ of readers can't distinguish from your own writing.",
  },
  {
    dir: "features/hook-generator",
    title:
      "Best LinkedIn Hook Generator in 2026: Viral Opening Lines (AI-Powered)",
    metaDesc:
      "Best LinkedIn hook generator for viral opening lines in 2026. AI-powered hooks that maximize see-more clicks and dwell time. The first 2 lines decide if your post gets reach.",
    qaQuestion:
      "What is the best LinkedIn hook generator in 2026?",
    qaAnswer:
      "The best LinkedIn hook generator in 2026 produces opening lines that maximize see-more clicks and dwell time — the two algorithm signals that decide reach. LinkedGrow's hook generator uses your voice profile to produce 5-10 hook variants per topic, mixing curiosity, contrarian takes, and pattern-interrupts. Stronger hooks lift reach 3-10x on otherwise identical posts.",
  },
  {
    dir: "features/carousel-generator",
    title:
      "LinkedIn Carousel Generator in 2026: Create Multi-Slide Posts Without Canva",
    metaDesc:
      "How to create LinkedIn carousel posts without Canva in 2026. AI-powered carousel generator turns any topic into a 5-10 slide carousel with on-brand design and copy. Saves hours per carousel.",
    qaQuestion:
      "How do you create LinkedIn carousels in 2026?",
    qaAnswer:
      "Creating LinkedIn carousels in 2026 means using an AI tool that generates both copy and design from a topic prompt — bypassing Canva. LinkedGrow's carousel generator produces 5-10 slide carousels with title, body, and design in one click. Carousel posts get 6x more engagement than text posts on LinkedIn, making them the highest-leverage format for reach.",
  },
  {
    dir: "features/post-scheduling",
    title:
      "Schedule LinkedIn Posts in Advance in 2026: Free LinkedIn Scheduler Guide",
    metaDesc:
      "How to schedule LinkedIn posts in advance for free in 2026. Built-in scheduling, optimal-time suggestions, and content-calendar view. Schedule once, publish for weeks.",
    qaQuestion:
      "How do you schedule LinkedIn posts in advance in 2026?",
    qaAnswer:
      "Scheduling LinkedIn posts in advance in 2026 means using a tool that connects via LinkedIn's official OAuth API and queues posts for any future date. LinkedGrow's scheduler supports unlimited scheduling on Pro, optimal-time suggestions based on audience activity, content-calendar view, and timezone-aware publishing. Schedule a month of content in 30 minutes.",
  },
  {
    dir: "features/content-calendar",
    title:
      "LinkedIn Content Calendar in 2026: Plan Posts Visually for Months Ahead",
    metaDesc:
      "How to plan a LinkedIn content calendar for the month in 2026. Visual content calendar with drag-drop scheduling, theme planning, and gap detection. Stop posting random — plan strategically.",
    qaQuestion:
      "How do you plan a LinkedIn content calendar in 2026?",
    qaAnswer:
      "Planning a LinkedIn content calendar in 2026 means mapping content themes to days of the week, then filling the calendar with specific posts. LinkedGrow's calendar view shows scheduled, published, and draft posts in a month-grid with drag-drop rescheduling, theme tagging, and gap detection — letting creators plan a full month in 30 minutes.",
  },
  {
    dir: "features/analytics",
    title:
      "LinkedIn Analytics Tool in 2026: Track Post Performance & Engagement Rate",
    metaDesc:
      "How to track LinkedIn post analytics and engagement rate in 2026. Performance metrics by post, top-performing content patterns, dwell time, and audience insights — built for growth.",
    qaQuestion:
      "How do you track LinkedIn analytics in 2026?",
    qaAnswer:
      "Tracking LinkedIn analytics in 2026 means monitoring per-post impressions, engagement rate, dwell time, and audience demographics — then iterating on what works. LinkedGrow's analytics dashboard surfaces top-performing content patterns, hook performance, and time-of-day trends — letting creators double down on formats that compound reach over weeks.",
  },
  {
    dir: "features/team-collaboration",
    title:
      "LinkedIn Team Collaboration Tool in 2026: Approval Workflows & Multi-User Access",
    metaDesc:
      "Best LinkedIn content tool for team collaboration and approval in 2026. Multi-user workflows, role-based permissions, brand guardrails, and approval flows — without per-seat pricing.",
    qaQuestion:
      "How do teams collaborate on LinkedIn content in 2026?",
    qaAnswer:
      "Teams collaborate on LinkedIn content in 2026 with shared dashboards, role-based permissions, and approval workflows that route drafts to brand owners before publishing. LinkedGrow's Business plan ($79/mo flat for unlimited members) handles voice profiles per team member, brand guardrails, draft-to-approval flows, and team analytics — without per-seat fees.",
  },
  {
    dir: "features/ab-testing",
    title:
      "LinkedIn A/B Testing in 2026: Test Post Versions to Find Winners",
    metaDesc:
      "How to A/B test LinkedIn posts to improve engagement in 2026. Test hooks, formats, lengths, and CTAs to find what works for your audience. Data-driven LinkedIn growth.",
    qaQuestion:
      "How do you A/B test LinkedIn posts in 2026?",
    qaAnswer:
      "A/B testing LinkedIn posts in 2026 means publishing variants of the same post (different hooks, lengths, CTAs) at staggered times and comparing engagement metrics. LinkedGrow's A/B testing feature manages variants, schedules them, tracks performance, and surfaces winners — turning gut-feel posting into data-driven content strategy. Available on the Business plan.",
  },
  {
    dir: "features/cross-promotion",
    title:
      "LinkedIn Cross-Promotion Tool in 2026: Boost Posts With Group Engagement",
    metaDesc:
      "LinkedIn cross-promotion tool to boost posts with group engagement in 2026. Get other creators to engage with your content in the first hour to maximize algorithm reach.",
    qaQuestion:
      "How does LinkedIn cross-promotion work in 2026?",
    qaAnswer:
      "LinkedIn cross-promotion in 2026 means coordinating with other creators to engage with each other's posts in the critical first 60-90 minutes — when LinkedIn's algorithm decides reach. LinkedGrow's cross-promotion tool matches you with relevant creators in your niche and coordinates engagement, lifting first-hour comment velocity 3-5x for higher distribution.",
  },
  {
    dir: "features/youtube-to-linkedin",
    title:
      "YouTube to LinkedIn Repurposing in 2026: Turn Videos Into Posts (AI)",
    metaDesc:
      "How to repurpose YouTube videos into LinkedIn posts in 2026. AI-powered transcript-to-post repurposing turns your video content into voice-matched LinkedIn posts in seconds.",
    qaQuestion:
      "How do you turn YouTube videos into LinkedIn posts in 2026?",
    qaAnswer:
      "Turning YouTube videos into LinkedIn posts in 2026 means feeding the video URL into an AI tool that pulls the transcript, extracts key insights, and rewrites them as native LinkedIn posts in your voice. LinkedGrow's YouTube-to-LinkedIn feature does this in one click — one 10-minute video can produce 3-5 LinkedIn posts that drive viewers back to the video.",
  },
];

function rewritePageMetadata(filePath, config) {
  let src = fs.readFileSync(filePath, "utf8");

  // Replace title (greedy across all 3 occurrences: main, OG, twitter)
  src = src.replace(
    /title:\s*"[^"]*",/g,
    (match) => {
      // Only replace if it looks like a SEO title (contains keyword markers)
      if (/Best |How to |LinkedIn|Alternative|Guide|Generator|Calculator|Tool|Platform|Strategy/.test(match) && /\| LinkedGrow|2026/.test(match)) {
        return `title: "${escapeReplacement(config.title)}",`;
      }
      return match;
    }
  );

  // Replace main description (one occurrence, the top-level one)
  src = src.replace(
    /(\s+description:\s*\n?\s*")[^"]+(",)/,
    (_match, prefix, suffix) => `${prefix}${config.metaDesc}${suffix}`
  );

  fs.writeFileSync(filePath, src);
}

function rewriteContentFile(filePath, config) {
  let src = fs.readFileSync(filePath, "utf8");

  // 1. Add QuickAnswer import (idempotent)
  if (!src.includes('@/components/seo/quick-answer')) {
    src = src.replace(
      /import\s+\{\s*LandingHero\s*\}\s+from\s+"@\/components\/landing\/landing-hero";/,
      `import { LandingHero } from "@/components/landing/landing-hero";\nimport { QuickAnswer } from "@/components/seo/quick-answer";`
    );
  }

  // 2. Insert QuickAnswer block after the LandingHero closing tag (idempotent).
  if (!src.includes('<QuickAnswer')) {
    const quickAnswerJsx = `\n      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">\n        <QuickAnswer\n          question="${config.qaQuestion}"\n          answer="${config.qaAnswer}"\n        />\n      </div>\n`;

    // Try to insert just before the next major section comment after LandingHero
    const heroEndRegex =
      /(<LandingHero[\s\S]*?\/>\n)(\s+<Landing(?:PainPoints|Features|HowItWorks|BYOK))/;
    if (heroEndRegex.test(src)) {
      src = src.replace(heroEndRegex, (_match, hero, nextSection) => {
        return `${hero}${quickAnswerJsx}${nextSection}`;
      });
    } else {
      // Fallback: insert after first <LandingHero ... />
      src = src.replace(/(<LandingHero[\s\S]*?\/>)/, (_match, hero) => {
        return `${hero}\n${quickAnswerJsx}`;
      });
    }
  }

  fs.writeFileSync(filePath, src);
}

function findContentFile(dir) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  return files.find((f) => f.endsWith("-content.tsx")) || null;
}

let updated = 0;
let skipped = 0;
const errors = [];

for (const config of CONFIGS) {
  const dir = path.join(ROOT, config.dir);
  if (!fs.existsSync(dir)) {
    console.warn(`SKIP: ${config.dir} (directory not found)`);
    skipped++;
    continue;
  }

  const pageFile = path.join(dir, "page.tsx");
  if (!fs.existsSync(pageFile)) {
    console.warn(`SKIP: ${config.dir} (page.tsx not found)`);
    skipped++;
    continue;
  }

  const contentFileName = findContentFile(dir);
  if (!contentFileName) {
    console.warn(`SKIP: ${config.dir} (no -content.tsx found)`);
    skipped++;
    continue;
  }
  const contentFile = path.join(dir, contentFileName);

  try {
    rewritePageMetadata(pageFile, config);
    rewriteContentFile(contentFile, config);
    console.log(`OK   ${config.dir}`);
    updated++;
  } catch (err) {
    console.error(`FAIL ${config.dir}: ${err.message}`);
    errors.push({ dir: config.dir, error: err.message });
  }
}

console.log(`\nDone. ${updated} pages updated, ${skipped} skipped, ${errors.length} errors.`);
if (errors.length) {
  console.log("\nErrors:");
  errors.forEach((e) => console.log(`  ${e.dir}: ${e.error}`));
  process.exit(1);
}
