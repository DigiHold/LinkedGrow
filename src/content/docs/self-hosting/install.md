---
title: Install
description: What the server needs, the commands that start the stack, the first account and the setup wizard
category: self-hosting
order: 1
---

## What you need

The stack needs a Linux host. On amd64 the worker runs Google Chrome, which is what LinkedIn expects to see; arm64 runs Chromium and is fine for trying the product (see the [troubleshooting](/docs/self-hosting/troubleshooting) page). It also needs Docker with the Compose plugin, and enough memory for the browsers: 4 GB of RAM runs 2 at once (`WORKER_SLOTS=2` in `.env`), 16 GB runs 12. Add a domain and a reverse proxy when the instance is reachable from the internet, so that it is served over https. You also need an AI key from Anthropic, OpenAI, Google, Grok or Kimi, and a source of dedicated addresses: a Proxy-Seller account with credit, with the server's public IP added to their API allowlist, or proxies you already own.

## Start the stack

```
git clone https://github.com/DigiHold/LinkedGrow.git && cd LinkedGrow
cp .env.example .env
openssl rand -hex 32   # AUTH_SECRET
openssl rand -hex 32   # ENCRYPTION_KEY
docker compose up -d
```

Before the last command, open `.env` and fill in 3 values. `APP_URL` is the address people will type in their browser: `http://localhost:3000` for a first try, `https://linkedgrow.example.com` behind a reverse proxy. `AUTH_SECRET` signs the sessions. `ENCRYPTION_KEY` encrypts every stored credential and must be exactly 64 hex characters, which is what `openssl rand -hex 32` prints. Never change it after the first start, because everything encrypted with the old value becomes unreadable. The app refuses to start while either secret is still the placeholder.

The first start builds 2 images and pulls the database image, which takes a few minutes. `docker compose ps` lists the 3 services: the app reports healthy once its migrations have run, and the worker waits for that before it starts.

## The first account

Open `APP_URL` and create an account with an email and a password. The first account on an instance is the administrator, the only one that can run the wizard and change the instance settings later. Anyone who signs in before the wizard is finished sees a page saying that the instance is still being set up.

## The wizard

The administrator lands on the setup wizard right after signing in. It asks for the instance name and address, an AI key, a way to get dedicated addresses, an optional email provider and where files should live, then shows a summary before finishing. Each step is described on the [setup wizard](/docs/self-hosting/setup-wizard) page. Once it is done, the next screen creates your first agent, and everything the wizard asked for can be changed later in Settings, Instance.
