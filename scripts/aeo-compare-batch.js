#!/usr/bin/env node
/* eslint-disable */
// Batch-applies AEO patterns to all /compare/* pages:
//   1. New CTR title in page.tsx + metadata
//   2. QuickAnswer import + block after LandingHero
//   3. Question-form headline in LandingHero
//   4. Removes the legacy "Quick Verdict" section + its verdictRef/verdictInView
//
// Run from repo root: node scripts/aeo-compare-batch.js

const fs = require("fs");
const path = require("path");

const COMPARE_DIR = path.join(__dirname, "..", "src", "app", "compare");

/**
 * Per-competitor config. Each entry powers the title, the LandingHero question,
 * and the QuickAnswer answer string for that compare page.
 *
 * Quick Answer must be 40-60 words, factual, mirroring article content.
 */
const CONFIGS = {
  "authoredup-alternative": {
    competitor: "AuthoredUp",
    titleTail: "How LinkedGrow Compares on AI & Pricing",
    metaDesc:
      "Looking for an AuthoredUp alternative? LinkedGrow vs AuthoredUp compared on pricing, AI generation, and analytics. $13/mo with unlimited AI vs AuthoredUp's $19.99/mo without AI generation.",
    heroLine1: "Looking for an AuthoredUp Alternative?",
    heroGradient: "How LinkedGrow Compares (2026)",
    qaQuestion: "What is the best AuthoredUp alternative in 2026?",
    qaAnswer:
      "LinkedGrow is the best AuthoredUp alternative in 2026 for LinkedIn creators who need real AI generation, not just formatting. LinkedGrow starts at $13/mo (billed yearly) with 26 AI models, unlimited image generation, voice training, and scheduling. AuthoredUp focuses on Chrome-extension formatting and analytics at $19.99/mo without integrated AI post generation.",
  },
  "buffer-alternative": {
    competitor: "Buffer",
    titleTail: "How LinkedGrow Compares for LinkedIn Scheduling & AI",
    metaDesc:
      "Looking for a Buffer alternative for LinkedIn? LinkedGrow vs Buffer compared on AI generation, scheduling, and pricing. $13/mo with unlimited AI vs Buffer's multi-platform scheduler without LinkedIn-native AI.",
    heroLine1: "Looking for a Buffer Alternative?",
    heroGradient: "How LinkedGrow Compares for LinkedIn (2026)",
    qaQuestion: "What is the best Buffer alternative for LinkedIn in 2026?",
    qaAnswer:
      "LinkedGrow is the best Buffer alternative in 2026 for creators who post primarily on LinkedIn. LinkedGrow starts at $13/mo (billed yearly) with 26 AI models, voice training, hooks generation, and LinkedIn-native scheduling. Buffer is multi-platform and lacks LinkedIn-specific AI features like hooks, voice cloning, and carousel generation.",
  },
  "contentin-alternative": {
    competitor: "ContentIn",
    titleTail: "How LinkedGrow Compares on AI Models & Pricing",
    metaDesc:
      "Looking for a ContentIn alternative? LinkedGrow vs ContentIn compared on pricing, AI models, and features. $13/mo with 26 AI models vs ContentIn's single-model approach at higher pricing.",
    heroLine1: "Looking for a ContentIn Alternative?",
    heroGradient: "How LinkedGrow Compares (2026)",
    qaQuestion: "What is the best ContentIn alternative in 2026?",
    qaAnswer:
      "LinkedGrow is the best ContentIn alternative in 2026 for creators who want AI choice and BYOK pricing. LinkedGrow starts at $13/mo (billed yearly) with 26 AI models from 6 providers, unlimited image generation, scheduling, and analytics. ContentIn locks you to a single AI workflow with bundled per-month costs and no provider choice.",
  },
  "easygen-alternative": {
    competitor: "EasyGen",
    titleTail: "How LinkedGrow Compares on AI Models & Pricing",
    metaDesc:
      "Looking for an EasyGen alternative? LinkedGrow vs EasyGen compared on AI models, pricing, and features. $13/mo with 26 AI models vs EasyGen's single-model approach.",
    heroLine1: "Looking for an EasyGen Alternative?",
    heroGradient: "How LinkedGrow Compares (2026)",
    qaQuestion: "What is the best EasyGen alternative in 2026?",
    qaAnswer:
      "LinkedGrow is the best EasyGen alternative in 2026 for LinkedIn creators who want AI choice plus scheduling and analytics. LinkedGrow starts at $13/mo (billed yearly) with 26 AI models, unlimited image generation, voice training, and built-in scheduling. EasyGen focuses on AI text generation only and lacks scheduling, analytics, and image generation.",
  },
  "hootsuite-alternative": {
    competitor: "Hootsuite",
    titleTail: "How LinkedGrow Compares for LinkedIn Content & AI",
    metaDesc:
      "Looking for a Hootsuite alternative for LinkedIn? LinkedGrow vs Hootsuite compared on AI generation, pricing, and LinkedIn focus. $13/mo with 26 AI models vs Hootsuite's $99+/mo enterprise scheduler.",
    heroLine1: "Looking for a Hootsuite Alternative?",
    heroGradient: "How LinkedGrow Compares for LinkedIn (2026)",
    qaQuestion: "What is the best Hootsuite alternative for LinkedIn in 2026?",
    qaAnswer:
      "LinkedGrow is the best Hootsuite alternative in 2026 for LinkedIn-focused creators and small teams. LinkedGrow starts at $13/mo (billed yearly) with 26 AI models, voice training, scheduling, and LinkedIn-native features. Hootsuite is multi-platform enterprise software starting at $99/mo without LinkedIn-specific AI generation, hooks, or carousel tools.",
  },
  "kleo-alternative": {
    competitor: "Kleo",
    titleTail: "How LinkedGrow Compares on Pricing, AI & Features",
    metaDesc:
      "Looking for a Kleo alternative? LinkedGrow vs Kleo compared on pricing, AI models, image generation, and features. $13/mo vs $99/mo, 26 AI models vs 1, unlimited images vs 20/month cap.",
    heroLine1: "Looking for a Kleo Alternative?",
    heroGradient: "How LinkedGrow Compares (2026)",
    qaQuestion: "What is the best Kleo alternative in 2026?",
    qaAnswer:
      "LinkedGrow is the best Kleo alternative in 2026 for LinkedIn creators who want unlimited AI without the $99/mo lock-in. LinkedGrow starts at $13/mo (billed yearly) with 26 AI models from 6 providers, unlimited image generation, scheduling, analytics, and A/B testing. Kleo offers one Claude model at $99/mo with a 20-image monthly cap.",
  },
  "magicpost-alternative": {
    competitor: "MagicPost",
    titleTail: "How LinkedGrow Compares on Pricing & Features",
    metaDesc:
      "Looking for a MagicPost alternative? LinkedGrow vs MagicPost compared on pricing, AI models, and features. $13/mo unlimited vs $27/mo for 30 posts, 26 AI models vs 1, BYOK pricing.",
    heroLine1: "Looking for a MagicPost Alternative?",
    heroGradient: "How LinkedGrow Compares (2026)",
    qaQuestion: "What is the best MagicPost alternative in 2026?",
    qaAnswer:
      "LinkedGrow is the best MagicPost alternative in 2026 for creators who hit MagicPost's 30-post monthly cap. LinkedGrow starts at $13/mo (billed yearly) with unlimited AI post generation, 26 AI models from 6 providers, unlimited image generation, scheduling, and analytics. MagicPost charges $27/mo for just 30 posts and locks you to a single bundled AI model.",
  },
  "postdrips-alternative": {
    competitor: "PostDrips",
    titleTail: "How LinkedGrow Compares on AI Models & Features",
    metaDesc:
      "Looking for a PostDrips alternative? LinkedGrow vs PostDrips compared on AI models, scheduling, and pricing. $13/mo with 26 AI models, unlimited image generation, and full LinkedIn-native scheduling.",
    heroLine1: "Looking for a PostDrips Alternative?",
    heroGradient: "How LinkedGrow Compares (2026)",
    qaQuestion: "What is the best PostDrips alternative in 2026?",
    qaAnswer:
      "LinkedGrow is the best PostDrips alternative in 2026 for LinkedIn creators who want AI choice plus full scheduling. LinkedGrow starts at $13/mo (billed yearly) with 26 AI models, unlimited image generation, voice training, hooks, and built-in scheduling. PostDrips focuses on scheduling drips with limited AI integration and no image generation.",
  },
  "redactai-alternative": {
    competitor: "RedactAI",
    titleTail: "How LinkedGrow Compares on AI Models & Pricing",
    metaDesc:
      "Looking for a RedactAI alternative? LinkedGrow vs RedactAI compared on AI models, image generation, and pricing. $13/mo with 26 AI models vs RedactAI's single-model approach.",
    heroLine1: "Looking for a RedactAI Alternative?",
    heroGradient: "How LinkedGrow Compares (2026)",
    qaQuestion: "What is the best RedactAI alternative in 2026?",
    qaAnswer:
      "LinkedGrow is the best RedactAI alternative in 2026 for LinkedIn creators who want AI choice and built-in scheduling. LinkedGrow starts at $13/mo (billed yearly) with 26 AI models from 6 providers, unlimited image generation, voice training, and scheduling. RedactAI focuses on AI text generation only without scheduling, analytics, or image generation.",
  },
  "socialsonic-alternative": {
    competitor: "SocialSonic",
    titleTail: "How LinkedGrow Compares on AI Models & Pricing",
    metaDesc:
      "Looking for a SocialSonic alternative? LinkedGrow vs SocialSonic compared on AI models, image generation, and pricing. $13/mo with 26 AI models, BYOK pricing, and unlimited image generation.",
    heroLine1: "Looking for a SocialSonic Alternative?",
    heroGradient: "How LinkedGrow Compares (2026)",
    qaQuestion: "What is the best SocialSonic alternative in 2026?",
    qaAnswer:
      "LinkedGrow is the best SocialSonic alternative in 2026 for LinkedIn creators who want AI provider choice and BYOK pricing. LinkedGrow starts at $13/mo (billed yearly) with 26 AI models from 6 providers, unlimited image generation, voice training, and scheduling. SocialSonic locks you to a single AI workflow with bundled monthly costs.",
  },
  "supergrow-alternative": {
    competitor: "Supergrow",
    titleTail: "How LinkedGrow Compares on Unlimited AI & Pricing",
    metaDesc:
      "Looking for a Supergrow alternative? LinkedGrow vs Supergrow compared on AI models, pricing, and BYOK. $13/mo with 26 AI models and BYOK vs Supergrow's bundled per-month pricing.",
    heroLine1: "Looking for a Supergrow Alternative?",
    heroGradient: "How LinkedGrow Compares (2026)",
    qaQuestion: "What is the best Supergrow alternative in 2026?",
    qaAnswer:
      "LinkedGrow is the best Supergrow alternative in 2026 for creators who want unlimited AI with BYOK pricing. LinkedGrow starts at $13/mo (billed yearly) with 26 AI models from 6 providers, unlimited image generation, voice training, and analytics. Supergrow bundles AI costs into a fixed monthly fee with limited model choice and capped image generation.",
  },
  "taplio-alternative": {
    competitor: "Taplio",
    titleTail: "How LinkedGrow Compares on Pricing, AI & Features",
    metaDesc:
      "Looking for a Taplio alternative? LinkedGrow vs Taplio compared on pricing, AI models, and features. $13/mo with 26 AI models and BYOK vs Taplio's $52+/mo bundled pricing.",
    heroLine1: "Looking for a Taplio Alternative?",
    heroGradient: "How LinkedGrow Compares (2026)",
    qaQuestion: "What is the best Taplio alternative in 2026?",
    qaAnswer:
      "LinkedGrow is the best Taplio alternative in 2026 for creators who want unlimited AI without the $52+/mo bundled pricing. LinkedGrow starts at $13/mo (billed yearly) with 26 AI models from 6 providers, unlimited image generation, voice training, scheduling, and analytics. Taplio bundles AI costs into a fixed fee starting at $52/mo with limited model choice.",
  },
  "typefully-alternative": {
    competitor: "Typefully",
    titleTail: "How LinkedGrow Compares for LinkedIn-First Writing",
    metaDesc:
      "Looking for a Typefully alternative for LinkedIn? LinkedGrow vs Typefully compared on AI generation, scheduling, and LinkedIn focus. $13/mo with 26 AI models built specifically for LinkedIn creators.",
    heroLine1: "Looking for a Typefully Alternative?",
    heroGradient: "How LinkedGrow Compares for LinkedIn (2026)",
    qaQuestion: "What is the best Typefully alternative for LinkedIn in 2026?",
    qaAnswer:
      "LinkedGrow is the best Typefully alternative in 2026 for creators who post primarily on LinkedIn. LinkedGrow starts at $13/mo (billed yearly) with 26 AI models, voice training, hooks generation, and LinkedIn-native scheduling. Typefully is Twitter-first with limited LinkedIn-specific AI features and no carousel generation, hook generator, or LinkedIn analytics.",
  },
};

