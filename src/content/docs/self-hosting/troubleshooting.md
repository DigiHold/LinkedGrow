---
title: Troubleshooting
description: Pulling the images fails, the domain does not resolve, ports 80 and 443 are taken, the app refuses to start, the worker keeps waiting, and where the logs are
category: self-hosting
order: 6
---

## Where the logs are

```
docker compose logs app
docker compose logs worker
```

Run them in the stack folder, `/opt/linkedgrow` for an install that took the default. The installer runs as root, so the `.env` it wrote is owned by root and readable by root only, and every compose command on this page expects the same root account, or `sudo` in front of it.

Add `-f` to follow, or `--tail 200` for the last lines only. `docker compose ps` shows which of the 3 services is running and whether the app is healthy.

## The app refuses to start

The app checks `.env` before anything else and stops with one line on the reason. `AUTH_SECRET is not set` means the value is still the `change-me` placeholder. `ENCRYPTION_KEY must be exactly 64 hex characters` means the key is missing, too short, or contains something other than the digits and letters `openssl rand -hex 32` prints. `APP_URL is not set` means the line is empty. Fix the value and run `docker compose up -d` again; nothing has been written yet.

## The worker keeps waiting for the app

`worker: waiting for the app` repeating in the worker log is the worker polling the app's health check, which only passes once the database is reachable and the migrations have run. Look at the app log for the reason: an `.env` problem as above, or the database container still opening on a slow disk, which the app retries for a minute on its own. The worker starts by itself as soon as the app answers.

## Pulling the images fails

`denied` or `manifest unknown` on `docker compose pull` means the registry will not hand over the image. The repository is private until launch, so sign in first with a GitHub token that carries the `read:packages` scope:

```
docker login ghcr.io -u YOUR_GITHUB_USER
```

Paste the token as the password. The other way through is to build the images on the server instead, with `./install.sh --source` or the build override described on the [install](/docs/self-hosting/install) page, which needs no registry at all. A `manifest unknown` on an arm64 host usually means something else, because `latest` is built for amd64 only, so pick a release tag or build from source.

## The domain does not resolve yet

The installer warns when the domain resolves somewhere else, or nowhere, and starts the stack anyway. Caddy cannot get a certificate in that state, and the browser shows a connection error rather than a page. Add an A record pointing at this server, wait for it to propagate, check it with `dig +short linkedgrow.example.com`, then run `docker compose restart caddy` and watch `docker compose logs caddy` for the line that says the certificate was obtained. Let's Encrypt limits how often it accepts a failing request for the same name, so fix the record before restarting Caddy in a loop.

## Port 80 or 443 is already in use

`bind: address already in use` on the caddy container means another web server holds the port, usually an nginx or an Apache installed with the machine. Either stop it (`systemctl stop nginx`), or keep it and let it do the https work, which means emptying `COMPOSE_PROFILES` in `.env`, running `docker compose up -d`, and pointing your existing server at port 3000 with one of the blocks on the [reverse proxy](/docs/self-hosting/reverse-proxy) page. `ss -tlnp | grep -E ':(80|443)'` names the process holding the port.

## The Proxy-Seller test fails

Their API only answers from addresses on the allowlist in their dashboard, at most 3 of them, and the message says the IP is not allowed. Add the server's public address, the one shown on the wizard step. The app calls their API over IPv4 on purpose, so the address to add is the IPv4 one even when the server also has IPv6. After a move to another server, add the new address before the worker needs to buy or renew anything.

## An agent is paused with a message about the AI key

`No AI key is configured for the agents. Add one in Settings, Instance.` means the wizard's AI step was skipped or the key was removed. Add a key on that page and test it; the agent stays paused until you start it again from the agents page.

## Arm64 hosts and Chromium

Google Chrome ships for amd64 only on Linux, so on an arm64 host the worker image installs Chromium and the entrypoint sets `CHROME_PATH=/usr/bin/chromium`. It works, and LinkedIn can tell Chromium apart from Chrome more easily, so treat arm64 as a way to try the product and run production on amd64. On an Apple Silicon Mac used for development, a `docker-compose.override.yml` next to the compose file, containing `services: worker: platform: linux/amd64` on 3 lines, runs the amd64 Chrome image under emulation instead.
