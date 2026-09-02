# LinkedGrow

AI agents that find your leads and clients on LinkedIn, plus the posting tools to keep your profile alive, on your own server. One install command, a setup wizard, no LinkedIn API and no subscription. A hosted version runs at [linkedgrow.ai](https://linkedgrow.ai) for people who would rather not run a server.

## What it does

You describe who you sell to, and an agent goes to find those people where they already are: under a competitor's post, in a search, among the people who reacted to a topic. It visits the profile, likes something real, sends an invitation without a note, and once the person accepts it runs a short conversation in your name and hands you the ones who want to talk. Every lead keeps its source, so you always know which post or search produced it.

The posting side is the same product: a generator that writes in your voice, an editor, a calendar that schedules posts on LinkedIn itself, carousels, and the numbers LinkedIn shows on each post, read back by the worker.

Everything runs through a real Chrome signed in to your account, on one dedicated address per account, at a human pace. There is no LinkedIn API in this product because LinkedIn revokes apps that do what it does.

## What runs

| Service | What it is |
| --- | --- |
| `app` | The Next.js dashboard and API on port 3000; it runs migrations at boot and serves uploads from the `uploads` volume. |
| `worker` | A Node 24 process driving one Chrome per LinkedIn account under Xvfb; `WORKER_SLOTS` in `.env` sets how many run at once. |
| `db` | A libSQL server with its data in `db-data`, reached at `http://db:8080` inside the stack, with no published port. |
| `caddy` | Optional. With a domain in `.env` it takes ports 80 and 443, gets the certificate and forwards to the app. |

## Requirements

- A Linux host, amd64 preferred (see the arm64 note).
- Docker with the Compose plugin.
- 4 GB of RAM for 2 concurrent browsers (`WORKER_SLOTS=2`), 16 GB for 12.
- A domain pointing at the server for https, or an open port 3000 for a plain http trial.
- An AI key from Anthropic, OpenAI, Google, Grok or Kimi.
- A Proxy-Seller account, with the server's public IP on their API allowlist, or proxies of your own.

## Install

On a fresh Linux server, as root:

```
curl -fsSL https://raw.githubusercontent.com/DigiHold/LinkedGrow/main/install.sh | sh
```

It asks for your domain, installs Docker when it is missing, writes an `.env` with fresh secrets, pulls the images and starts the stack in `/opt/linkedgrow`. Answer the question with an empty line to serve on the server address over http instead. Give it 2 or 3 minutes, then open the address it prints at the end.

### Manual install

```
mkdir -p /opt/linkedgrow && cd /opt/linkedgrow
curl -fsSLO https://raw.githubusercontent.com/DigiHold/LinkedGrow/main/docker-compose.yml
curl -fsSL https://raw.githubusercontent.com/DigiHold/LinkedGrow/main/.env.example -o .env
docker compose pull && docker compose up -d
```

Before the last line, open `.env` and set 3 values: `APP_URL`, the address people will use, then `AUTH_SECRET` and `ENCRYPTION_KEY`, each holding the output of `openssl rand -hex 32`. Keep `ENCRYPTION_KEY` safe; everything sensitive in the database is encrypted with it and cannot be read with another one.

Open the address, create the first account (it is the administrator), and follow the wizard.

### Install with an AI agent

The install is written down for agents in [llms-install.md](llms-install.md), so an agent with shell access to the server can run it end to end. Give yours this prompt:

> Install LinkedGrow on this server following https://raw.githubusercontent.com/DigiHold/LinkedGrow/main/llms-install.md, with the domain linkedgrow.example.com. Do not put any key of your own in the configuration, and do not create the first account. Tell me the address to open when it answers on its health check.

Replace the domain with yours, or ask for the run without a domain to reach the app on the server address.

## The setup wizard

The wizard runs once, at the first login, and asks for what the agents need to work.

An AI key, from Anthropic, OpenAI, Google, Grok or Kimi. It runs the agents and, until you add another provider in Settings, the post generator as well. You set a daily and a monthly spending ceiling on it.

A way to get one dedicated address per LinkedIn account. LinkedGrow buys them through your own Proxy-Seller account when you paste its API key, in the country you pick when you connect the account. You can bring your own proxy instead.

An email provider, optional: Resend or any SMTP server, for the notifications (a lead replied, LinkedIn asks for a code, an agent stopped, the weekly list of people found).

Storage, optional: files stay on the server by default, served by the app from its `uploads` volume; S3 compatible storage (Cloudflare R2, MinIO) works too.

Everything can be changed later in Settings, Instance.

## Behind a reverse proxy

The installer runs Caddy for you when you give it a domain, writing `DOMAIN` and `COMPOSE_PROFILES=https` into `.env`, and Caddy gets the certificate and renews it on its own. To run a proxy you already have instead, leave `COMPOSE_PROFILES` empty, set `APP_URL` to your https address, set `APP_BIND=127.0.0.1` and forward to port 3000. The [reverse proxy page](src/content/docs/self-hosting/reverse-proxy.md) has the nginx and Caddy blocks.

## Updating

```
cd /opt/linkedgrow && ./install.sh update
```

That pulls the current images and restarts the stack, which is also what `docker compose pull && docker compose up -d` does by hand. Database migrations run when the app starts. Pin a release by setting `LINKEDGROW_VERSION=v1.0.0` in `.env` instead of `latest`.

## Backups

3 Docker volumes hold everything: `db-data` (the database), `uploads` (files) and `profiles` (the signed in browser sessions). Their real names carry the Compose project prefix (`linkedgrow_` here); `docker volume ls` shows them. Back them up together:

```
docker run --rm -v linkedgrow_db-data:/db -v linkedgrow_uploads:/uploads -v linkedgrow_profiles:/profiles -v "$PWD":/backup alpine tar czf /backup/linkedgrow-backup.tgz /db /uploads /profiles
```

## About your LinkedIn account

LinkedIn restricts accounts that automate, and no tool changes that. LinkedGrow moves at a human pace, keeps one stable address per account, ramps a new account up over 2 weeks, and ships conservative daily limits. The account is yours and so is the responsibility for how hard you push it, so start with the defaults.

## Arm64 hosts

Google Chrome only ships for amd64 on Linux. On arm64 (Raspberry Pi, Apple Silicon) the worker image falls back to Chromium through `CHROME_PATH`, which LinkedIn can tell apart from Chrome more easily. Release tags carry an arm64 image; `latest` is built for amd64 only, so an arm64 host runs `--source` or a release tag. It works for trying the product; run production on amd64.

## Docs and help

The docs live on your instance at `/docs` (self hosting under `/docs/self-hosting`), with development setup in [CONTRIBUTING.md](CONTRIBUTING.md). Bugs and requests go to [GitHub issues](https://github.com/DigiHold/LinkedGrow/issues), security reports to the address in [SECURITY.md](SECURITY.md).

Built by [Nicolas Lecocq](https://linkedgrow.ai) and Maria Lecocq, copyright 2026 Vayalis Sàrl, and licensed under the AGPL-3.0 (see [LICENSE](LICENSE)).
