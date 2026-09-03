---
title: Requirements
description: The host and the architecture, the memory each concurrent browser needs, the disk the volumes take, the ports the stack opens, what it calls out to, and what you bring yourself
category: self-hosting
order: 1
---

## The host

LinkedGrow is built for Linux on amd64. On amd64 the worker image installs Google Chrome, which is the browser LinkedIn expects to see. On any other architecture it installs Chromium instead and the entrypoint points `CHROME_PATH` at it. Chromium works, and LinkedIn can tell it apart from Chrome more easily, so an arm64 board is a way to try the product rather than a place to run it for real. The `latest` tag is built for amd64 only, while release tags carry an arm64 image as well.

Docker with the Compose plugin is the only software you install yourself, and the installer does even that for you on an apt or dnf based distribution by running the official script from get.docker.com. On anything else it stops and asks you to install Docker Engine first. The `curl` command has to exist before you start, and the whole run needs root or a working `sudo`.

## Memory

Memory is the number that decides the shape of your install, because the memory goes to the browsers. `WORKER_SLOTS` in `.env` says how many LinkedIn browsers the worker may keep open at the same time, and the compose file hands the worker 2 GB of shared memory for them on top of whatever the host has.

| Concurrent browsers | Memory on the host |
| --- | --- |
| 2 | 4 GB |
| 12 | 16 GB |

The installer does not aim for the top of that range. It reads the machine and writes `WORKER_SLOTS=2` below 8 GB, `4` at 8 GB and `8` at 16 GB, which leaves the app, the database and everything else on the box some air. Raise the number in `.env` yourself when the machine has nothing else to do.

Nothing in the stack asks for a set number of processor cores. Chrome is what spends them, one browser per busy slot, so the count that sized your memory also sizes your processor.

## Disk

About 10 GB of free disk is enough to begin with. Most of that goes to the worker image, which carries a whole browser, and the rest to the volumes the stack keeps.

| Volume | What is in it | What makes it grow |
| --- | --- | --- |
| `db-data` | The libSQL database file | Your leads, your posts and their history |
| `uploads` | Files attached to posts | Whatever you attach |
| `profiles` | One signed in Chrome profile for every LinkedIn account | Each account you connect, and then its own cache and cookies |

Two more volumes, `caddy-data` and `caddy-config`, appear when the built in https is switched on. They hold the certificate and none of your data.

## Ports

The app publishes one port, `3000` unless `APP_PORT` says otherwise, bound to `127.0.0.1` unless `APP_BIND` says otherwise. On the loopback address it is reachable only by a reverse proxy running on the same machine. The installer writes `APP_BIND=0.0.0.0` when you run it without a domain, which is what opens that port to the network.

Caddy takes ports 80 and 443, and only when `COMPOSE_PROFILES=https` is in `.env`. Give the installer a domain and it writes that line for you, so both ports have to be free before you start.

The database and the worker publish nothing at all. The database answers at `http://db:8080` on the network Compose creates, and that network exists only between the containers.

## What it calls out to

Almost all of it is ordinary outbound https, and 2 of the destinations care which address the request comes from.

Your AI provider is called on every agent pass and every generation. Proxy-Seller's API is called from the app and from the worker, and it answers only a server whose address you added to the allowlist in their dashboard; that address is your server's own public IPv4, and the dedicated IP step of the wizard shows you the one it sees. LinkedIn is never called directly, because each account's browser goes out through the dedicated address bought for that account. Your email provider is called when you configure one, either Resend over https or your own SMTP server on the port you gave it. The registry at ghcr.io is called at install and at every update. Let's Encrypt is called by Caddy while it holds your certificate, and your bucket endpoint is called instead of the local disk when you chose S3 compatible storage.

The app also asks api.ipify.org for its own public address, which is how the wizard can show you the value Proxy-Seller wants on its allowlist.

## What you bring

An address people can open, which means a domain with an A record pointing at the server. That gets you https from the Caddy inside the stack, and without one the app answers on the server's own address over plain http.

An AI key, from Anthropic, OpenAI, Google, Grok or Kimi. That single key runs every agent on the instance, and the wizard copies it into your own AI settings so the post generator works for you from the first day. Everyone else on the instance adds a key of their own in Settings before the generator will answer them. The wizard refuses to finish without it.

A source of one dedicated address per LinkedIn account. LinkedGrow buys them through your own Proxy-Seller account when you paste that account's API key, in the country you pick as you connect each account, and you can bring proxies you already own instead. The wizard lets you skip the step, but no agent starts until an address exists.

The LinkedIn account itself, with its password and its 2FA code when you have one switched on. There is no LinkedIn app to authorise anywhere in the flow, because the product does not use LinkedIn's API.

## What is optional

An email provider, Resend or any SMTP server, for the notifications: a lead replied, LinkedIn asked for a verification code, an agent stopped, the weekly list of people it found. Everything still shows in the dashboard without one.

S3 compatible storage, such as Cloudflare R2 or MinIO, for when you would rather files did not sit on the server. The local disk is the default and it is the right answer for a single machine.