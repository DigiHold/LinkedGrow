import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "Wizard-Passw0rd-2026";
const SECOND_EMAIL = "second@example.com";
const SIGNUPS_CLOSED = "Sign ups are closed on this instance. Ask the administrator for an invitation.";

test("the first account runs the setup wizard end to end and closes sign ups", async ({ page, browser }) => {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  expect(apiKey, "ANTHROPIC_API_KEY must be in the environment").not.toBe("");

  // Sign up: the first account of a self hosted instance is the administrator.
  await page.goto("/sign-up");
  await page.getByPlaceholder("Your name").fill("Admin");
  await page.getByPlaceholder("you@example.com").fill(ADMIN_EMAIL);
  await page.getByPlaceholder("Create a password").fill(ADMIN_PASSWORD);
  await page.getByPlaceholder("Confirm your password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Create Account" }).click();

  // The proxy sends a signed in account to the wizard until it has run.
  await expect(page).toHaveURL(/\/setup$/);
  await expect(page.getByRole("heading", { name: "Your instance" })).toBeVisible();

  // Step 1: the instance.
  await page.getByLabel("Instance name").fill("Probe instance");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2: the AI key, tested live before moving on.
  await expect(page.getByRole("heading", { name: "The key your agents think with" })).toBeVisible();
  await page.getByRole("button", { name: "Anthropic" }).click();
  await page.getByLabel("API key").fill(apiKey);
  await page.getByRole("button", { name: "Test the key" }).click();
  await expect(page.getByTestId("ai-test-result")).toContainText(/ok/i, { timeout: 60_000 });
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3: no supplier key today.
  await expect(page.getByRole("heading", { name: "One address per LinkedIn account" })).toBeVisible();
  await page.getByRole("button", { name: "Skip" }).click();

  // Step 4: no email provider.
  await expect(page.getByRole("heading", { name: "Email, for notifications only" })).toBeVisible();
  await page.getByRole("button", { name: "None", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 5: local disk, proven by a write, a read and a delete.
  await expect(page.getByRole("heading", { name: "Where files live" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Local disk (default)" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Test the storage" }).click();
  await expect(page.getByTestId("storage-test-result")).toContainText("/uploads/healthcheck/");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 6: review, sign ups closed by default, finish.
  await expect(page.getByRole("heading", { name: "Check it, then finish" })).toBeVisible();
  await expect(page.getByText("Probe instance", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Close sign ups")).toBeChecked();
  await page.getByRole("button", { name: "Finish setup" }).click();
  await expect(page).toHaveURL(/\/dashboard\/agents\/new/);

  // The status route agrees, and shows the key only by its last 4 characters.
  const status = await page.request.get("/api/setup/status");
  expect(status.ok()).toBe(true);
  const body = (await status.json()) as { setupCompleted: boolean; allowSignups: boolean; ai: { keyMask: string | null; provider: string | null } };
  expect(body.setupCompleted).toBe(true);
  expect(body.allowSignups).toBe(false);
  expect(body.ai.provider).toBe("anthropic");
  expect(body.ai.keyMask?.endsWith(apiKey.slice(-4))).toBe(true);
  expect(body.ai.keyMask?.length).toBe(8);

  // A fresh visitor cannot register any more.
  const context = await browser.newContext();
  const visitor = await context.newPage();
  await visitor.goto("/sign-up");
  await visitor.getByPlaceholder("Your name").fill("Second");
  await visitor.getByPlaceholder("you@example.com").fill(SECOND_EMAIL);
  await visitor.getByPlaceholder("Create a password").fill(ADMIN_PASSWORD);
  await visitor.getByPlaceholder("Confirm your password").fill(ADMIN_PASSWORD);
  await visitor.getByRole("button", { name: "Create Account" }).click();
  await expect(visitor.getByText(SIGNUPS_CLOSED)).toBeVisible();
  await context.close();
});
