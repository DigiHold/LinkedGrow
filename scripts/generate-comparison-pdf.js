#!/usr/bin/env node
/**
 * Generate LinkedGrow comparison table PDF for Dealify.
 * Usage: node scripts/generate-comparison-pdf.js [LTD_PRICE]
 */

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const LTD_PRICE = process.argv[2] || "69";

// Brand colors
const CYAN = "#06b6d4";
const CYAN_LIGHT = "#ecfeff";
const DARK = "#0f172a";
const SLATE_700 = "#334155";
const SLATE_600 = "#475569";
const SLATE_400 = "#94a3b8";
const SLATE_200 = "#e2e8f0";
const SLATE_50 = "#f8fafc";
const EMERALD = "#10b981";
const WHITE = "#ffffff";

const OUTPUT_PATH = path.join(
  process.env.HOME,
  "Downloads",
  "linkedgrow-vs-competitors.pdf"
);

const FEATURES = [
  { label: "AI post generation", lg: "Unlimited (BYOK)", taplio: "250 credits/mo", au: "None", sg: "200/mo" },
  { label: "AI models available", lg: "26 across 6 providers", taplio: "2 (OpenAI only)", au: "0", sg: "3" },
  { label: "AI image generation", lg: "14 models (BYOK)", taplio: "None", au: "None", sg: "Basic" },
  { label: "Voice training", lg: true, taplio: true, au: false, sg: true },
  { label: "Carousel generator", lg: true, taplio: false, au: false, sg: false },
  { label: "Hooks generator", lg: true, taplio: false, au: "Templates", sg: false },
  { label: "Scheduling", lg: "Unlimited", taplio: "Unlimited", au: "Business only", sg: "Limited" },
  { label: "Content calendar", lg: true, taplio: true, au: false, sg: true },
  { label: "A/B testing", lg: true, taplio: false, au: false, sg: false },
  { label: "Team collaboration", lg: true, taplio: "$55/mo extra", au: "$14.95/seat", sg: false },
  { label: "REST API access", lg: true, taplio: false, au: false, sg: false },
  { label: "Analytics dashboard", lg: true, taplio: true, au: false, sg: "Basic" },
  { label: "Content repurposing", lg: true, taplio: "Limited", au: false, sg: false },
  { label: "Algorithm optimizer", lg: true, taplio: false, au: false, sg: false },
];

const COSTS = [
  { label: "LinkedGrow LTD (Dealify)", plan: "Business plan for life", monthly: "$0 after buying", total: `$${LTD_PRICE} once`, highlight: true },
  { label: "Taplio", plan: "Pro (unlimited AI)", monthly: "$199/mo", total: "$4,776" },
  { label: "Taplio", plan: "Standard (250 credits)", monthly: "$69/mo", total: "$1,656" },
  { label: "AuthoredUp", plan: "Power (no AI)", monthly: "$27/mo annual", total: "$648" },
  { label: "Supergrow", plan: "Pro", monthly: "$39/mo", total: "$936" },
  { label: "LinkedGrow monthly", plan: "Business subscription", monthly: "$79/mo", total: "$1,896" },
];

const doc = new PDFDocument({
  size: "A4",
  margin: 0,
  info: { Title: "LinkedGrow vs Competitors", Author: "LinkedGrow" },
});

doc.pipe(fs.createWriteStream(OUTPUT_PATH));

const PAGE_W = doc.page.width;
const PAGE_H = doc.page.height;
const MARGIN = 36;
const CONTENT_W = PAGE_W - MARGIN * 2;

function checkmark(x, y) {
  doc.save();
  doc.circle(x, y, 5).fill(EMERALD);
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(7).text("Y", x - 2.3, y - 3.2, { lineBreak: false });
  doc.restore();
}
function crossmark(x, y) {
  doc.save();
  doc.circle(x, y, 5).fill(SLATE_200);
  doc.fillColor(SLATE_600).font("Helvetica-Bold").fontSize(9).text("-", x - 1.5, y - 4, { lineBreak: false });
  doc.restore();
}

// Header bar
doc.rect(0, 0, PAGE_W, 70).fill(DARK);
doc.rect(0, 70, PAGE_W, 3).fill(CYAN);
doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(20).text("LinkedGrow", MARGIN, 24, { continued: true, lineBreak: false });
doc.fillColor(CYAN).text(" vs Competitors", { lineBreak: false });
doc.fillColor(SLATE_400).font("Helvetica").fontSize(9).text("AI-powered LinkedIn content platform with BYOK pricing", MARGIN, 50, { lineBreak: false });

let y = 100;

// Feature section
doc.fillColor(DARK).font("Helvetica-Bold").fontSize(13).text("Feature comparison", MARGIN, y, { lineBreak: false });
y += 20;

const col1W = 160;
const dataCols = 4;
const colW = (CONTENT_W - col1W) / dataCols;
const colX = [MARGIN, MARGIN + col1W, MARGIN + col1W + colW, MARGIN + col1W + colW * 2, MARGIN + col1W + colW * 3];

const featTableTop = y;
const headerH = 32;
doc.rect(MARGIN, y, CONTENT_W, headerH).fill(DARK);
doc.rect(colX[1], y, colW, headerH).fill(CYAN);

const headers = ["Feature", "LinkedGrow", "Taplio", "AuthoredUp", "Supergrow"];
const subHeaders = ["", "Business LTD", "Standard", "Power", "Pro"];

