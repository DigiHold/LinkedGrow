import { expect, test } from "@playwright/test";
import { createClient } from "@libsql/client";
import { COUNTRY_GROUPS } from "../../shared/countries.ts";

/**
 * The countries an agent targets, from the picker to the row, in a browser.
 *
 * A customer aimed an agent at the Americas and the Caribbean and was handed
 * leads in Asia and the Middle East. The worker's own tests hold what it does
 * with the answer; this holds what a person clicking the screen ends up
 * storing, because the field this replaced took free text and free text is
 * exactly what could never be matched against what LinkedIn prints.
 *
 * One test rather than six, because signing up is what puts the browser in a
 * session and splitting it would mean signing in again for every case.
 */

const EMAIL = "countries@example.com";
const PASSWORD = "Countries-Passw0rd-2026";
const DB_FILE = "file:/tmp/lg-countries.db";
const AMERICAS = [...(COUNTRY_GROUPS.find((g) => g.id === "americas")?.codes ?? [])].sort();

async function sql(statement: string, args: unknown[] = []): Promise<Record<string, unknown>[]> {
  const client = createClient({ url: DB_FILE });
  const { rows } = await client.execute({ sql: statement, args: args as never });
  client.close();
  return rows as unknown as Record<string, unknown>[];
}

/** The countries on the agent made last, read from the column the worker reads. */
async function storedLocations(): Promise<string[]> {
  const rows = await sql(`SELECT locations FROM agents ORDER BY created_at DESC, rowid DESC LIMIT 1`);
  const raw = rows[0]?.locations;
  return typeof raw === "string" && raw ? (JSON.parse(raw) as string[]) : [];
}

test("the countries an agent is given, picked and then stored", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByPlaceholder("Your name").fill("Country Probe");
  await page.getByPlaceholder("you@example.com").fill(EMAIL);
  await page.getByPlaceholder("Create a password").fill(PASSWORD);
  await page.getByPlaceholder("Confirm your password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create Account" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

  // An agent hangs off a LinkedIn account, and connecting a real one in a test
  // is not something anybody should do. One planted row, on a database that is
  // deleted and rebuilt at the start of every run.
  const users = await sql(`SELECT id FROM users WHERE email = ?`, [EMAIL]);
  const userId = String(users[0]?.id);
  const now = Math.floor(Date.now() / 1000);
  await sql(
    `INSERT OR IGNORE INTO linkedin_accounts
       (id, workspace_id, created_by, email, password_encrypted, full_name, country,
        status, created_at, updated_at)
     VALUES ('acct-probe', ?, ?, 'probe@example.com', 'x', 'Probe Sender', 'FR', 'active', ?, ?)`,
    [userId, userId, now, now]
  );

  // ---- The picker, on the screen somebody actually uses ----

  await page.goto("/dashboard/agents/new");
  await page.getByRole("button", { name: "Continue" }).click(); // 1, the site
  await page.getByRole("button", { name: "Continue" }).click(); // 2, where to look

  // Nothing chosen reads Worldwide, and that is the state a new agent is in.
  const trigger = page.getByTestId("country-picker");
  await expect(trigger).toContainText("Worldwide");

  await trigger.click();
  // 57, which is the UN M49 count and what the customer meant by "the Americas".
  await page.getByTestId("group-americas").click();
  await expect(trigger).toContainText("57 countries");

  /**
   * The Caribbean is inside the Americas, so it is already ticked, and ticking
   * it again takes it away. That reads as a trap written down and is the right
   * behaviour on the screen: the checkmark beside it says it is already in, so
   * pressing it is somebody removing it on purpose.
   */
  await expect(page.getByTestId("group-caribbean")).toHaveAttribute("aria-selected", /.*/);
  await page.getByTestId("group-caribbean").click();
  await expect(trigger).toContainText("29 countries");
  await page.getByTestId("group-caribbean").click();
  await expect(trigger).toContainText("57 countries");

  // A country is found by typing its name, which is the whole reason the free
  // text box had to go: somebody typing one the product could not read.
  await page.getByPlaceholder("Search a country or a region...").fill("Colombia");
  await expect(page.getByTestId("country-CO")).toBeVisible();
  await page.getByPlaceholder("Search a country or a region...").fill("");
  await page.keyboard.press("Escape");

  // And it can be handed back.
  await page.getByRole("button", { name: "Back to worldwide" }).click();
  await expect(trigger).toContainText("Worldwide");

  // ---- What the column ends up holding, which is all the worker reads ----

  const create = (locations: unknown) =>
    page.request.post("/api/agents", {
      data: {
        name: `probe ${Date.now()}`,
        linkedinAccountId: "acct-probe",
        icpSummary: "Founders who sell software",
        locations,
      },
    });

  // A whole region survives. The route used to cap a list at 20 entries, which
  // would have silently thrown away 37 of these 57.
  const wide = await create(AMERICAS);
  expect(wide.ok(), await wide.text()).toBe(true);
  expect(await storedLocations()).toEqual(AMERICAS);

  // Free text is refused rather than stored, in any language.
  const typed = await create(["Americas", "Caribbean", "Allemagne", "not a place"]);
  expect(typed.ok()).toBe(true);
  expect(await storedLocations()).toEqual([]);

  // Choosing nothing is worldwide, stored as nothing rather than as a filter.
  const none = await create([]);
  expect(none.ok()).toBe(true);
  expect(await storedLocations()).toEqual([]);

  // ---- Editing them throws away the cached search plan ----
  //
  // derived_targeting holds the queries the model invented from the business,
  // and they are built from the countries now. An agent that was worldwide
  // yesterday would otherwise keep hunting with queries aimed at nobody.
  const agents = await sql(`SELECT id FROM agents ORDER BY created_at DESC, rowid DESC LIMIT 1`);
  const agentId = String(agents[0]?.id);
  await sql(`UPDATE agents SET derived_targeting = ? WHERE id = ?`, ['{"topics":["stale"]}', agentId]);

  const patched = await page.request.patch(`/api/agents/${agentId}`, {
    data: { locations: ["CO", "MX"] },
  });
  expect(patched.ok(), await patched.text()).toBe(true);

  const after = await sql(`SELECT locations, derived_targeting FROM agents WHERE id = ?`, [agentId]);
  expect(JSON.parse(String(after[0]?.locations))).toEqual(["CO", "MX"]);
  expect(after[0]?.derived_targeting).toBeNull();

  // A region typed into the API by hand is refused there too.
  const bad = await page.request.patch(`/api/agents/${agentId}`, {
    data: { locations: ["Americas"] },
  });
  expect(bad.ok()).toBe(true);
  const reread = await sql(`SELECT locations FROM agents WHERE id = ?`, [agentId]);
  expect(JSON.parse(String(reread[0]?.locations))).toEqual([]);
});
