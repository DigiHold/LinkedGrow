#!/usr/bin/env node

/**
 * Generate "50 Viral LinkedIn Hooks" PDF lead magnet
 * Usage: node scripts/generate-hooks-pdf.js
 */

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Brand colors
const CYAN = "#06b6d4";
const BLUE = "#2563eb";
const DARK = "#0f172a";
const DARK_LIGHTER = "#1e293b";
const SLATE_600 = "#475569";
const SLATE_400 = "#94a3b8";
const SLATE_200 = "#e2e8f0";
const WHITE = "#ffffff";

const OUTPUT_PATH = path.join(
  process.env.HOME,
  "Downloads",
  "50-viral-linkedin-hooks-linkedgrow.pdf"
);

// ─── Hook Data ───────────────────────────────────────────────────────────────

const categories = [
  {
    name: "Curiosity Hooks",
    description: "Create an irresistible urge to click \"see more\".",
    color: CYAN,
    tip: "Curiosity hooks work best when you add a specific number or surprising outcome. Instead of \"I learned something,\" try \"I learned this after losing $10K.\"",
    hooks: [
      "I tried posting daily for 90 days. The results shocked me.",
      "The one feature on LinkedIn nobody uses (but should).",
      "Most viral posts share the same DNA. Want to see it?",
      "I built a 6-figure business without a website. Thanks to LinkedIn.",
      "This sentence made me $20K.",
      "I ignored LinkedIn for 5 years. Biggest mistake of my career.",
      "Nobody told me this when I started on LinkedIn.",
      "A single DM turned into $50K. Want to know how?",
      "The difference between 200 views and 200K views is one line.",
      "I tested 100 hooks. Here's what worked best.",
    ],
  },
  {
    name: "Story Hooks",
    description: "Open with vulnerability and human connection.",
    color: "#8b5cf6",
    tip: "Story hooks perform 3x better when they start with a moment of failure or vulnerability. Your audience connects with the struggle, not the success.",
    hooks: [
      "I almost quit LinkedIn. Then I posted this.",
      "In 2020, I was broke. In 2025, I run a 7-figure business.",
      "Losing my job was the best thing that ever happened to me.",
      "I got laughed at for posting. Now they ask me for advice.",
      "I posted 100 times before I figured this out.",
      "My first viral post wasn't planned. It was raw.",
      "I shared my biggest mistake. It became my best post.",
      "I wrote about losing $20K. It got me clients.",
      "I was terrified to post. Now it's routine.",
      "My LinkedIn growth didn't start with strategy. It started with honesty.",
    ],
  },
  {
    name: "Contrarian Hooks",
    description: "Challenge conventional wisdom to spark debate.",
    color: "#f59e0b",
    tip: "Contrarian hooks drive the most comments because people love to debate. Always back your claim with evidence in the post body.",
    hooks: [
      "Most advice about digital marketing is dead wrong. Here's why.",
      "The hustle culture is a lie. Here's what actually works.",
      "Stop doing this if you want more reach.",
      "Founders: posting product updates won't grow your brand.",
      "Marketers: stop treating LinkedIn like Instagram.",
      "Stop worrying about hashtags. Start worrying about hooks.",
      "Why storytelling beats stats on LinkedIn.",
      "Your thought leadership is unreadable. Here's why.",
      "The algorithm doesn't hate you. You're just writing boring hooks.",
      "Leadership books won't make you a better leader. Real-world experience will.",
    ],
  },
  {
    name: "Question Hooks",
    description: "Turn passive scrollers into active thinkers.",
    color: "#10b981",
    tip: "Question hooks boost comment rates because people feel compelled to answer. End your post with the same question for maximum engagement.",
    hooks: [
      "What if I told you networking could be effortless?",
      "Do you know the number one mistake most marketers make on LinkedIn?",
      "Ever send a LinkedIn connection request and never heard back?",
      "You've rewritten that email four times and it's not even noon. Sound familiar?",
      "Want to build pipeline? Start with hooks.",
      "Do you know what the best day to post is? Not what you think.",
      "Why do your posts flop while others go viral?",
      "How many times should you post per week? My answer might surprise you.",
      "What happened next took me completely by surprise.",
      "Ready to double your impressions with a single fix?",
    ],
  },
  {
    name: "Data Hooks",
    description: "Lead with a surprising number for instant credibility.",
    color: "#ef4444",
    tip: "Data hooks create instant authority. Always cite your source or personal experience to maintain credibility. Round numbers feel less trustworthy than specific ones.",
    hooks: [
      "Only 10% of startups make it past the first year. Here's why.",
      "75% of professionals believe personal branding influences career success.",
      "Content marketing costs 62% less than traditional marketing and generates 3x more leads.",
      "90% of consumers say authenticity is key when deciding which brands they support.",
      "I grew from 0 to 50K followers in 12 months. Here's the exact playbook.",
      "My first post flopped. My second post flopped. Post #27 went viral.",
      "My posts average 40% click-through on \"see more.\" Here's why.",
      "I went from 0 to $100K ARR using only LinkedIn. No ads.",
      "LinkedIn engagement is up 47% year over year. Are you capitalizing?",
      "This graph explains everything about LinkedIn growth.",
    ],
  },
];

