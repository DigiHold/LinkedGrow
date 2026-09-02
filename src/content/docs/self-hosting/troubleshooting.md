---
title: Troubleshooting
description: The app refuses to start, the worker keeps waiting, the Proxy-Seller test fails, an agent is paused, arm64 hosts, and where the logs are
category: self-hosting
order: 6
---

## Where the logs are

```
docker compose logs app
docker compose logs worker
```

Add `-f` to follow, or `--tail 200` for the last lines only. `docker compose ps` shows which of the 3 services is running and whether the app is healthy.

## The app refuses to start

The app checks `.env` before anything else and stops with one line on the reason. `AUTH_SECRET is not set` means the value is still the `change-me` placeholder. `ENCRYPTION_KEY must be exactly 64 hex characters` means the key is missing, too short, or contains something other than the digits and letters `openssl rand -hex 32` prints. `APP_URL is not set` means the line is empty. Fix the value and run `docker compose up -d` again; nothing has been written yet.

## The worker keeps waiting for the app

`worker: waiting for the app` repeating in the worker log is the worker polling the app's health check, which only passes once the database is reachable and the migrations have run. Look at the app log for the reason: an `.env` problem as above, or the database container still opening on a slow disk, which the app retries for a minute on its own. The worker starts by itself as soon as the app answers.

## The Proxy-Seller test fails

Their API only answers from addresses on the allowlist in their dashboard, at most 3 of them, and the message says the IP is not allowed. Add the server's public address, the one shown on the wizard step. The app calls their API over IPv4 on purpose, so the address to add is the IPv4 one even when the server also has IPv6. After a move to another server, add the new address before the worker needs to buy or renew anything.

## An agent is paused with a message about the AI key

`No AI key is configured for the agents. Add one in Settings, Instance.` means the wizard's AI step was skipped or the key was removed. Add a key on that page and test it; the agent stays paused until you start it again from the agents page.

## Arm64 hosts and Chromium

Google Chrome ships for amd64 only on Linux, so on an arm64 host the worker image installs Chromium and the entrypoint sets `CHROME_PATH=/usr/bin/chromium`. It works, and LinkedIn can tell Chromium apart from Chrome more easily, so treat arm64 as a way to try the product and run production on amd64. On an Apple Silicon Mac used for development, a `docker-compose.override.yml` next to the compose file, containing `services: worker: platform: linux/amd64` on 3 lines, builds the Chrome image under emulation instead.
