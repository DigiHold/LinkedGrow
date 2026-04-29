#!/usr/bin/env node
/* eslint-disable */
// Weekly GSC analysis: pulls last 7 days of Search Console data and outputs
// a prioritized fix list as a markdown report.
//
// Run: node scripts/gsc/weekly.js [--days N] [--site sc-domain:linkedgrow.ai]
//
// Outputs: scripts/gsc/reports/YYYY-MM-DD.md (gitignored)
//
// Three priority buckets:
//   1. AI OVERVIEW STEAL: position 1-5 with high impressions but zero clicks.
//      AI Overviews are likely eating the click. Fix: improve QuickAnswer +
//      question H2s + ensure FAQ schema is present.
//   2. CLOSE TO RANK: position 8-25 with > 30 impressions. One internal-link
//      pass + title rewrite can move these to page 1.
//   3. ZOMBIE: position 50+ with < 5 impressions. Ignore unless they're real
//      content pages worth resurrecting.

const fs = require("fs");
const path = require("path");
const os = require("os");

const HOME = os.homedir();
const TOKEN_PATH = path.join(HOME, ".claude", "linkedgrow-gsc-token.json");
const REPORT_DIR = path.join(__dirname, "reports");

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const i = args.indexOf(name);
  if (i < 0) return fallback;
  return args[i + 1];
}

const DAYS = parseInt(getArg("--days", "7"), 10);
const SITE = getArg("--site", "sc-domain:linkedgrow.ai");

if (!fs.existsSync(TOKEN_PATH)) {
  console.error(
    `ERROR: Refresh token not found at ${TOKEN_PATH}. Run scripts/gsc/auth.js first.`
  );
  process.exit(1);
}

const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));

async function getAccessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: tokenData.client_id,
      client_secret: tokenData.client_secret,
      refresh_token: tokenData.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${body}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function gscRequest(accessToken, body) {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`GSC API ${res.status}: ${errBody}`);
  }
  return res.json();
}

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function classifyRow(row) {
  const { clicks, impressions, position } = row;
  // Skip /docs/* - documentation pages aren't conversion targets
  const page = row.keys[0] || "";
  if (page.includes("/docs/")) return "docs";

  if (position <= 5 && impressions >= 10 && clicks === 0) return "ai-overview-steal";
  if (position >= 6 && position <= 25 && impressions >= 10) return "close-to-rank";
  if (position >= 50 && impressions < 5) return "zombie";
  return "other";
}