// JS replace strings interpret $1, $2, etc. as backrefs. Escape literal $ in user content.
function escapeReplacement(str) {
  return str.replace(/\$/g, "$$$$");
}

function rewritePageMetadata(filePath, config) {
  let src = fs.readFileSync(filePath, "utf8");
  const newTitle = `${config.competitor} Alternative in 2026: ${config.titleTail}`;

  // Replace ALL title strings (main, OG, twitter)
  src = src.replace(
    /title:\s*"Best [^"]*Alternative[^"]*\(2026\)[^"]*",/g,
    `title: "${escapeReplacement(newTitle)}",`
  );

  // Replace main description (use a function callback to avoid backref interpolation in replacement)
  src = src.replace(
    /(\s+description:\s*\n?\s*")Best [^"]*Alternative[^"]+(",)/,
    (_match, prefix, suffix) => `${prefix}${config.metaDesc}${suffix}`
  );

  fs.writeFileSync(filePath, src);
  return newTitle;
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

  // 2. Rewrite hero headline to question form
  src = src.replace(
    /headline=\{\{\s*\n?\s*line1:\s*"Best [^"]*Alternative[^"]*",\s*\n?\s*gradient:\s*"[^"]*",\s*\n?\s*\}\}/,
    `headline={{\n          line1: "${config.heroLine1}",\n          gradient: "${config.heroGradient}",\n        }}`
  );

  // 3. Insert QuickAnswer block after the LandingHero closing tag (idempotent).
  // Use callback form so qaAnswer's literal "$13" isn't interpreted as a backref.
  if (!src.includes('<QuickAnswer')) {
    const quickAnswerJsx = `\n      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 -mt-8">\n        <QuickAnswer\n          question="${config.qaQuestion}"\n          answer="${config.qaAnswer}"\n        />\n      </div>\n`;

    const heroEndRegex =
      /(<LandingHero[\s\S]*?\/>\n)(\s+\{\/\*\s*[─\-]+\s*Quick)/;
    if (heroEndRegex.test(src)) {
      src = src.replace(heroEndRegex, (_match, hero, nextComment) => {
        return `${hero}${quickAnswerJsx}${nextComment}`;
      });
    } else {
      // Fallback: insert after first <LandingHero ... />
      src = src.replace(/(<LandingHero[\s\S]*?\/>)/, (_match, hero) => {
        return `${hero}\n${quickAnswerJsx}`;
      });
    }
  }

  // 4. Remove `const verdictRef = useRef(null);`
  src = src.replace(/\s*const\s+verdictRef\s*=\s*useRef\(null\);\n/g, "\n");

  // 5. Remove `const verdictInView = useInView(verdictRef, { once: true, margin: "-80px" });`
  src = src.replace(
    /\s*const\s+verdictInView\s*=\s*useInView\(verdictRef[^;]+;\n/g,
    "\n"
  );

  // 6. Remove the entire Quick Verdict section (between its comment marker and the next `{/* ` comment)
  src = src.replace(
    /\s*\{\/\*\s*[─\-]+\s*Quick Verdict\s*[─\-]+\s*\*\/\}[\s\S]*?<\/section>\n/,
    "\n"
  );

  fs.writeFileSync(filePath, src);
}

function findContentFile(dir) {
  const files = fs.readdirSync(dir);
  return (
    files.find((f) => f.endsWith("-content.tsx")) ||
    files.find((f) => f.includes("content") && f.endsWith(".tsx"))
  );
}

const slugs = Object.keys(CONFIGS);
let updated = 0;
let skipped = 0;

for (const slug of slugs) {
  const dir = path.join(COMPARE_DIR, slug);
  if (!fs.existsSync(dir)) {
    console.warn(`SKIP: ${slug} (directory not found)`);
    skipped++;
    continue;
  }

  const pageFile = path.join(dir, "page.tsx");
  if (!fs.existsSync(pageFile)) {
    console.warn(`SKIP: ${slug} (page.tsx not found)`);
    skipped++;
    continue;
  }

  const contentFileName = findContentFile(dir);
  if (!contentFileName) {
    console.warn(`SKIP: ${slug} (no *-content.tsx found)`);
    skipped++;
    continue;
  }
  const contentFile = path.join(dir, contentFileName);

  const config = CONFIGS[slug];
  const newTitle = rewritePageMetadata(pageFile, config);
  rewriteContentFile(contentFile, config);
  console.log(`OK   ${slug} -> "${newTitle}"`);
  updated++;
}

console.log(`\nDone. ${updated} pages updated, ${skipped} skipped.`);