// ─── PDF Generation ──────────────────────────────────────────────────────────

function createPDF() {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 40, left: 55, right: 55 },
    autoFirstPage: false,
    info: {
      Title: "50 Viral LinkedIn Hooks",
      Author: "LinkedGrow",
      Subject: "LinkedIn Growth",
      Creator: "LinkedGrow - linkedgrow.ai",
    },
  });

  const stream = fs.createWriteStream(OUTPUT_PATH);
  doc.pipe(stream);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function getPageWidth() {
    return doc.page.width - doc.page.margins.left - doc.page.margins.right;
  }

  function roundedRect(x, y, w, h, r, fillColor) {
    doc.roundedRect(x, y, w, h, r).fill(fillColor);
  }

  function drawFooter() {
    const pw = getPageWidth();
    // Position footer just above bottom margin to avoid page overflow
    const footerY = doc.page.height - doc.page.margins.bottom - 2;
    doc.fontSize(7.5).fillColor(SLATE_400).font("Helvetica");
    doc.text("linkedgrow.ai", doc.page.margins.left, footerY, {
      width: pw / 2,
      align: "left",
      lineBreak: false,
    });
    doc.text("50 Viral LinkedIn Hooks", doc.page.margins.left + pw / 2, footerY, {
      width: pw / 2,
      align: "right",
      lineBreak: false,
    });
  }

  // SVG path for the LinkedGrow icon (from viewBox 0 0 379 230)
  const LOGO_SVG_PATH = "M205.9185,32.0339c.9512,8.7484,8.8874,15.128,17.6358,14.1767l88.8761-9.6638-93.389,116.1758-93.3595-75.0479c-6.8339-5.4935-16.9741-4.3909-22.4676,2.443L3.9774,203.5681c-5.4935,6.8339-4.3909,16.9741,2.443,22.4676,6.8339,5.4935,16.9741,4.3909,22.4676-2.443l89.2246-110.9953,93.3595,75.0479c6.8339,5.4935,16.9741,4.3909,22.4676-2.443l103.4013-128.631,9.6638,88.8761c.9512,8.7484,8.8874,15.128,17.6358,14.1767s15.128-8.8874,14.1767-17.6358l-13.8363-127.25c-.9512-8.7484-8.8874-15.128-17.6358-14.1767l-127.25,13.8363c-8.7484.9512-15.128,8.8874-14.1767,17.6358Z";

  function drawLogo(centerX, y, iconSize) {
    // Draw rounded gradient box with icon + text
    const boxSize = iconSize;
    const boxX = centerX - boxSize / 2 - 60;
    const boxY = y;

    // Gradient box (cyan to blue - approximate with cyan since PDFKit doesn't do gradients easily)
    roundedRect(boxX, boxY, boxSize, boxSize, boxSize * 0.2, CYAN);

    // Draw SVG icon scaled inside the box
    const svgW = 379;
    const svgH = 230;
    const iconPad = boxSize * 0.2;
    const scaleX = (boxSize - iconPad * 2) / svgW;
    const scaleY = (boxSize - iconPad * 2) / svgH;
    const scale = Math.min(scaleX, scaleY);

    const iconOffsetX = boxX + iconPad + ((boxSize - iconPad * 2) - svgW * scale) / 2;
    const iconOffsetY = boxY + iconPad + ((boxSize - iconPad * 2) - svgH * scale) / 2;

    doc.save();
    doc.translate(iconOffsetX, iconOffsetY);
    doc.scale(scale);
    doc.path(LOGO_SVG_PATH).fill(WHITE);
    doc.restore();

    // Text next to icon
    const textX = boxX + boxSize + 8;
    const textSize = boxSize * 0.65;
    const textY = boxY + (boxSize - textSize * 0.75) / 2;
    doc.fontSize(textSize).font("Helvetica-Bold").fillColor(WHITE)
      .text("Linked", textX, textY, { continued: true, lineBreak: false });
    doc.fillColor(CYAN).text("Grow", { continued: false, lineBreak: false });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 1: Cover
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage({ margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  const pw = 595.28; // A4 width
  const ml = 55; // margin left for content

  // Dark background
  doc.rect(0, 0, pw, 841.89).fill(DARK);

  // Gradient bar at top
  doc.rect(0, 0, pw / 2, 5).fill(CYAN);
  doc.rect(pw / 2, 0, pw / 2, 5).fill(BLUE);

  // Logo (icon + text)
  drawLogo(pw / 2, 65, 38);

  // Main title
  doc.fontSize(46).fillColor(WHITE).font("Helvetica-Bold")
    .text("50 Viral", ml, 155, { width: pw - ml * 2, align: "center" });
  doc.fontSize(46).fillColor(CYAN).font("Helvetica-Bold")
    .text("LinkedIn Hooks", ml, 210, { width: pw - ml * 2, align: "center" });

  // Subtitle
  doc.fontSize(14).fillColor(SLATE_400).font("Helvetica")
    .text("Proven opening lines from posts with 100K+ impressions.", ml, 285, {
      width: pw - ml * 2, align: "center",
    });
  doc.text("Copy, paste, and watch your engagement grow.", ml, 305, {
    width: pw - ml * 2, align: "center",
  });

  // Divider
  doc.moveTo(pw / 2 - 25, 350).lineTo(pw / 2 + 25, 350).strokeColor(CYAN).lineWidth(2).stroke();

  // What's inside
  doc.fontSize(11).fillColor(SLATE_200).font("Helvetica-Bold")
    .text("WHAT'S INSIDE", ml, 375, { width: pw - ml * 2, align: "center" });

  const insideItems = [
    "10 Curiosity Hooks - Create an irresistible urge to click \"see more\"",
    "10 Story Hooks - Open with vulnerability and human connection",
    "10 Contrarian Hooks - Challenge conventional wisdom to spark debate",
    "10 Question Hooks - Turn passive scrollers into active thinkers",
    "10 Data Hooks - Lead with surprising numbers for instant credibility",
  ];

  let iy = 405;
  insideItems.forEach((item) => {
    // Checkmark
    doc.fontSize(10).fillColor(CYAN).font("Helvetica-Bold")
      .text("\u2713", ml + 80, iy, { width: 14 });
    // Text
    doc.fontSize(10).fillColor(SLATE_400).font("Helvetica")
      .text(item, ml + 98, iy, { width: pw - ml * 2 - 118 });
    iy += 22;
  });

  // Bottom: URL + tagline
  doc.fontSize(11).fillColor(CYAN).font("Helvetica-Bold")
    .text("linkedgrow.ai", ml, 720, { width: pw - ml * 2, align: "center", link: "https://linkedgrow.ai" });
  doc.fontSize(8).fillColor(SLATE_400).font("Helvetica")
    .text("AI-Powered LinkedIn Content Platform", ml, 738, { width: pw - ml * 2, align: "center" });

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 2: How to Use This Guide
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage({ margins: { top: 50, bottom: 40, left: 55, right: 55 } });
  const pageWidth = getPageWidth();

  let y = 60;

  // Header bar (drawn as shapes, doesn't move cursor)
  doc.save();
  doc.rect(doc.page.margins.left, 40, pageWidth / 2, 4).fill(CYAN);
  doc.rect(doc.page.margins.left + pageWidth / 2, 40, pageWidth / 2, 4).fill(BLUE);
  doc.restore();

  doc.fontSize(26).fillColor(DARK).font("Helvetica-Bold")
    .text("How to Use This Swipe File", doc.page.margins.left, y, { width: pageWidth });

  y = 100;

  const tips = [
    { title: "Don't copy word for word", desc: "Use these hooks as templates. Swap in your own numbers, stories, and context to make them authentic to your voice." },
    { title: "Test different categories", desc: "Some audiences respond better to stories, others to data. Try hooks from all 5 categories and track what works best for you." },
    { title: "Adapt the hook to your topic", desc: "A curiosity hook about LinkedIn growth can be rewritten for sales, marketing, recruiting, or any niche. The structure is what matters." },
    { title: "Keep your hook under 200 characters", desc: "LinkedIn shows approximately the first 210 characters before the \"see more\" button. Your hook must hook before that cutoff." },
    { title: "Always deliver on the promise", desc: "A great hook paired with weak content will hurt your credibility. Make sure your post follows through on what the first line promises." },
  ];

  tips.forEach((tip, i) => {
    // Number circle
    roundedRect(doc.page.margins.left, y, 28, 28, 14, CYAN);
    doc.fontSize(13).fillColor(WHITE).font("Helvetica-Bold")
      .text(`${i + 1}`, doc.page.margins.left, y + 7, { width: 28, align: "center" });

    // Title
    doc.fontSize(13).fillColor(DARK).font("Helvetica-Bold")
      .text(tip.title, doc.page.margins.left + 40, y + 3, { width: pageWidth - 40 });

    // Description
    doc.fontSize(10.5).fillColor(SLATE_600).font("Helvetica")
      .text(tip.desc, doc.page.margins.left + 40, doc.y + 3, { width: pageWidth - 40, lineGap: 1 });

    y = doc.y + 18;
  });

  // Pro tip box
  y = doc.y + 12;
  roundedRect(doc.page.margins.left, y, pageWidth, 70, 8, "#ecfeff");
  doc.rect(doc.page.margins.left, y, 4, 70).fill(CYAN);

  doc.fontSize(10).fillColor(CYAN).font("Helvetica-Bold")
    .text("PRO TIP", doc.page.margins.left + 18, y + 12, { width: pageWidth - 36 });
  doc.fontSize(10).fillColor(SLATE_600).font("Helvetica")
    .text(
      "The best hooks in 2026 don't sound like hooks - they sound like the first line of a conversation you actually want to have. Be human, be specific, and create tension.",
      doc.page.margins.left + 18, doc.y + 3, { width: pageWidth - 36, lineGap: 1 }
    );

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGES 3-7: Hook Categories (one page per category)
  // ═══════════════════════════════════════════════════════════════════════════

  categories.forEach((cat, catIdx) => {
    doc.addPage({ margins: { top: 50, bottom: 40, left: 55, right: 55 } });
    const pw2 = getPageWidth();

    // Category color bar (shape, doesn't affect text cursor)
    doc.save();
    doc.rect(doc.page.margins.left, 40, pw2, 4).fill(cat.color);
    doc.restore();

    let y = 58;

    // Category label
    doc.fontSize(10).fillColor(cat.color).font("Helvetica-Bold")
      .text(`CATEGORY ${catIdx + 1}`, doc.page.margins.left, y);

    y = doc.y + 2;

    doc.fontSize(26).fillColor(DARK).font("Helvetica-Bold")
      .text(cat.name, doc.page.margins.left, y, { width: pw2 });

    y = doc.y + 2;

    doc.fontSize(11).fillColor(SLATE_600).font("Helvetica")
      .text(cat.description, doc.page.margins.left, y, { width: pw2 });

    y = doc.y + 16;

    // Hooks list
    cat.hooks.forEach((hook, hookIdx) => {
      const globalNum = catIdx * 10 + hookIdx + 1;
      const numStr = String(globalNum).padStart(2, "0");

      const cardX = doc.page.margins.left;
      const cardW = pw2;

      // Measure text height
      const textH = doc.heightOfString(`"${hook}"`, {
        width: cardW - 65,
        font: "Helvetica",
        fontSize: 12,
      });
      const cardH = Math.max(textH + 20, 42);

      // Alternating background
      if (hookIdx % 2 === 0) {
        roundedRect(cardX, y - 2, cardW, cardH, 5, "#f8fafc");
      }

      // Number
      doc.fontSize(15).fillColor(cat.color).font("Helvetica-Bold")
        .text(numStr, cardX + 10, y + 6, { width: 28 });

      // Hook text
      doc.fontSize(12).fillColor(DARK).font("Helvetica")
        .text(`"${hook}"`, cardX + 48, y + 7, { width: cardW - 65, lineGap: 1 });

      y += cardH + 4;
    });

    // Quick tip box at bottom
    const tipY = doc.page.height - 105;
    roundedRect(doc.page.margins.left, tipY, pw2, 50, 8, "#f8fafc");
    doc.rect(doc.page.margins.left, tipY, 4, 50).fill(cat.color);

    doc.fontSize(9).fillColor(cat.color).font("Helvetica-Bold")
      .text("QUICK TIP", doc.page.margins.left + 16, tipY + 8, { width: pw2 - 32 });
    doc.fontSize(9).fillColor(SLATE_600).font("Helvetica")
      .text(cat.tip, doc.page.margins.left + 16, doc.y + 2, { width: pw2 - 32, lineGap: 1 });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LAST PAGE: CTA
  // ═══════════════════════════════════════════════════════════════════════════

  doc.addPage({ margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  const pw3 = 595.28;
  const ml3 = 55;

  // Dark background
  doc.rect(0, 0, pw3, 841.89).fill(DARK);

  // Gradient bar
  doc.rect(0, 0, pw3 / 2, 5).fill(CYAN);
  doc.rect(pw3 / 2, 0, pw3 / 2, 5).fill(BLUE);

  // Logo (icon + text)
  drawLogo(pw3 / 2, 80, 34);

  // Heading
  doc.fontSize(30).fillColor(WHITE).font("Helvetica-Bold")
    .text("Ready to Create", ml3, 180, { width: pw3 - ml3 * 2, align: "center" });
  doc.fontSize(30).fillColor(CYAN).font("Helvetica-Bold")
    .text("Viral LinkedIn Posts?", ml3, 220, { width: pw3 - ml3 * 2, align: "center" });

  // Subtitle
  doc.fontSize(13).fillColor(SLATE_400).font("Helvetica")
    .text("LinkedGrow uses AI to write posts in your voice, schedule at", ml3, 280, {
      width: pw3 - ml3 * 2, align: "center",
    });
  doc.text("the best times, and costs 96% less than competitors.", ml3, 298, {
    width: pw3 - ml3 * 2, align: "center",
  });

  // Feature list
  const features = [
    "AI writes in YOUR voice - not generic robot content",
    "Bring Your Own Key - use your favorite AI provider",
    "Smart scheduling at peak engagement times",
    "Drag-and-drop carousel creator for visual posts",
    "Content calendar, analytics, and more",
  ];

  let fy = 340;
  features.forEach((feat) => {
    doc.fontSize(11).fillColor(CYAN).font("Helvetica-Bold")
      .text("\u2713", ml3 + 100, fy, { width: 14 });
    doc.fontSize(11).fillColor(SLATE_200).font("Helvetica")
      .text(feat, ml3 + 118, fy, { width: pw3 - ml3 * 2 - 138 });
    fy += 22;
  });

  // CTA button
  const ctaY = fy + 25;
  const ctaW = 280;
  const ctaX = pw3 / 2 - ctaW / 2;
  roundedRect(ctaX, ctaY, ctaW, 44, 12, CYAN);
  doc.fontSize(15).fillColor(WHITE).font("Helvetica-Bold")
    .text("Start Free at linkedgrow.ai", ctaX, ctaY + 14, {
      width: ctaW, align: "center", link: "https://linkedgrow.ai/sign-up",
    });

  doc.fontSize(9).fillColor(SLATE_400).font("Helvetica")
    .text("No credit card required - Free plan available", ml3, ctaY + 56, {
      width: pw3 - ml3 * 2, align: "center",
    });

  // Divider
  const divY = ctaY + 100;
  doc.moveTo(pw3 / 2 - 25, divY).lineTo(pw3 / 2 + 25, divY)
    .strokeColor(SLATE_400).lineWidth(1).opacity(0.3).stroke();
  doc.opacity(1);

  // Newsletter reminder
  doc.fontSize(11).fillColor(SLATE_200).font("Helvetica-Bold")
    .text("Want more tips like these?", ml3, divY + 18, {
      width: pw3 - ml3 * 2, align: "center",
    });
  doc.fontSize(10).fillColor(SLATE_400).font("Helvetica")
    .text("We publish new LinkedIn growth articles every Monday and", ml3, divY + 38, {
      width: pw3 - ml3 * 2, align: "center",
    });
  doc.text("Friday. You'll get notified as soon as a new post goes live.", ml3, divY + 54, {
    width: pw3 - ml3 * 2, align: "center",
  });

  // Copyright
  doc.fontSize(8).fillColor(SLATE_400).font("Helvetica")
    .text("\u00a9 2026 LinkedGrow. All rights reserved.", ml3, 740, {
      width: pw3 - ml3 * 2, align: "center",
    });
  doc.text("linkedgrow.ai - AI-Powered LinkedIn Content Platform", ml3, 754, {
    width: pw3 - ml3 * 2, align: "center",
  });

  // Finalize
  doc.end();

  stream.on("finish", () => {
    console.log(`PDF generated at: ${OUTPUT_PATH}`);
    const stats = fs.statSync(OUTPUT_PATH);
    console.log(`File size: ${(stats.size / 1024).toFixed(1)} KB`);
  });
}

createPDF();
