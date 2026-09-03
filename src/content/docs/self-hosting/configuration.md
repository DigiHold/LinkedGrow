---
title: Configuration
description: Every environment variable the stack reads, the 3 you must set, the optional ones and what they change, and why everything else lives in the instance settings instead
category: self-hosting
order: 6
---

The `.env` file next to `docker-compose.yml` holds the whole configuration of the stack, and it is deliberately short. It carries what has to exist before the app can start, and nothing else. The AI key, the proxy supplier key, the email provider, the storage, the timezone and the spending ceilings are not in here at all; they live in the database, encrypted, and the setup wizard writes them.

The installer creates this file with fresh secrets and keeps it on every later run, including `./install.sh update`. It is written with mode 600 and owned by the account that ran the installer, which is usually root.

## The 3 you must set

| Variable | What it does | Where the value comes from |
| --- | --- | --- |
| `APP_URL` | The address people type to open the instance, with no path and no trailing slash. Every session cookie, redirect and emailed link is built from it, and the entrypoint refuses to start without it. | Your own domain over https, or `http://<server address>:3000` without one |
| `AUTH_SECRET` | Signs the session tokens the app hands out. The entrypoint refuses to start while it still says `change-me`. | `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | Encrypts every credential stored in the database: LinkedIn passwords, LinkedIn 2FA secrets, AI keys, the proxy supplier key, the email password, the S3 keys. Exactly 64 hex characters, checked at boot. | `openssl rand -hex 32` |

Never change `ENCRYPTION_KEY` after the first start. Everything written under the old value becomes unreadable, there is no way to recover it, and the only remedy is deleting the affected credentials and entering them again. Back this file up somewhere the server is not.

## The optional ones

These all have working defaults, and most installs touch 2 or 3 of them at most.

| Variable | Default | What it changes |
| --- | --- | --- |
| `LINKEDGROW_EDITION` | `self-hosted` | Which edition the code behaves as. It is what opens every feature with no plan behind it, what makes the setup wizard and the Settings, Instance screens exist, and what creates each new account on business with the first one as administrator. It also keeps the paywall, the pricing page and everything Stripe out of the build. Both images set it and `docker-compose.yml` sets it again for the app and the worker, so a line for it in `.env` changes nothing |
| `LINKEDGROW_VERSION` | `latest` | The image tag both containers run: `latest`, a release such as `v1.0.0`, or one exact build such as `sha-1a2b3c4` |
| `DOMAIN` | empty | The name the bundled Caddy asks a certificate for. Only read when the https profile is on |
| `COMPOSE_PROFILES` | empty | Set it to `https` to run the bundled Caddy in front of the app. Anything else leaves that container out |
| `APP_BIND` | `127.0.0.1` | Which address the app's port is published on. The loopback address keeps it behind a proxy on the same machine, and `0.0.0.0` opens it to the network |
| `APP_PORT` | `3000` | The port on the host the app is published on. Inside the container it is always 3000 |
| `WORKER_SLOTS` | `2` in the stack, `12` outside it | How many LinkedIn browsers the worker may keep open at once. `docker-compose.yml` passes `${WORKER_SLOTS:-2}`, so an empty `.env` gives the worker 2; the worker's own fallback, which only applies when the variable never reaches it at all, is 12. Read the [requirements](/docs/self-hosting/requirements) page before raising it |
| `CHROME_PATH` | empty | The browser binary the worker drives. Empty means Google Chrome, which exists on amd64 only, and the worker entrypoint fills it with `/usr/bin/chromium` on every other architecture |
| `TURSO_DATABASE_URL` | set by compose | Where the database is. The compose file pins it to `http://db:8080`, and you would only change it to point at a database you run yourself |
| `TURSO_AUTH_TOKEN` | set by compose | Empty inside the stack, because the database is reachable only from the other containers |
| `WORKER_ENV` | set by compose | `production` makes the worker refuse to run an agent whose LinkedIn account has no dedicated address allocated |
| `PROFILE_ROOT` | `/data/profiles` | Where the per account Chrome profiles are written, inside the worker container |
| `STORAGE_ROOT` | `/data/uploads` | Where the local storage driver writes files, in both containers, on the volume they share |
| `APP_INTERNAL_URL` | `http://app:3000` | How the worker reaches the app for the health wait and the scheduled jobs, without going out to your public address and back |

5 of the last 6 are already set correctly by `docker-compose.yml` for a normal install. `PROFILE_ROOT` is the exception: the compose file never mentions it, and the value comes from the worker image, which sets it in its own Dockerfile. They are all listed because they exist, and because a worker running outside the stack needs every one of them.

## Everything else is in the instance settings

Anything you would consider an operational choice rather than a boot requirement lives in the database, on one row, and the setup wizard is what fills it. Every secret on that row is encrypted with `ENCRYPTION_KEY` before it is written, and the API only ever shows you the last 4 characters of one.

That row holds the instance name and timezone, the address the wizard confirmed, the administrator's contact address, whether new people may sign themselves up, the AI provider with its 2 model names and the daily and monthly spending ceilings, the AI key itself, the proxy supplier choice and its API key, the email provider with its from address and its SMTP details, the storage choice with its endpoint, bucket and keys, and the shared secret the worker signs its scheduled calls with.

All of it is editable after the wizard, under Settings, Instance, and every change takes effect within a minute without a restart. Nothing there belongs in `.env`, and the self hosted edition deliberately ignores the environment for those values so that 2 places can never disagree about which key is live.
