# LinkedGrow

AI agents that find your leads and clients on LinkedIn, plus the posting tools to keep your profile alive, on your own server. One `docker compose up`, a setup wizard, no LinkedIn API and no subscription. A hosted version runs at [linkedgrow.ai](https://linkedgrow.ai) for people who would rather not run a server.

![LinkedGrow dashboard](docs/images/dashboard.png)

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

## Requirements

- A Linux host, amd64 preferred (see the arm64 note).
- Docker with the Compose plugin.
- 4 GB of RAM for 2 concurrent browsers (`WORKER_SLOTS=2`), 16 GB for 12.
- A domain and a reverse proxy for https.
- An AI key from Anthropic, OpenAI, Google, Grok or Kimi.
- A Proxy-Seller account, with the server's public IP on their API allowlist, or proxies of your own.

## Install

```
git clone https://github.com/DigiHold/LinkedGrow.git && cd LinkedGrow
cp .env.example .env
openssl rand -hex 32   # AUTH_SECRET
openssl rand -hex 32   # ENCRYPTION_KEY
docker compose up -d
```

Before the last line, open `.env` and set 3 values: `APP_URL`, the address people will use, then `AUTH_SECRET` and `ENCRYPTION_KEY`, each with one `openssl` output pasted in. Keep `ENCRYPTION_KEY` safe; everything sensitive in the database is encrypted with it and cannot be read with another one.

Open the address, create the first account (it is the administrator), and follow the wizard.

## The setup wizard

The wizard runs once, at the first login, and asks for what the agents need to work.

An AI key, from Anthropic, OpenAI, Google, Grok or Kimi. It runs the agents and, until you add another provider in Settings, the post generator as well. You set a daily and a monthly spending ceiling on it.

A way to get one dedicated address per LinkedIn account. LinkedGrow buys them through your own Proxy-Seller account when you paste its API key, in the country you pick when you connect the account. You can bring your own proxy instead.

An email provider, optional: Resend or any SMTP server, for the notifications (a lead replied, LinkedIn asks for a code, an agent stopped, the weekly list of people found).

Storage, optional: files stay on the server by default, served by the app from its `uploads` volume; S3 compatible storage (Cloudflare R2, MinIO) works too.

Everything can be changed later in Settings, Instance.

## Behind a reverse proxy

Set `APP_URL` to your https address and put any reverse proxy in front of port 3000. With Caddy:

```
linkedgrow.example.com {
    reverse_proxy localhost:3000
}
```

## Updating

```
git pull && docker compose up -d --build
```

Database migrations run when the app starts.

## Backups

3 Docker volumes hold everything: `db-data` (the database), `uploads` (files) and `profiles` (the signed in browser sessions). Their real names carry the Compose project prefix (`linkedgrow_` here); `docker volume ls` shows them. Back them up together:

```
docker run --rm -v linkedgrow_db-data:/db -v linkedgrow_uploads:/uploads -v linkedgrow_profiles:/profiles -v "$PWD":/backup alpine tar czf /backup/linkedgrow-backup.tgz /db /uploads /profiles
```

## About your LinkedIn account

LinkedIn restricts accounts that automate, and no tool changes that. LinkedGrow moves at a human pace, keeps one stable address per account, ramps a new account up over 2 weeks, and ships conservative daily limits. The account is yours and so is the responsibility for how hard you push it, so start with the defaults.

## Arm64 hosts

Google Chrome only ships for amd64 on Linux. On arm64 (Raspberry Pi, Apple Silicon) Compose builds the worker image for the host and it falls back to Chromium through `CHROME_PATH`, which LinkedIn can tell apart from Chrome more easily. It works for trying the product; run production on amd64.

## Docs and help

The docs live on your instance at `/docs` (self hosting under `/docs/self-hosting`), with development setup in [CONTRIBUTING.md](CONTRIBUTING.md). Bugs and requests go to [GitHub issues](https://github.com/DigiHold/LinkedGrow/issues), security reports to the address in [SECURITY.md](SECURITY.md).

Built by [Nicolas Lecocq](https://linkedgrow.ai) and Maria Lecocq, copyright 2026 Vayalis Sàrl, and licensed under the AGPL-3.0 (see [LICENSE](LICENSE)).
