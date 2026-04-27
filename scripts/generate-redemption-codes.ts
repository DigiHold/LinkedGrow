// Generate a batch of marketplace redemption codes + write a CSV to disk.
//
// Usage:
//   npx tsx scripts/generate-redemption-codes.ts --source dealify --count 2000 --batch dealify-2026-04
//   npx tsx scripts/generate-redemption-codes.ts --source dealmirror --count 2000 --batch dealmirror-2026-04
//   npx tsx scripts/generate-redemption-codes.ts --source dealfuel --count 2000 --batch dealfuel-2026-04
//
// Requires TURSO_DATABASE_URL + TURSO_AUTH_TOKEN in .env.local.

import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { generateBatch, type RedemptionSource } from "../src/lib/redemption-codes";

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        out[key] = next;
        i++;
      } else {
        out[key] = "true";
      }
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const source = args.source as RedemptionSource | undefined;
  const count = args.count ? parseInt(args.count, 10) : 0;
  const batch = args.batch;

  if (!source || (source !== "dealify" && source !== "dealmirror" && source !== "dealfuel")) {
    console.error("--source must be 'dealify', 'dealmirror' or 'dealfuel'");
    process.exit(1);
  }
  if (!count || count < 1 || count > 100000) {
    console.error("--count must be a number between 1 and 100000");
    process.exit(1);
  }
  if (!batch || !/^[a-z0-9-]+$/.test(batch)) {
    console.error("--batch is required, lowercase letters/numbers/dashes only (e.g. dealify-2026-04)");
    process.exit(1);
  }

  console.log(`Generating ${count} ${source} codes in batch '${batch}'...`);
  const start = Date.now();
  const codes = await generateBatch(source, count, batch);

  const outDir = path.join(process.cwd(), "redemption-codes-out");
  fs.mkdirSync(outDir, { recursive: true });
  const csvPath = path.join(outDir, `${batch}.csv`);
  fs.writeFileSync(csvPath, codes.join("\n") + "\n", "utf8");

  const ms = Date.now() - start;
  console.log(`Done in ${ms}ms`);
  console.log(`Wrote ${codes.length} codes to ${csvPath}`);
  console.log(`Sample: ${codes.slice(0, 3).join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
