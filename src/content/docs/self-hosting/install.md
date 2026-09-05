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

LinkedGrow is 3 containers and a compose file, and the install is 3 lines with nothing to edit. On a Linux host that already has Docker:

```
mkdir -p /opt/linkedgrow && cd /opt/linkedgrow
curl -fsSLO https://raw.githubusercontent.com/DigiHold/LinkedGrow/main/docker-compose.yml
docker compose up -d
```

Open `http://<your server address>:3000` when it comes up. There is no file to write before that last line and no secret to generate.

The first start writes the 2 secrets itself. `AUTH_SECRET` signs the sessions the app hands out and `ENCRYPTION_KEY` encrypts every stored credential, and both are 64 hex characters generated in the container and saved to `/data/config/secrets.env` inside the `config` volume, readable by the app user alone. The worker reads the same file, which is how the 2 sides hold the same key. Every later start reads what is already there and generates nothing. That volume belongs in your [backups](/docs/self-hosting/backups): a database restored beside a different `ENCRYPTION_KEY` is unreadable, and there is no way to recover it.

The address is not configuration either. The app answers with whatever address the request arrived on, so the same container serves `http://203.0.113.10:3000` today and `https://linkedgrow.example.com` the day you put a proxy in front, and the wizard stores the address it should use in emails. To pin one anyway, or to change the port, see the [configuration](/docs/self-hosting/configuration) page. To serve https, see the [reverse proxy](/docs/self-hosting/reverse-proxy) page, which covers both the Caddy that ships with the stack and a proxy you already run.

`docker compose ps` lists the 3 services once they are up. The app reports healthy only after its migrations have run, and the worker waits for that before it starts.

## Or one command

```
curl -fsSL https://raw.githubusercontent.com/DigiHold/LinkedGrow/main/install.sh | sh
```

Run it as root on a fresh server. It asks one question, your domain, and does the rest on its own. It installs Docker when the command is missing, creates `/opt/linkedgrow`, reads the memory of the machine to pick `WORKER_SLOTS`, pulls the 3 images and starts everything. With a domain it also starts Caddy, which gets the certificate and renews it. Answer the question with an empty line to serve on the server address over plain http instead, on port 3000. It writes no secret and no address, because the app takes care of both.

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
| `--keep-data` | With `uninstall`, removes the containers and keeps the volumes. |
| `--yes` | Never asks anything, and needs `--domain` or `--no-domain`. |

The installer sizes `WORKER_SLOTS` from the memory free on the machine at the time it runs, not from
the memory the machine has in total, because each slot is a Chrome and a Chrome wants roughly 1.5 GB.
A server with 8 GB of which 1.3 GB is free gets 1 slot, and that is the right answer.

It also refuses to start when the port it is about to publish on is already used by something else,
and tells you how to move it rather than letting Docker fail with a message that names neither this
project nor the way out.

`APP_BIND` belongs to you once it is in the `.env`. A rerun without `--domain` or `--no-domain` keeps
whatever is there, so an instance you deliberately bound to `127.0.0.1` behind your own nginx is not
reopened to the whole internet by an update.

## Removing it

```sh
cd /opt/linkedgrow && ./install.sh uninstall
```

It asks you to type `remove`, then takes the containers, their volumes and the 2 images. Everything
goes with the volumes: the accounts, the agents, the leads, and the secrets that decrypt the stored
keys. There is no undo.

```sh
./install.sh uninstall --keep-data
```

That one stops and removes the containers and leaves the volumes alone, so running the installer again
brings the instance back exactly as it was.

Neither of them removes the folder itself, which still holds your `docker-compose.yml` and your `.env`.
The script prints the single line that does.

Running the installer again is safe. It keeps the `.env` it wrote and only rewrites the domain lines when you pass a different domain, and the secrets on the `config` volume are never touched by it at all.

## Build from source

Building on the server takes about 10 minutes and needs 8 GB of RAM to be comfortable, and it is what you want for an arm64 host, for a modified copy, or while the published images are out of reach:

```
git clone https://github.com/DigiHold/LinkedGrow.git /opt/linkedgrow && cd /opt/linkedgrow
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

Nothing to fill in here either. The override replaces the 2 published images with a build of this checkout, and everything else in the compose file stays the same. `./install.sh --source` does all of it from the clone.

## The first account

Open the address the install printed and create an account with an email and a password. The first account on an instance is the administrator, the only one that can run the wizard and change the instance settings later. Anyone who signs in before the wizard is finished sees a page saying that the instance is still being set up.

## The wizard

The administrator lands on the setup wizard right after signing in. It asks for the instance name and address, an AI key, a way to get dedicated addresses, an optional email provider and where files should live, then shows a summary before finishing. Each step is described on the [setup wizard](/docs/self-hosting/setup-wizard) page. Once it is done, the next screen creates your first agent, and everything the wizard asked for can be changed later in Settings, Instance.
