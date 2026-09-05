import "dotenv/config";
import { db } from "../db.ts";
import { decryptSecret } from "../crypto.ts";
import { openSession, closeSession, isSignedIn } from "../browser/driver.ts";

/** Prints the raw text of each row in a reactions dialog, line by line. */
async function account(accountId: string) {
  const { rows } = await db().execute({
    sql: `SELECT l.country, p.host, p.port, p.username_encrypted, p.password_encrypted, p.last_exit_ip
            FROM linkedin_accounts l
            LEFT JOIN proxy_allocations p ON p.linkedin_account_id = l.id AND p.status = 'active'
           WHERE l.id = ? LIMIT 1`,
    args: [accountId],
  });
  const row = rows[0];
  if (!row?.host) throw new Error("no active address");
  return {
    country: String(row.country ?? "FR"),
    allocation: {
      server: `http://${String(row.host)}:${Number(row.port)}`,
      username: decryptSecret(String(row.username_encrypted ?? "")) ?? "",
      password: decryptSecret(String(row.password_encrypted ?? "")) ?? "",
      expectedIp: String(row.last_exit_ip ?? ""),
    },
  };
}

const accountId = process.argv[2]!;
const url = process.argv[3]!;
const acct = await account(accountId);
const session = await openSession(
  { linkedinAccountId: accountId, country: acct.country, timezone: "Europe/Paris" },
  acct.allocation
);
try {
  if (!(await isSignedIn(session.context))) throw new Error("signed out");
  const page = session.context.pages()[0] ?? (await session.context.newPage());
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForTimeout(10_000);
  const btn = page.locator("button[data-reaction-details]").first();
  if ((await btn.count()) === 0) throw new Error("no reaction button on this page");
  await btn.click();
  await page.waitForTimeout(9_000);
  const rows = (await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return ["NO DIALOG"];
    return Array.from(dialog.querySelectorAll('a[href*="/in/"]'))
      .slice(0, 6)
      .map((a) => {
        const card = a.closest("li") ?? a.parentElement ?? a;
        return (
          "ARIA=" + (a.getAttribute("aria-label") || "-") +
          " || LINES=" + JSON.stringify(((card as HTMLElement).innerText || "").split("\n").map((l) => l.trim()).filter(Boolean))
        );
      });
  })) as string[];
  for (const r of rows) console.log("ROW " + r);
} finally {
  await closeSession(session);
}
