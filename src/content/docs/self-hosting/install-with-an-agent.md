---
title: Install with an AI agent
description: Hand a fresh server to Claude Code, OpenClaw, Cursor or any assistant with shell access, and let it run the whole install from one prompt
category: self-hosting
order: 3
---

The install is one script, so an assistant that can run commands over ssh can do the whole thing without you watching. The repository carries a page written for exactly that, [llms-install.md](https://github.com/DigiHold/LinkedGrow/blob/main/llms-install.md), and any agent with shell access can follow it: Claude Code, OpenClaw, Cursor, Codex, whatever you already have pointed at your servers.

## What to give it

A server it can reach as root or through `sudo`, and a domain whose A record already points at that server. Everything else it works out or generates for itself.

## The prompt

```
Install LinkedGrow on this server following
https://raw.githubusercontent.com/DigiHold/LinkedGrow/main/llms-install.md,
with the domain linkedgrow.example.com. Do not put any key of your own in the
configuration, and do not create the first account. Tell me the address to open
once it answers on its health check.
```

Replace the domain in that prompt with your own. For a server with no domain yet, where the app answers on the server's own address over plain http, ask for the same run without one:

```
Install LinkedGrow on this server following
https://raw.githubusercontent.com/DigiHold/LinkedGrow/main/llms-install.md,
with no domain, so it serves on the server address over http. Do not put any key
of your own in the configuration, and do not create the first account. Tell me
the address to open once it answers on its health check.
```

## What it will do

It fetches that page, then runs the installer in the mode the page names, `--yes --domain yourdomain.com` or `--yes --no-domain`. The `--yes` is what makes the run ask nothing, and the installer refuses to run with it unless one of those 2 address options is present.

From there the script installs Docker when the command is missing, creates `/opt/linkedgrow`, reads the memory of the machine to choose `WORKER_SLOTS`, pulls the app, worker and database images, starts everything, and waits up to 3 minutes for the app to answer its health check. It writes no secret and no address: the app generates its own signing and encryption keys on the first start and answers on whatever address the request came in on. With a domain it also starts Caddy, which fetches the certificate on its own. The whole run is 2 or 3 minutes on a normal connection, most of it spent pulling the worker image.

## What it must never do

Write its own values for `AUTH_SECRET` or `ENCRYPTION_KEY`. The app generates both inside the container on its first start, and an agent inventing them tends to invent something short.

Change `ENCRYPTION_KEY` after the first start. Every stored credential is encrypted with it and none of them survives a new value. It lives in the `config` volume, which is the one thing a backup must not miss.

Put an AI key, a LinkedIn password or a proxy credential into a `.env`. Those are yours, they belong in the wizard, and no key of the agent's own has any business on your server.

Print the secrets file, or a `.env`, into a chat or a log. They exist, and that is all a transcript needs to say about them.

Create the first account on the instance. Whoever creates it becomes the administrator, and that has to be a person rather than an assistant.

## Checking it worked

3 commands, in the stack folder:

```
cd /opt/linkedgrow
docker compose ps
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/api/health
```

`docker compose ps` lists 3 services, plus Caddy when you gave a domain. The app says healthy, the database and the worker say up, and the health check answers `200`. Use the port from `--port` in that last command when you asked for one other than 3000. Anything else means the stack is not ready, and `docker compose logs app` says why.

Then open the address the installer printed. A sign up form means the install is done.

## What you do by hand

The agent stops here on purpose, and the rest takes about 10 minutes.

Create the first account with an email and a password. That account administers the instance and is the only one that can run the wizard.

Walk through the wizard: the instance name and address, the AI key your agents will think with, how you get one dedicated address per LinkedIn account, an optional email provider, and where uploaded files should live. Each step is covered on the [setup wizard](/docs/self-hosting/setup-wizard) page.

Connect your LinkedIn account with its email, its password and a 2FA code when you use one, and pick the country its dedicated address should sit in. Then create your first agent, which is the screen the wizard hands you.
