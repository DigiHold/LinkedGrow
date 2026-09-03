---
title: Configuration
description: Every environment variable the stack reads, why all of them are optional, the 2 secrets the app generates for itself, and why everything else lives in the instance settings instead
category: self-hosting
order: 6
---

**Every variable on this page is optional.** `docker compose up -d` in a folder holding nothing but `docker-compose.yml` is a complete install, and a normal one never gains a `.env` at all. What the app needs to run it makes for itself, and what you would want to choose the setup wizard asks for at first login.

Write a `.env` next to `docker-compose.yml` only when you want one of the settings below. Compose reads it when it is there and says nothing when it is not.

## The 2 secrets, and why they are not here

`AUTH_SECRET` signs the session tokens the app hands out. `ENCRYPTION_KEY` encrypts every credential stored in the database: LinkedIn passwords, LinkedIn 2FA secrets, AI keys, the proxy supplier key, the email password, the S3 keys.

The app generates both on its first start, 64 hex characters each, and writes them to `/data/config/secrets.env` on the `config` volume with mode 600, owned by the account inside the container and readable by nobody else. Every later start reads that file instead of generating anything. The worker mounts the same volume read only and reads the same 2 values, which is how both sides hold one key.

Set either of them in the environment and yours wins over the file, which is the case a restore depends on: bring the database back beside the `ENCRYPTION_KEY` it was written with and everything in it opens again. A key that is set and is not 64 hex characters stops the app with one line, rather than being quietly replaced by a generated one that would make the database unreadable.

Never change `ENCRYPTION_KEY` on a running instance. Everything written under the old value becomes unreadable, there is no way to recover it, and the only remedy is deleting the affected credentials and entering them again. Put the `config` volume in your [backups](/docs/self-hosting/backups) and keep a copy of it somewhere the server is not.

## The address, and why it is not here either

There is no address to declare. Every page, every redirect and every session cookie is built from the address the request arrived on, read from `X-Forwarded-Host` and `X-Forwarded-Proto` when a proxy sets them and from the `Host` header otherwise. One image therefore serves `http://203.0.113.10:3000` and `https://linkedgrow.example.com` with no rebuild and no edit, and the session cookie takes its Secure flag from the scheme of that same request.

Emails are the exception, because nothing sends a request when an agent mails you at 07:00. Links in them come from the address the wizard stored, which is also what stops a forged `Host` header putting a stranger's domain into your password reset mail.

`APP_URL` pins the address anyway when you want it pinned. Set it and everything, emails included, uses that value and nothing reads a header. It is the right answer when the instance sits behind something that rewrites hosts in a way you do not control.

## The optional ones

These all have working defaults, and most installs touch none of them.

| Variable | Default | What it changes |
| --- | --- | --- |
| `LINKEDGROW_EDITION` | `self-hosted` | Which edition the code behaves as. It is what opens every feature with no plan behind it, what makes the setup wizard and the Settings, Instance screens exist, and what creates each new account on business with the first one as administrator. It also keeps the paywall, the pricing page and everything Stripe out of the build. Both images set it and `docker-compose.yml` sets it again for the app and the worker, so a line for it in `.env` changes nothing |
| `APP_URL` | empty | The address people type, pinned. Empty means the instance answers on whatever address the request came in on, which is what most installs want. Set it with no path and no trailing slash |
| `AUTH_SECRET` | generated | Signs the session tokens. Set it only to restore the value an existing instance already uses |
| `ENCRYPTION_KEY` | generated | Encrypts every stored credential, exactly 64 hex characters. Set it only to restore the value the database was written with |
| `LINKEDGROW_VERSION` | `latest` | The image tag both containers run: `latest`, a release such as `v1.0.0`, or one exact build such as `sha-1a2b3c4` |
| `DOMAIN` | empty | The name the bundled Caddy asks a certificate for. Only read when the https profile is on |
| `COMPOSE_PROFILES` | empty | Set it to `https` to run the bundled Caddy in front of the app. Anything else leaves that container out |
| `APP_BIND` | `0.0.0.0` | Which address the app's port is published on. Every address by default, because a first install has no proxy in front of it. `127.0.0.1` puts it back behind one on the same machine |
| `APP_PORT` | `3000` | The port on the host the app is published on. Inside the container it is always 3000 |
| `WORKER_SLOTS` | `2` in the stack, `12` outside it | How many LinkedIn browsers the worker may keep open at once. `docker-compose.yml` passes `${WORKER_SLOTS:-2}`, so an empty `.env` gives the worker 2; the worker's own fallback, which only applies when the variable never reaches it at all, is 12. Read the [requirements](/docs/self-hosting/requirements) page before raising it |
| `CHROME_PATH` | empty | The browser binary the worker drives. Empty means Google Chrome, which exists on amd64 only, and the worker entrypoint fills it with `/usr/bin/chromium` on every other architecture |
| `TURSO_DATABASE_URL` | set by compose | Where the database is. The compose file pins it to `http://db:8080`, and you would only change it to point at a database you run yourself |
| `TURSO_AUTH_TOKEN` | set by compose | Empty inside the stack, because the database is reachable only from the other containers |
| `WORKER_ENV` | set by compose | `production` makes the worker refuse to run an agent whose LinkedIn account has no dedicated address allocated |
| `PROFILE_ROOT` | `/data/profiles` | Where the per account Chrome profiles are written, inside the worker container |
| `STORAGE_ROOT` | `/data/uploads` | Where the local storage driver writes files, in both containers, on the volume they share |
| `APP_INTERNAL_URL` | `http://app:3000` | How the worker reaches the app for the health wait and the scheduled jobs, without going out to your public address and back |
| `CONFIG_DIR` | `/data/config` | Where the generated secrets file is written and read, in both containers, on the volume they share |

Most of the last few are already set correctly by `docker-compose.yml` for a normal install. `PROFILE_ROOT` is the exception: the compose file never mentions it, and the value comes from the worker image, which sets it in its own Dockerfile. They are all listed because they exist, and because a worker running outside the stack needs every one of them.

## Everything else is in the instance settings

Anything you would consider an operational choice lives in the database, on one row, and the setup wizard is what fills it. Every secret on that row is encrypted with `ENCRYPTION_KEY` before it is written, and the API only ever shows you the last 4 characters of one.

That row holds the instance name and timezone, the address the wizard confirmed, the administrator's contact address, whether new people may sign themselves up, the AI provider with its 2 model names and the daily and monthly spending ceilings, the AI key itself, the proxy supplier choice and its API key, the email provider with its from address and its SMTP details, the storage choice with its endpoint, bucket and keys, and the shared secret the worker signs its scheduled calls with.

All of it is editable after the wizard, under Settings, Instance, and every change takes effect within a minute without a restart. Nothing there belongs in `.env`, and the self hosted edition deliberately ignores the environment for those values so that 2 places can never disagree about which key is live.
