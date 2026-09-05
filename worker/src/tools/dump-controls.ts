import "dotenv/config";
import { db } from "../db.ts";
import { decryptSecret } from "../crypto.ts";
import { openSession, closeSession, isSignedIn } from "../browser/driver.ts";

/**
 * What every control on a LinkedIn page is actually called, in the DOM.
 *
 * Written the day an image could not be attached on a French account. The
 * selectors in publish.ts, actions.ts and miner.ts were keyed on the English
 * accessible name, so an account served in any other language matched nothing
 * and the product refused to act, with an error blaming LinkedIn. Rewriting
 * them needs the real attributes rather than a guess, and this prints them.
 *
 * For each page it lists every interactive element with the icon name that
 * LinkedIn puts on the svg, which is the same string in every language, next
 * to the accessible name, which is not.
 *
 * The worker must be stopped first: one profile, one browser.
 *
 *   node --experimental-strip-types src/tools/dump-controls.ts <accountId> [url ...]
 */

async function account(accountId: string) {
  const { rows } = await db().execute({
    sql: `SELECT l.id, l.country, l.profile_url,
                 p.host, p.port, p.username_encrypted, p.password_encrypted, p.last_exit_ip
            FROM linkedin_accounts l
            LEFT JOIN proxy_allocations p
              ON p.linkedin_account_id = l.id AND p.status = 'active'
           WHERE l.id = ? LIMIT 1`,
    args: [accountId],
  });
  const row = rows[0];
  if (!row) throw new Error(`No account ${accountId}`);
  if (!row.host) throw new Error("That account has no active address bound to it.");
  return {
    country: String(row.country ?? "FR"),
    profileUrl: row.profile_url ? String(row.profile_url) : null,
    allocation: {
      server: `http://${String(row.host)}:${Number(row.port)}`,
      username: decryptSecret(String(row.username_encrypted ?? "")) ?? "",
      password: decryptSecret(String(row.password_encrypted ?? "")) ?? "",
      expectedIp: String(row.last_exit_ip ?? ""),
    },
  };
}

type Control = {
  tag: string;
  role: string;
  icon: string;
  label: string;
  text: string;
  attrs: string;
};

const READ_CONTROLS = () => {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>(
      'button, a[href], [role="button"], [role="menuitem"], [role="link"], [role="tab"], summary'
    )
  );
  const out: Control[] = [];
  for (const el of nodes) {
    const box = el.getBoundingClientRect();
    if (box.width === 0 && box.height === 0) continue;
    const svg = el.querySelector("svg[id], svg[data-test-icon]");
    const interesting = ["type", "data-view-name", "data-control-name", "data-test-id", "name"];
    out.push({
      tag: el.tagName.toLowerCase(),
      role: el.getAttribute("role") || "",
      icon: svg ? svg.getAttribute("data-test-icon") || svg.getAttribute("id") || "" : "",
      label: el.getAttribute("aria-label") || "",
      text: (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 40),
      attrs: interesting
        .map((a) => (el.getAttribute(a) ? `${a}=${el.getAttribute(a)}` : ""))
        .filter(Boolean)
        .join(" "),
    });
  }
  return out;
};

async function main(): Promise<void> {
  const accountId = process.argv[2];
  if (!accountId) throw new Error("Which account?");
  const acct = await account(accountId);

  const pages =
    process.argv.length > 3
      ? process.argv.slice(3)
      : [
          "https://www.linkedin.com/feed/",
          acct.profileUrl ?? "https://www.linkedin.com/in/me/",
          "https://www.linkedin.com/mynetwork/",
          "https://www.linkedin.com/mynetwork/invitation-manager/sent/",
          "https://www.linkedin.com/messaging/",
          "https://www.linkedin.com/company/onetrust/posts/",
          "https://www.linkedin.com/search/results/people/?keywords=founder",
        ];

  const session = await openSession(
    { linkedinAccountId: accountId, country: acct.country, timezone: "Europe/Paris" },
    acct.allocation
  );
  try {
    if (!(await isSignedIn(session.context))) throw new Error("Signed out, nothing to read.");
    const page = session.context.pages()[0] ?? (await session.context.newPage());
    for (const url of pages) {
      console.log(`\n########## ${url}`);
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
        await page.waitForTimeout(9_000);
        const controls = (await page.evaluate(READ_CONTROLS)) as Control[];
        const seen = new Set<string>();
        for (const c of controls) {
          const key = `${c.icon}|${c.label}|${c.text}`;
          if (seen.has(key)) continue;
          seen.add(key);
          if (!c.icon && !c.label && !c.text) continue;
          console.log(
            `  icon=${(c.icon || "-").padEnd(28)} label="${c.label}" text="${c.text}" <${c.tag}${
              c.role ? " role=" + c.role : ""
            }> ${c.attrs}`
          );
        }
        console.log(`  (${controls.length} controls, ${seen.size} distinct)`);
        // The social counts row carries no icon and no view name, so its raw
        // markup is the only way to know what can be held on to.
        const raw = (await page.evaluate(() => {
          const out: string[] = [];
          document.querySelectorAll("button, a[href]").forEach((el) => {
            const t = (el as HTMLElement).innerText || "";
            if (!/\d/.test(t) || t.length > 40) return;
            const attrs = Array.from(el.attributes)
              .map((a) => `${a.name}="${a.value.slice(0, 60)}"`)
              .join(" ");
            out.push(`<${el.tagName.toLowerCase()} ${attrs}> ${t.replace(/\s+/g, " ").trim().slice(0, 40)}`);
          });
          return out.slice(0, 14);
        })) as string[];
        console.log("  --- raw markup of anything showing a number ---");
        for (const r of raw) console.log("    " + r);
      } catch (error) {
        console.log(`  FAILED: ${(error as Error).message.slice(0, 160)}`);
      }
    }
  } finally {
    await closeSession(session);
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  }
);