doc.font("Helvetica-Bold").fontSize(9);
headers.forEach((h, i) => {
  const x = colX[i];
  const w = i === 0 ? col1W : colW;
  doc.fillColor(WHITE).text(h, x + 6, y + 6, { width: w - 12, align: i === 0 ? "left" : "center", lineBreak: false });
});
doc.font("Helvetica").fontSize(7.5);
subHeaders.forEach((s, i) => {
  if (!s) return;
  const x = colX[i];
  const w = i === 0 ? col1W : colW;
  doc.fillColor(i === 1 ? WHITE : SLATE_400).text(s, x + 6, y + 20, { width: w - 12, align: "center", lineBreak: false });
});
y += headerH;

const rowH = 20;
FEATURES.forEach((f, idx) => {
  if (idx % 2 === 0) doc.rect(MARGIN, y, CONTENT_W, rowH).fill(SLATE_50);
  doc.rect(colX[1], y, colW, rowH).fill(CYAN_LIGHT);

  doc.fillColor(SLATE_700).font("Helvetica").fontSize(8).text(f.label, colX[0] + 8, y + 7, { width: col1W - 16, lineBreak: false });

  const vals = [f.lg, f.taplio, f.au, f.sg];
  vals.forEach((v, i) => {
    const cx = colX[i + 1] + colW / 2;
    const cy = y + rowH / 2;
    if (v === true) checkmark(cx, cy);
    else if (v === false) crossmark(cx, cy);
    else {
      const isLg = i === 0;
      doc.fillColor(isLg ? DARK : SLATE_600).font(isLg ? "Helvetica-Bold" : "Helvetica").fontSize(7.5).text(String(v), colX[i + 1] + 4, cy - 4, { width: colW - 8, align: "center", lineBreak: false });
    }
  });
  y += rowH;
});
doc.lineWidth(0.5).rect(MARGIN, featTableTop, CONTENT_W, y - featTableTop).stroke(SLATE_200);

y += 18;

// Cost section
doc.fillColor(DARK).font("Helvetica-Bold").fontSize(13).text("Cost comparison over 2 years", MARGIN, y, { lineBreak: false });
y += 20;

const cc = [165, 175, 85, CONTENT_W - 165 - 175 - 85];
const ccX = [MARGIN, MARGIN + cc[0], MARGIN + cc[0] + cc[1], MARGIN + cc[0] + cc[1] + cc[2]];

const costTop = y;
const costHeaderH = 26;
doc.rect(MARGIN, y, CONTENT_W, costHeaderH).fill(DARK);
doc.font("Helvetica-Bold").fontSize(9).fillColor(WHITE);
["Tool", "Plan needed", "Monthly", "2-year total"].forEach((h, i) => {
  doc.text(h, ccX[i] + 8, y + 9, { width: cc[i] - 16, align: i === 3 ? "right" : "left", lineBreak: false });
});
y += costHeaderH;

const costRowH = 24;
COSTS.forEach((c, idx) => {
  if (c.highlight) {
    doc.rect(MARGIN, y, CONTENT_W, costRowH).fill(CYAN_LIGHT);
    doc.rect(MARGIN, y, 4, costRowH).fill(CYAN);
  } else if (idx % 2 === 1) {
    doc.rect(MARGIN, y, CONTENT_W, costRowH).fill(SLATE_50);
  }
  doc.fillColor(c.highlight ? DARK : SLATE_700).font(c.highlight ? "Helvetica-Bold" : "Helvetica").fontSize(9).text(c.label, ccX[0] + 8, y + 8, { width: cc[0] - 16, lineBreak: false });
  doc.fillColor(SLATE_600).font("Helvetica").fontSize(9).text(c.plan, ccX[1] + 8, y + 8, { width: cc[1] - 16, lineBreak: false });
  doc.fillColor(SLATE_600).text(c.monthly, ccX[2] + 8, y + 8, { width: cc[2] - 16, lineBreak: false });
  doc.fillColor(c.highlight ? CYAN : DARK).font("Helvetica-Bold").fontSize(c.highlight ? 12 : 10).text(c.total, ccX[3] + 8, y + (c.highlight ? 6 : 7), { width: cc[3] - 16, align: "right", lineBreak: false });
  y += costRowH;
});
doc.lineWidth(0.5).rect(MARGIN, costTop, CONTENT_W, y - costTop).stroke(SLATE_200);

y += 14;

// BYOK note
const noteH = 44;
doc.rect(MARGIN, y, CONTENT_W, noteH).fill(SLATE_50);
doc.rect(MARGIN, y, 3, noteH).fill(CYAN);
doc.fillColor(CYAN).font("Helvetica-Bold").fontSize(9).text("Plus for LinkedGrow LTD holders", MARGIN + 12, y + 9, { lineBreak: false });
doc.fillColor(SLATE_700).font("Helvetica").fontSize(8.5).text(
  "Around $2 to $4 per month in AI API costs paid directly to OpenAI, Anthropic, or Google (BYOK model). Every other tool above marks up AI usage inside the subscription price.",
  MARGIN + 12,
  y + 22,
  { width: CONTENT_W - 24 }
);
y += noteH;

// Footer
doc.fillColor(SLATE_400).font("Helvetica").fontSize(7).text(
  "Pricing accurate as of April 2026. Sources: taplio.com/pricing, authoredup.com/pricing, supergrow.com/pricing.",
  MARGIN,
  PAGE_H - 34,
  { width: CONTENT_W, align: "center", lineBreak: false }
);
doc.fillColor(CYAN).font("Helvetica-Bold").fontSize(9).text("linkedgrow.ai", MARGIN, PAGE_H - 20, { width: CONTENT_W, align: "center", lineBreak: false });

doc.end();
console.log(`Wrote ${OUTPUT_PATH}`);