(async () => {
  console.log(`Fetching last ${DAYS} days of GSC data for ${SITE}...`);
  const accessToken = await getAccessToken();

  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - DAYS + 1);

  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  // Pull data by page+query so we can classify
  const byPageQuery = await gscRequest(accessToken, {
    startDate: startStr,
    endDate: endStr,
    dimensions: ["page", "query"],
    rowLimit: 5000,
  });

  // Pull aggregate by page
  const byPage = await gscRequest(accessToken, {
    startDate: startStr,
    endDate: endStr,
    dimensions: ["page"],
    rowLimit: 1000,
  });

  // Pull aggregate by query
  const byQuery = await gscRequest(accessToken, {
    startDate: startStr,
    endDate: endStr,
    dimensions: ["query"],
    rowLimit: 1000,
  });

  const rows = byPageQuery.rows || [];
  const buckets = {
    "ai-overview-steal": [],
    "close-to-rank": [],
    zombie: [],
    docs: [],
  };

  for (const row of rows) {
    const [page, query] = row.keys;
    const cls = classifyRow(row);
    if (buckets[cls]) {
      buckets[cls].push({ page, query, ...row });
    }
  }

  // Sort each bucket
  buckets["ai-overview-steal"].sort((a, b) => b.impressions - a.impressions);
  buckets["close-to-rank"].sort((a, b) => b.impressions - a.impressions);

  // Aggregate stats
  const totalClicks = (byPage.rows || []).reduce((s, r) => s + r.clicks, 0);
  const totalImps = (byPage.rows || []).reduce((s, r) => s + r.impressions, 0);
  const indexedPages = new Set((byPage.rows || []).map((r) => r.keys[0])).size;

  // Top pages (excluding /docs/* — docs aren't conversion targets)
  const topPages = (byPage.rows || [])
    .filter((r) => !r.keys[0].includes("/docs/"))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 20);

  // Top queries
  const topQueries = (byQuery.rows || []).sort(
    (a, b) => b.impressions - a.impressions
  ).slice(0, 30);

  // Build markdown report
  const lines = [];
  lines.push(`# GSC Weekly Report — ${startStr} to ${endStr}`);
  lines.push("");
  lines.push(`Site: \`${SITE}\``);
  lines.push("");
  lines.push("## Snapshot");
  lines.push("");
  lines.push(`- **Total clicks**: ${totalClicks}`);
  lines.push(`- **Total impressions**: ${totalImps.toLocaleString()}`);
  lines.push(`- **Pages with at least 1 impression**: ${indexedPages}`);
  lines.push(
    `- **Site CTR**: ${totalImps ? ((totalClicks / totalImps) * 100).toFixed(2) : "0.00"}%`
  );
  lines.push("");

  // Bucket 1: AI Overview Steal
  lines.push("## 1. AI Overview Steal (Fix First)");
  lines.push("");
  lines.push(
    `Position 1-5 with at least 20 impressions and zero clicks. AI Overviews are likely eating the traffic. Fix: tighten QuickAnswer block to match the query exactly, ensure FAQ schema is present, and convert nearby H2s to question form.`
  );
  lines.push("");
  if (buckets["ai-overview-steal"].length === 0) {
    lines.push("_No pages match this bucket. Either AI Overviews are not eating your traffic yet, or you don't yet have positions 1-5 with high impressions._");
  } else {
    lines.push("| Page | Query | Impressions | Position |");
    lines.push("|---|---|---|---|");
    for (const r of buckets["ai-overview-steal"].slice(0, 25)) {
      const pageShort = r.page.replace("https://linkedgrow.ai", "");
      lines.push(`| \`${pageShort}\` | ${r.query} | ${r.impressions} | ${r.position.toFixed(1)} |`);
    }
  }
  lines.push("");

  // Bucket 2: Close to rank
  lines.push("## 2. Close to Rank (Highest Leverage)");
  lines.push("");
  lines.push(
    `Position 8-25 with at least 30 impressions. One internal-link pass + title rewrite can move these to page 1. Add 3-5 internal links from your highest-traffic pages, rewrite title to a CTR pattern (year + parenthetical signal).`
  );
  lines.push("");
  if (buckets["close-to-rank"].length === 0) {
    lines.push("_No pages match this bucket._");
  } else {
    lines.push("| Page | Query | Impressions | Position |");
    lines.push("|---|---|---|---|");
    for (const r of buckets["close-to-rank"].slice(0, 30)) {
      const pageShort = r.page.replace("https://linkedgrow.ai", "");
      lines.push(`| \`${pageShort}\` | ${r.query} | ${r.impressions} | ${r.position.toFixed(1)} |`);
    }
  }
  lines.push("");

  // Top pages reference
  lines.push("## Top Pages (Reference)");
  lines.push("");
  lines.push("| Page | Clicks | Impressions | CTR | Position |");
  lines.push("|---|---|---|---|---|");
  for (const r of topPages) {
    const pageShort = r.keys[0].replace("https://linkedgrow.ai", "");
    const ctr = r.impressions ? ((r.clicks / r.impressions) * 100).toFixed(2) : "0";
    lines.push(`| \`${pageShort}\` | ${r.clicks} | ${r.impressions} | ${ctr}% | ${r.position.toFixed(1)} |`);
  }
  lines.push("");

  // Top queries reference
  lines.push("## Top Queries (Reference)");
  lines.push("");
  lines.push("| Query | Clicks | Impressions | CTR | Position |");
  lines.push("|---|---|---|---|---|");
  for (const r of topQueries) {
    const ctr = r.impressions ? ((r.clicks / r.impressions) * 100).toFixed(2) : "0";
    lines.push(`| ${r.keys[0]} | ${r.clicks} | ${r.impressions} | ${ctr}% | ${r.position.toFixed(1)} |`);
  }
  lines.push("");

  // Quick action plan
  lines.push("## Recommended Actions This Week");
  lines.push("");
  let actionNum = 1;
  if (buckets["ai-overview-steal"].length > 0) {
    lines.push(
      `${actionNum++}. Fix the top 3 AI-Overview-Steal pages first. These are positioned to rank but losing the click to Google's answer card.`
    );
  }
  if (buckets["close-to-rank"].length > 0) {
    lines.push(
      `${actionNum++}. Pick the 5 highest-impression Close-to-Rank pages. Add 3 internal links from the homepage and from your highest-traffic blog post to each. Rewrite titles to CTR pattern if not done already.`
    );
  }
  lines.push(
    `${actionNum++}. Compare this week's impressions and clicks to last week's report. If impressions are up but clicks are flat, AI Overviews are growing and AEO matters more than rankings.`
  );
  lines.push("");

  // Save
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  const filename = `${endStr}.md`;
  const filepath = path.join(REPORT_DIR, filename);
  fs.writeFileSync(filepath, lines.join("\n"));
  console.log(`Report written: ${filepath}`);
  console.log("");
  console.log(`Summary:`);
  console.log(`  Clicks: ${totalClicks}`);
  console.log(`  Impressions: ${totalImps.toLocaleString()}`);
  console.log(`  AI-Overview-Steal candidates: ${buckets["ai-overview-steal"].length}`);
  console.log(`  Close-to-rank candidates: ${buckets["close-to-rank"].length}`);
})();
