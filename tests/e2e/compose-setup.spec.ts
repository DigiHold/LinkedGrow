import { expect, test, type Browser, type Page } from "@playwright/test";
import sharp from "sharp";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "Wizard-Passw0rd-2026";
const SECOND_EMAIL = "second@example.com";
const SIGNUPS_CLOSED = "Sign ups are closed on this instance. Ask the administrator for an invitation.";
const MAILPIT_API = "http://localhost:8025/api/v1/messages";
const TEST_EMAIL_SUBJECT = "LinkedGrow test email";
const TOPIC = "A lesson from a failed product launch";
const NO_BILLING_COPY = /\b(trial|checkout|credit card|payment card)\b/i;

/** A real 4 by 4 PNG, made by the same sharp the app decodes it with. */
async function probePng(): Promise<Buffer> {
  return sharp({ create: { width: 4, height: 4, channels: 3, background: "#0ea5e9" } })
    .png()
    .toBuffer();
}

interface Health {
  ok: boolean;
  edition: string;
  setupCompleted: boolean;
}

interface SetupStatus {
  setupCompleted: boolean;
  allowSignups: boolean;
  ai: { keyMask: string | null; provider: string | null };
  email: { provider: string };
}

interface MailpitInbox {
  messages: { Subject: string; To: { Address: string }[] }[];
}

/** The first account of the instance, then every step of the wizard against the containers. */
async function registerAndRunWizard(page: Page, apiKey: string): Promise<void> {
  await page.goto("/sign-up");
  await page.getByPlaceholder("Your name").fill("Admin");
  await page.getByPlaceholder("you@example.com").fill(ADMIN_EMAIL);
  await page.getByPlaceholder("Create a password").fill(ADMIN_PASSWORD);
  await page.getByPlaceholder("Confirm your password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Create Account" }).click();

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

  // Step 4: SMTP to the mail catcher on the compose network, one test message sent.
  await expect(page.getByRole("heading", { name: "Email, for notifications only" })).toBeVisible();
  await page.getByRole("button", { name: "SMTP", exact: true }).click();
  await page.locator("#smtpHost").fill("mailpit");
  await page.locator("#smtpPort").fill("1025");
  await page.locator("#smtpUser").fill("");
  const tls = page.locator("#smtpTls");
  if (await tls.isChecked()) await tls.click();
  await expect(tls).not.toBeChecked();
  await page.locator("#fromName").fill("LinkedGrow");
  await page.locator("#fromAddress").fill("no-reply@example.com");
  await page.getByRole("button", { name: "Send a test email" }).click();
  await expect(page.getByTestId("email-test-result")).toContainText(ADMIN_EMAIL, { timeout: 60_000 });
  await expect(page.getByTestId("email-test-result")).not.toContainText(/fail|error|refused/i);

  const inbox = await page.request.get(MAILPIT_API);
  expect(inbox.ok()).toBe(true);
  const mail = (await inbox.json()) as MailpitInbox;
  const tests = mail.messages.filter((m) => m.Subject === TEST_EMAIL_SUBJECT);
  expect(tests).toHaveLength(1);
  expect(tests[0].To.map((t) => t.Address)).toContain(ADMIN_EMAIL);
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
}

/** The administrator of an instance that has already run the wizard. */
async function signInAsAdmin(page: Page): Promise<void> {
  await page.goto("/sign-in");
  await page.getByPlaceholder("you@example.com").fill(ADMIN_EMAIL);
  await page.getByPlaceholder("Enter your password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function checkSetupStatus(page: Page, apiKey: string): Promise<void> {
  const status = await page.request.get("/api/setup/status");
  expect(status.ok()).toBe(true);
  const body = (await status.json()) as SetupStatus;
  expect(body.setupCompleted).toBe(true);
  expect(body.allowSignups).toBe(false);
  expect(body.ai.provider).toBe("anthropic");
  expect(body.ai.keyMask?.endsWith(apiKey.slice(-4))).toBe(true);
  expect(body.email.provider).toBe("smtp");
}

/** The agent wizard up to the sending account: the accounts panel, and nothing about paying. */
async function walkAgentWizardToAccounts(page: Page): Promise<void> {
  await page.goto("/dashboard/agents/new");
  await expect(page.getByRole("heading", { name: "Start with your website" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Where should it look for people?" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Who should it contact?" })).toBeVisible();
  for (const signal of ["gdpr cookie consent", "cold outreach", "linkedin automation", "lead generation"]) {
    await page.getByPlaceholder("gdpr cookie consent").fill(signal);
    await page.getByRole("button", { name: "Add", exact: true }).click();
  }
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Who sends, and what it says" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Connect an account" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(NO_BILLING_COPY);
}

/** One post on the administrator's own key, the one the wizard copied over. */
async function generateOnePost(page: Page): Promise<void> {
  await page.goto("/dashboard/generator");
  await page.getByRole("button", { name: /^Actionable/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByPlaceholder(/Lessons learned from launching/).fill(TOPIC);
  await page.getByRole("button", { name: "Generate 5 ideas" }).click();
  await expect(page.getByText("Pick an idea")).toBeVisible({ timeout: 90_000 });

  await page.locator("button[aria-pressed='false']").first().click();
  await page.getByRole("button", { name: "Write this post" }).click();
  await expect(page.getByText("Your draft")).toBeVisible({ timeout: 90_000 });

  const draft = page.locator("div.prose").first();
  await expect(draft).toBeVisible();
  const text = (await draft.innerText()).trim();
  expect(text.length).toBeGreaterThan(50);
}

async function checkInstanceSettingsMask(page: Page, apiKey: string): Promise<void> {
  await page.goto("/dashboard/settings/instance");
  const tail = apiKey.slice(-4).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  await expect(page.locator("#apiKey")).toHaveAttribute("placeholder", new RegExp(`${tail}$`));
}

/** A detached upload through the media route lands on the local disk and comes back from /uploads. */
async function uploadThroughTheStack(page: Page): Promise<void> {
  const upload = await page.request.post("/api/media", {
    multipart: {
      file: { name: "probe.png", mimeType: "image/png", buffer: await probePng() },
      detached: "1",
    },
  });
  expect(upload.ok(), await upload.text()).toBe(true);
  const body = (await upload.json()) as { upload: { url: string; key: string; mimeType: string } };
  expect(body.upload.url.startsWith("/uploads/")).toBe(true);
  expect(body.upload.mimeType).toBe("image/webp");

  const file = await page.request.get(body.upload.url);
  expect(file.status()).toBe(200);
  expect(file.headers()["cache-control"]).toContain("immutable");
  expect(file.headers()["content-type"]).toContain("image/webp");
}

async function secondRegistrationIsRefused(browser: Browser): Promise<void> {
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
}

test("the compose stack runs the setup wizard, then the agent wizard, the generator, uploads and closed sign ups", async ({ page, browser }) => {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  expect(apiKey, "ANTHROPIC_API_KEY must be in the environment").not.toBe("");

  const health = await page.request.get("/api/health");
  expect(health.ok()).toBe(true);
  const state = (await health.json()) as Health;
  expect(state.edition).toBe("self-hosted");

  if (state.setupCompleted) {
    await signInAsAdmin(page);
  } else {
    await registerAndRunWizard(page, apiKey);
  }

  await checkSetupStatus(page, apiKey);
  await walkAgentWizardToAccounts(page);
  await generateOnePost(page);
  await checkInstanceSettingsMask(page, apiKey);
  await uploadThroughTheStack(page);
  await secondRegistrationIsRefused(browser);
});
