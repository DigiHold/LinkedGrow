import { defineConfig } from "@playwright/test";

/**
 * The country picker, in a browser: `npx playwright test -c playwright.countries.config.ts`.
 *
 * Its own server, its own database and its own port, so it neither depends on
 * the setup wizard run nor disturbs it. `next build` must have run first.
 */
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: /agent-countries\.spec\.ts/,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  retries: 0,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: "http://localhost:3126",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node --import tsx tests/e2e/countries-setup.ts && npx next start -p 3126",
    url: "http://localhost:3126/sign-in",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      AUTH_URL: "http://localhost:3126",
      NEXT_PUBLIC_APP_URL: "http://localhost:3126",
      TURSO_DATABASE_URL: "file:/tmp/lg-countries.db",
      STORAGE_ROOT: "/tmp/lg-countries-uploads",
      LINKEDGROW_EDITION: "self-hosted",
      // Throwaway values for a throwaway instance. They are here rather than in
      // a file so the run needs nothing configured and nothing real is involved:
      // the database is deleted and rebuilt at the start of every run.
      AUTH_SECRET: "country-probe-auth-secret-not-a-real-one",
      AUTH_TRUST_HOST: "true",
      ENCRYPTION_KEY: "0".repeat(64),
    },
  },
});
