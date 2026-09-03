# Install LinkedGrow on a server

LinkedGrow finds leads and clients on LinkedIn with AI agents that drive a real Chrome signed in to the user's own account, and it also writes and schedules their posts. This page is written for an AI agent with shell access to the server that will run it. Follow the steps in order and stop at the first command that fails, then report the failing line to the person who asked.

## What the server needs

Linux on amd64, reachable over ssh, with root or sudo. Google Chrome ships for amd64 only on Linux, so an arm64 server runs Chromium instead, which is fine for a trial and not for production. It needs 4 GB of RAM for 2 concurrent browsers and 16 GB for 12, about 10 GB of free disk for the images and the browser profiles, and Docker with the Compose plugin. The installer installs Docker from get.docker.com when the command is missing.

For https, point a domain at the server with an A record and leave ports 80 and 443 free. Without a domain the app answers on the server address over plain http, on port 3000.

The person also needs an AI key from Anthropic, OpenAI, Google, Grok or Kimi, and a way to buy one dedicated address per LinkedIn account, usually a Proxy-Seller account. Neither of those belongs in the install command. The wizard asks for them in the browser once the stack runs.

## The command

With a domain, over https:

```
curl -fsSL https://raw.githubusercontent.com/DigiHold/LinkedGrow/main/install.sh | sh -s -- --yes --domain linkedgrow.example.com
```

Without a domain, on the server address over http:

```
curl -fsSL https://raw.githubusercontent.com/DigiHold/LinkedGrow/main/install.sh | sh -s -- --yes --no-domain
```

`--yes` is what makes the run non interactive, and it needs either `--domain` or `--no-domain`. A run without one of them asks the domain question on the terminal and fails when there is no terminal to ask it on.

| Option | What it does |
| --- | --- |
| `--domain NAME` | Serves on that domain over https, with the Caddy that ships in the compose file. |
| `--no-domain` | Serves on the server address over http, on the port below. |
| `--dir PATH` | Where the stack lives. Default `/opt/linkedgrow` |
| `--version TAG` | Image tag to run: `latest`, a release like `v1.0.0`, or `sha-1a2b3c4`. Default `latest` |
| `--port NUMBER` | Port the app is published on. Default `3000` |
| `--source` | Builds the images from the source instead of pulling them, which takes about 10 minutes. |

The run takes 2 or 3 minutes on a normal connection, most of it spent pulling the worker image. It ends by printing the address to open.

## What the installer does

In this order, stopping at the first failure:

1. Installs Docker from get.docker.com when the `docker` command is missing, on an apt or dnf based distribution only.
2. Creates the stack folder, `/opt/linkedgrow` unless `--dir` says otherwise, and puts `docker-compose.yml`, the `Caddyfile` and a copy of `install.sh` in it.
3. Writes `.env` with mode 600, holding a fresh `AUTH_SECRET` and `ENCRYPTION_KEY`, the address the app answers on, and a `WORKER_SLOTS` it chose by reading the memory of the machine: 2 below 8 GB, 4 at 8 GB, 8 at 16 GB. An `.env` that already exists is kept as it is.
4. Warns, without stopping, when the domain resolves somewhere other than this server, because Caddy cannot get a certificate until the A record is right.
5. Pulls the app, worker and database images and starts the containers, plus Caddy when a domain was given.
6. Polls `/api/health` for up to 3 minutes, then prints the address to open. If the app never answers it prints the last 50 lines of the app log and stops with the stack still running.

## Check that it worked

```
cd /opt/linkedgrow
docker compose ps
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/api/health
```

`docker compose ps` lists 3 services, plus Caddy when you gave a domain. The app says healthy, the worker and the database say up, and the health check answers `200`. Use the number you passed to `--port` in that last command when it was not 3000. Anything else means the stack is not ready, and `docker compose logs app` says why.

## What you must not do

Never write your own values for `AUTH_SECRET` and `ENCRYPTION_KEY`. The installer generates both and writes them into `.env`, where the app reads them.

Never change `ENCRYPTION_KEY` after the first start. Every stored credential is encrypted with it, and a new value makes all of them unreadable for good, with no way back.

Never put an AI key, a LinkedIn password or a proxy credential of your own into `.env`. Those belong to the person, and they enter them in the wizard.

Never print the contents of `.env` into a chat or a log. Say that the file exists and move on.

Never create the first account yourself. The first account created on the instance becomes its administrator, and that has to be the person, not you.

## What happens next

The person opens the address the installer printed and creates an account with an email and a password. That first account administers the instance and is the only one that can run the wizard. The wizard then asks for an AI key, for how they buy one dedicated address per LinkedIn account, for an optional email provider, and for where uploaded files should live. Everything it asks for can be changed later in Settings, Instance.

## Update and uninstall

The update pulls the current images and restarts the stack, keeping `.env` and the 3 volumes:

```
cd /opt/linkedgrow && ./install.sh update
```

The uninstall removes the containers and every volume, which deletes the database, the uploaded files and the signed in browser profiles. Ask the person before you run it:

```
cd /opt/linkedgrow && docker compose down -v && rm -rf /opt/linkedgrow
```

## When something fails

Pulling the images fails while the repository is private. Sign in first with `docker login ghcr.io` using a GitHub token that carries the `read:packages` scope, or install with `--source` to build the images on the server.

Caddy cannot get a certificate until the domain resolves to this server. The installer warns about it and starts anyway, so fix the A record and run `docker compose restart caddy` in the stack folder.

Ports 80 and 443 must be free for Caddy. When another web server holds them, either stop it, or install with `--no-domain` and put the existing server in front of port 3000 yourself.
