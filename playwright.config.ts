import { defineConfig } from "@playwright/test";

/**
 * The browser run of the self hosted setup wizard: `npm run test:e2e`.
 *
 * Self contained. Playwright starts its own production server on port 3125,
 * so `next build` must have run first. The same command resets the instance
 * before `next start`: tests/e2e/global-setup.ts removes the SQLite file and
 * the uploads folder of the previous run, then applies the app's migrations.
 * It runs there rather than as Playwright's globalSetup hook because Playwright
 * brings a webServer up before that hook, and the server opens the database
 * on its first request (the readiness probe goes through the proxy, which
 * loads the db client), so a wipe from the hook would pull the file out from
 * under an open handle.
 *
 * AUTH_URL is the setting that matters. NextAuth rewrites the request's
 * nextUrl to it, and the proxy builds its redirects (to /setup, to /dashboard)
 * from that nextUrl, so without it they would point at the .env.local address
 * and the browser would leave localhost:3125.
 *
 * ANTHROPIC_API_KEY comes from the environment of the test process, never
 * from a file.
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
  webServer: {
    command: "node --import tsx tests/e2e/global-setup.ts && npx next start -p 3125",
    url: "http://localhost:3125/sign-in",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      AUTH_URL: "http://localhost:3125",
      NEXT_PUBLIC_APP_URL: "http://localhost:3125",
      TURSO_DATABASE_URL: "file:/tmp/lg-wizard.db",
      STORAGE_ROOT: "/tmp/lg-wizard-uploads",
      LINKEDGROW_EDITION: "self-hosted",
    },
  },
});
