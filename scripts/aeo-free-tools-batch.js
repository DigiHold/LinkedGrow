#!/usr/bin/env node
/* eslint-disable */
// Batch-applies AEO patterns to all /free-tools/* pages:
//   1. New CTR title in page.tsx + meta description
//   2. QuickAnswer import + block in *-content.tsx (right after the hero)
//
// Run from repo root: node scripts/aeo-free-tools-batch.js

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src", "app", "free-tools");

function escapeReplacement(str) {
  return str.replace(/\$/g, "$$$$");
}

const CONFIGS = [
  {
    dir: "linkedin-text-formatter",
    title: "Free LinkedIn Text Formatter 2026: Bold, Italic & Special Characters (No Signup)",
    metaDesc:
      "Free LinkedIn text formatter for bold, italic, and special characters in 2026. Make your posts stand out with Unicode formatting that works in profiles, posts, and comments. No signup.",
    qaQuestion: "How do you format text in bold or italic on LinkedIn in 2026?",
    qaAnswer:
      "LinkedIn doesn't support native bold or italic in regular posts, but you can use Unicode characters that look like bold or italic text. The free LinkedIn Text Formatter converts your text into Unicode bold, italic, underline, and special-character styles in one click. Paste anywhere on LinkedIn — profile, posts, or comments — and the formatting renders.",
  },
  {
    dir: "linkedin-post-preview",
    title: "Free LinkedIn Post Preview Tool 2026: See How Your Post Looks Before Publishing",
    metaDesc:
      "Free LinkedIn post preview tool for 2026. Mock how your post will look in the LinkedIn feed before you publish. See the see-more cutoff, image rendering, and engagement layout.",
    qaQuestion: "How do you preview a LinkedIn post before publishing in 2026?",
    qaAnswer:
      "Previewing a LinkedIn post in 2026 means using a preview tool that mimics LinkedIn's feed rendering — the see-more cutoff, image aspect ratios, and engagement layout. The free LinkedIn Post Preview tool shows exactly how your post will appear before you publish. Catch awkward line breaks, weak hooks, and image issues before they go live.",
  },
  {
    dir: "linkedin-engagement-rate-calculator",
    title: "Free LinkedIn Engagement Rate Calculator 2026: By Industry Benchmark",
    metaDesc:
      "Free LinkedIn engagement rate calculator for 2026. Calculate engagement rate from impressions, reactions, and comments. Compare against industry benchmarks for B2B SaaS, marketing, finance.",
    qaQuestion: "How do you calculate LinkedIn engagement rate in 2026?",
    qaAnswer:
      "LinkedIn engagement rate equals (reactions + comments + shares) divided by impressions, multiplied by 100. A typical benchmark is 2-5% for personal profiles and 0.5-2% for company pages. The free Engagement Rate Calculator computes your rate and compares it to industry benchmarks (B2B SaaS, marketing, finance, healthcare, real estate) so you know if you're above or below average.",
  },
  {
    dir: "linkedin-best-time-to-post",
    title: "Best Time to Post on LinkedIn 2026: Free Tool With Optimal Posting Times",
    metaDesc:
      "Best time to post on LinkedIn in 2026. Free tool showing optimal posting times by day of week, timezone, and audience type. Based on aggregated engagement data from 2M+ posts.",
    qaQuestion: "What is the best time to post on LinkedIn in 2026?",
    qaAnswer:
      "The best time to post on LinkedIn in 2026 is Tuesday-Thursday between 8-10 AM in your audience's timezone, when professional users are most active. Wednesday at 9 AM consistently shows the highest engagement. Avoid Mondays before 9 AM and Fridays after 3 PM. The free Best Time to Post tool gives you specific recommendations based on your audience timezone.",
  },
  {
    dir: "ai-cost-calculator",
    title: "Free AI API Cost Calculator 2026: OpenAI, Claude, Gemini, Grok Compared",
    metaDesc:
      "Free AI API cost calculator for 2026. Compare costs across OpenAI GPT-5, Claude Opus 4.7, Gemini 3 Pro, Grok 4, Perplexity Sonar, Kimi K2.5. Estimate monthly spend by usage volume.",
    qaQuestion: "How much do AI APIs cost in 2026?",
    qaAnswer:
      "AI API costs in 2026 range from $0.10 to $30 per million tokens depending on the model. GPT-5 Nano and Claude Haiku 4.5 sit at the low end ($0.10-$1/M tokens), Claude Opus 4.7 and Gemini 3 Pro at the high end ($15-$30/M tokens). For typical LinkedIn content generation, expect $2-4/month total cost across all providers via BYOK.",
  },
  {
    dir: "linkedin-character-counter",
    title: "Free LinkedIn Character Counter 2026: See the Truncation Cutoff in Real Time",
    metaDesc:
      "Free LinkedIn character counter for 2026. Count characters with the 3,000-character post limit. Preview where the see-more truncation cuts your hook. Optimize for the algorithm.",
    qaQuestion: "What is the LinkedIn post character limit in 2026?",
    qaAnswer:
      "LinkedIn's post character limit in 2026 is 3,000 characters total, but the see-more truncation cuts your post at around 200-220 characters on desktop and 140-150 on mobile. Your hook (the first 2 lines before see-more) decides if anyone clicks. The free Character Counter shows live counts and previews where the cutoff lands.",
  },
  {
    dir: "linkedin-hashtag-generator",
    title: "Free LinkedIn Hashtag Generator 2026: Curated Hashtags by Industry & Topic",
    metaDesc:
      "Free LinkedIn hashtag generator for 2026. Curated hashtag lists by industry (SaaS, marketing, finance, real estate) and topic (leadership, growth, AI). Boost post visibility.",
    qaQuestion: "What are the best LinkedIn hashtags in 2026?",
    qaAnswer:
      "The best LinkedIn hashtags in 2026 are 3 specific niche tags per post — not 10 generic ones. Mix one broad tag (#LinkedIn, #Marketing), one niche (#B2BSaaS, #ContentStrategy), and one branded (your company tag). The free Hashtag Generator gives curated lists by industry and topic, plus search-volume hints to pick the right mix.",
  },
  {
    dir: "linkedin-headline-analyzer",
    title: "Free LinkedIn Headline Analyzer 2026: Improve Your Profile Score",
    metaDesc:
      "Free LinkedIn headline analyzer for 2026. Score your headline on length, keywords, value proposition. Preview how it looks in feed and search. Improve profile views and connection rate.",
    qaQuestion: "How do you write a great LinkedIn headline in 2026?",
    qaAnswer:
      "A great LinkedIn headline in 2026 includes your role, your value proposition, and 1-2 niche keywords for search. Use 200-220 characters (the max), lead with what you do, and end with who you help. The free Headline Analyzer scores your headline on length, keyword density, and clarity, then previews how it appears in feed and LinkedIn search.",
  },
  {
    dir: "linkedin-post-value-estimator",
    title: "Free LinkedIn Post Value Estimator 2026: Calculate Your Content Worth",
    metaDesc:
      "Free LinkedIn post value estimator for 2026. Calculate the monetary value of your content from impressions, engagement, and CPM benchmarks. Prove ROI of your LinkedIn presence.",
    qaQuestion: "How much is a LinkedIn post worth in 2026?",
    qaAnswer:
      "A LinkedIn post's monetary value in 2026 equals impressions multiplied by industry CPM (cost per thousand impressions). LinkedIn CPMs range from $30-$200 for B2B audiences. A post with 10,000 impressions in B2B SaaS is worth roughly $50-$200 in equivalent ad spend. The free Post Value Estimator computes your content's worth based on your industry's CPM.",
  },
  {
    dir: "linkedin-post-templates",
    title: "Free LinkedIn Post Templates 2026: Ready-to-Use Templates by Category",
    metaDesc:
      "Free LinkedIn post templates for 2026. Ready-to-use templates for storytelling, lessons learned, hot takes, listicles, and announcements. Copy, customize, post.",
    qaQuestion: "What are the best LinkedIn post templates in 2026?",
    qaAnswer:
      "The best LinkedIn post templates in 2026 are storytelling (problem -> action -> result), listicles (5 things I learned), hot takes (one bold opinion + reasoning), and lessons learned (what I got wrong + the fix). The free Post Templates library has 30+ templates by category, ready to copy and customize for your voice.",
  },
  {
    dir: "linkedin-image-sizes",
    title: "LinkedIn Image Sizes 2026: Dimensions for Every Post Type (Free Reference)",
    metaDesc:
      "LinkedIn image sizes and dimensions for every post type in 2026. Profile photo, banner, single image post, carousel, company page logo, document post. Pixel-perfect dimensions.",
    qaQuestion: "What are the LinkedIn image size dimensions in 2026?",
    qaAnswer:
      "LinkedIn image dimensions in 2026: profile photo 400x400px, banner 1584x396px, single-image post 1200x627px (1.91:1), carousel slides 1080x1080px (1:1), company logo 300x300px. The free LinkedIn Image Sizes reference covers every post type with pixel-perfect dimensions and aspect ratios that render correctly across desktop and mobile.",
  },
  {
    dir: "linkedin-video-downloader",
    title: "Free LinkedIn Video Downloader 2026: Download Videos Without Software",
    metaDesc:
      "Free LinkedIn video downloader for 2026. Download LinkedIn videos directly from any post URL — no browser extension, no software install. Save videos for offline viewing or repurposing.",
    qaQuestion: "How do you download a LinkedIn video in 2026?",
    qaAnswer:
      "Downloading a LinkedIn video in 2026 means pasting the post URL into a video downloader tool that extracts the MP4 file. The free LinkedIn Video Downloader does this in one click — no browser extension, no software install. Download for offline viewing, content repurposing, or saving competitor video research for analysis.",
  },
];

