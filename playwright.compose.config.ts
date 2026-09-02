import { defineConfig } from "@playwright/test";

/**
 * The browser run against the Docker Compose stack:
 * `npx playwright test -c playwright.compose.config.ts`.
 *
 * Nothing is started here. The stack from `docker compose up -d --build`
 * answers on port 3000, and the SMTP step of the wizard needs a mail catcher
 * reachable by the app as `mailpit:1025` with its API on localhost:8025
 * (a `mailpit` service in docker-compose.override.yml, image axllent/mailpit).
 *
 * The spec is idempotent: on an instance that has completed setup it signs in
 * as the administrator and runs the post setup checks only, so it can be run
 * again after a restart or a rebuild of the same stack.
 *
 * ANTHROPIC_API_KEY comes from the environment of the test process, never
 * from a file.
 */
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: /compose-.*\.spec\.ts/,
  timeout: 600_000,
  expect: { timeout: 30_000 },
  retries: 0,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
});
