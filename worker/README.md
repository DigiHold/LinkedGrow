# LinkedGrow worker

The worker is the browser plane of LinkedGrow. It opens one persistent Chrome per connected LinkedIn account, signed in with the credentials the user gave the app and going out through that account's own dedicated address, and it does everything the product does on LinkedIn: sourcing people, sending invitations, running conversations, publishing scheduled posts, reading the numbers back. The app never touches LinkedIn; it writes work into the database and the worker picks it up.

`src/worker.ts` runs 5 loops against the same database the app uses: the agents pass every 5 minutes, the publishing pass every minute, the insights pass every 30 minutes, a connect pass every 8 seconds for accounts waiting to be signed in, and a cron pass that ticks every minute and runs each housekeeping job on its own cadence (`src/cron/pass.ts`): agent alerts every 15 minutes, the leads digest every 7 days, and once a day the proxy watchdog, the selector health check, media cleanup, dedicated address renewal and the supplier balance check. Chrome runs headful under Xvfb, and the number of browsers open at once is capped by `WORKER_SLOTS`.

## In Docker Compose

The `worker` service of the stack's `docker-compose.yml` runs `ghcr.io/digihold/linkedgrow-worker`, built from `docker/Dockerfile.worker`, mounts the `profiles` and `uploads` volumes, and starts once the app reports healthy. Nothing to configure beyond `WORKER_SLOTS` in the root `.env`: the database address, the edition and the encryption key are wired by the compose file. On an amd64 host the image installs Google Chrome; on arm64 it installs Chromium and the entrypoint sets `CHROME_PATH` for it.

## On a machine of its own

```
cd worker
npm install
npx patchright install chrome
cp .env.example .env
npm run worker
```

Fill `.env` before the last command:

| Variable | What it is |
|---|---|
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | The same database the app uses. In compose this is `http://db:8080` with no token; locally, `file:../linkedgrow.db`. |
| `ENCRYPTION_KEY` | The same 64 hex characters as the app's key. A credential encrypted with another key is unreadable. |
| `WORKER_ENV` | `production` refuses to run an agent that has no dedicated address allocated. |
| `LINKEDGROW_EDITION` | `self-hosted` (default) reads the AI key and the proxy supplier key from the instance settings row the setup wizard wrote. |
| `PROFILE_ROOT` | Where the per account Chrome profiles live. |
| `WORKER_SLOTS` | Concurrent browsers. 2 fits a 4 GB box; 12 needs 16 GB. |
| `CHROME_PATH` | Optional path to a Chromium or Chrome binary. Unset means the Google Chrome channel, which exists on amd64 only. |

## Checks

```
npm run typecheck
npm test
```

Both must pass before a pull request. The tests under `src/` and `../shared/` run with Node's own test runner, no browser needed.
