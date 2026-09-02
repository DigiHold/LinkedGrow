import { defineConfig } from "@playwright/test";

/**
 * The browser run of the self hosted setup wizard.
 *
 * Expects a production server on port 3125 with a fresh SQLite database:
 *   TURSO_DATABASE_URL=file:/tmp/lg-wizard.db npm run db:migrate
 *   TURSO_DATABASE_URL=file:/tmp/lg-wizard.db STORAGE_ROOT=/tmp/lg-wizard-uploads npx next start -p 3125
 * and ANTHROPIC_API_KEY in the environment of the test process, never in a file.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 180_000,
  expect: { timeout: 30_000 },
  retries: 0,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: "http://localhost:3125",
    trace: "retain-on-failure",
  },
});