function rewritePageMetadata(filePath, config) {
  let src = fs.readFileSync(filePath, "utf8");

  // Replace all 3 title strings
  src = src.replace(/title:\s*"[^"]*",/g, (match) => {
    if (/LinkedIn|Free|Tool|Calculator|Counter|Formatter|Generator|Analyzer|Preview|Templates|Sizes|Downloader/.test(match) && /\| LinkedGrow|2026/.test(match)) {
      return `title: "${escapeReplacement(config.title)}",`;
    }
    return match;
  });

  // Replace main description (top-level only)
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
    // Try several insertion points - after any existing @/components import
    if (/import\s+\{\s*Header\s*\}\s+from\s+"@\/components\/marketing\/header";/.test(src)) {
      src = src.replace(
        /import\s+\{\s*Header\s*\}\s+from\s+"@\/components\/marketing\/header";/,
        `import { Header } from "@/components/marketing/header";\nimport { QuickAnswer } from "@/components/seo/quick-answer";`
      );
    } else if (/import\s+\{\s*Footer\s*\}\s+from\s+"@\/components\/marketing\/footer";/.test(src)) {
      src = src.replace(
        /import\s+\{\s*Footer\s*\}\s+from\s+"@\/components\/marketing\/footer";/,
        `import { Footer } from "@/components/marketing/footer";\nimport { QuickAnswer } from "@/components/seo/quick-answer";`
      );
    }
  }

  // 2. Insert QuickAnswer right after `<Header />` (idempotent)
  if (!src.includes('<QuickAnswer')) {
    const quickAnswerJsx = `\n      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-4">\n        <QuickAnswer\n          question="${config.qaQuestion}"\n          answer="${config.qaAnswer}"\n        />\n      </div>\n`;

    // Pattern: Header followed by next JSX component
    const headerEndRegex = /(<Header\s*\/>\s*\n)/;
    if (headerEndRegex.test(src)) {
      src = src.replace(headerEndRegex, (_match, header) => {
        return `${header}${quickAnswerJsx}`;
      });
    }
  }

  fs.writeFileSync(filePath, src);
}

function findContentFile(dir) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  // Free tools name: formatter-content.tsx, calculator-content.tsx, etc.
  return (
    files.find((f) => f.endsWith("-content.tsx")) ||
    files.find((f) => f.includes("content") && f.endsWith(".tsx")) ||
    null
  );
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
    console.warn(`SKIP: ${config.dir} (no content file)`);
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
if (errors.length) process.exit(1);
