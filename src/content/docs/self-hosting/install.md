---
title: Install
description: The one command install, the manual install, building from source, the first account and the setup wizard
category: self-hosting
order: 2
---

## What you need

A Linux host on amd64, Docker with the Compose plugin, which the installer sets up for you when the command is missing, and enough memory for the browsers you want open at once: 4 GB of RAM runs 2 of them, 16 GB runs 12. A domain with an A record pointing at the server gets you https, with ports 80 and 443 free for it. You also need an AI key from Anthropic, OpenAI, Google, Grok or Kimi, and a source of dedicated addresses, which is normally a Proxy-Seller account with credit and this server's public IP on their API allowlist.

The [requirements](/docs/self-hosting/requirements) page goes through all of that in detail, including the arm64 situation and everything the stack calls out to.

## Let an AI agent do it

An assistant with shell access to the server can run the whole install on its own, following [llms-install.md](https://github.com/DigiHold/LinkedGrow/blob/main/llms-install.md) in the repository. The [install with an AI agent](/docs/self-hosting/install-with-an-agent) page has the prompt to paste and the checks to run afterwards.

## Install with Docker Compose

LinkedGrow is 3 containers and a compose file, so the install is the one every self hosted project uses. On a Linux host that already has Docker:

```
mkdir -p /opt/linkedgrow && cd /opt/linkedgrow
curl -fsSLO https://raw.githubusercontent.com/DigiHold/LinkedGrow/main/docker-compose.yml
curl -fsSL https://raw.githubusercontent.com/DigiHold/LinkedGrow/main/.env.example -o .env
openssl rand -hex 32   # AUTH_SECRET
openssl rand -hex 32   # ENCRYPTION_KEY
docker compose pull && docker compose up -d
```

Before the last line, open `.env` and fill in 3 values. `APP_URL` is the address people will type in their browser: `http://localhost:3000` for a first try, `https://linkedgrow.example.com` behind a reverse proxy. `AUTH_SECRET` signs the sessions the app hands out. `ENCRYPTION_KEY` encrypts every stored credential and must be exactly 64 hex characters, which is what `openssl rand -hex 32` prints. Never change it after the first start, because everything encrypted with the old value becomes unreadable. The app refuses to start while either secret is still the placeholder.

To let the stack serve https itself, download the Caddy configuration next to the compose file and set 2 more lines in `.env`:

```
curl -fsSL https://raw.githubusercontent.com/DigiHold/LinkedGrow/main/docker/Caddyfile -o Caddyfile
```

```
DOMAIN=linkedgrow.example.com
COMPOSE_PROFILES=https
```

`docker compose ps` then lists the 4 services. The app reports healthy once its migrations have run, and the worker waits for that before it starts.

## Or one command

```
curl -fsSL https://raw.githubusercontent.com/DigiHold/LinkedGrow/main/install.sh | sh
```

Run it as root on a fresh server. It asks one question, your domain, and does the rest on its own. It installs Docker when the command is missing, creates `/opt/linkedgrow`, generates `AUTH_SECRET` and `ENCRYPTION_KEY`, writes them into `.env` with the address people will open, reads the memory of the machine to pick `WORKER_SLOTS`, pulls the 3 images and starts everything. With a domain it also starts Caddy, which gets the certificate and renews it. Answer the question with an empty line to serve on the server address over plain http instead, on port 3000.

Expect 2 or 3 minutes, most of it spent pulling the worker image, which carries a full Chrome. The last lines print the address to open.

The options, for a run that should not ask anything:

| Option | What it does |
| --- | --- |
| `--domain NAME` | Serves on that domain over https, with the built in Caddy. |
| `--no-domain` | Serves on the server address over http, on the port below. |
| `--dir PATH` | Where the stack lives. Default `/opt/linkedgrow` |
| `--version TAG` | Image tag to run: `latest`, a release like `v1.0.0`, or `sha-1a2b3c4`. Default `latest` |
| `--port NUMBER` | Port the app is published on. Default `3000` |
| `--source` | Builds the images from the source instead of pulling them. |
| `--yes` | Never asks anything, and needs `--domain` or `--no-domain`. |

Running the installer again is safe. It keeps the `.env` it wrote, secrets included, and only rewrites the address lines when you pass a different domain.

## Build from source

Building on the server takes about 10 minutes and needs 8 GB of RAM to be comfortable, and it is what you want for an arm64 host, for a modified copy, or while the published images are out of reach:

```
git clone https://github.com/DigiHold/LinkedGrow.git /opt/linkedgrow && cd /opt/linkedgrow
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

Fill in the same 3 values before the last line as you would for a manual install, because a copied `.env.example` still says `change-me` and the app refuses to start on it.

The override replaces the 2 published images with a build of this checkout, and everything else in the compose file stays the same. `./install.sh --source` does all of it from the clone, secrets included.

## The first account

Open `APP_URL` and create an account with an email and a password. The first account on an instance is the administrator, the only one that can run the wizard and change the instance settings later. Anyone who signs in before the wizard is finished sees a page saying that the instance is still being set up.

## The wizard

The administrator lands on the setup wizard right after signing in. It asks for the instance name and address, an AI key, a way to get dedicated addresses, an optional email provider and where files should live, then shows a summary before finishing. Each step is described on the [setup wizard](/docs/self-hosting/setup-wizard) page. Once it is done, the next screen creates your first agent, and everything the wizard asked for can be changed later in Settings, Instance.
