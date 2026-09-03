---
title: Reverse proxy
description: The 3 ways to put the instance behind a certificate, the Caddy that ships with the stack, an external Caddy or nginx in front of it, and what the app does with the forwarded headers
category: self-hosting
order: 7
---

A fresh install answers on the server address over plain http, on port 3000, and that is enough to sign in and set the instance up. Anything reachable from the internet should answer over https, and there are 3 ways to get there. Nothing in the app changes for any of them: it reads the address and the scheme off each request, so the same container serves http today and https tomorrow with no edit and no rebuild.

## The Caddy in the stack

The compose file carries a Caddy service that stays out of the way until you ask for it. Give the installer a domain and it sets it up for you. By hand, fetch the configuration next to the compose file and write 3 lines into a `.env` there:

```
curl -fsSL https://raw.githubusercontent.com/DigiHold/LinkedGrow/main/docker/Caddyfile -o Caddyfile
```

```
DOMAIN=linkedgrow.example.com
COMPOSE_PROFILES=https
APP_BIND=127.0.0.1
```

Run `docker compose up -d` after that and Caddy joins the stack. It takes ports 80 and 443, gets the certificate from Let's Encrypt on its first start, renews it on its own, and forwards everything to the app over the internal network. `APP_BIND=127.0.0.1` moves the app's own port back to the loopback address, so nothing reaches it except through Caddy. The whole configuration is that `Caddyfile`, 4 lines long, and it reads the domain from `DOMAIN`.

The certificate needs the domain to resolve to this server before Caddy asks for it. When the A record is added later, `docker compose restart caddy` picks it up.

## An external Caddy

To use a proxy you already run, leave `COMPOSE_PROFILES` empty so the Caddy container stays out of the way, set `APP_BIND=127.0.0.1` and point your own configuration at port 3000:

```
linkedgrow.example.com {
    reverse_proxy localhost:3000
}
```

## nginx

With a certificate from Let's Encrypt in the usual place:

```
server {
    listen 443 ssl;
    server_name linkedgrow.example.com;
    ssl_certificate /etc/letsencrypt/live/linkedgrow.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/linkedgrow.example.com/privkey.pem;
    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

`client_max_body_size` matters because nginx caps request bodies at 1 MB by default, which is smaller than most images people attach to a post. `X-Forwarded-Proto` and the host headers are what the app reads, so keep both lines.

## The 2 headers the app reads

Whatever sits in front, the app builds every page, redirect and cookie from `X-Forwarded-Host` and `X-Forwarded-Proto`, falling back to the `Host` header when a proxy sets neither. Caddy sends both without being asked and the nginx block above sets them explicitly. A proxy that sends neither leaves the app answering on the internal name it was reached by, and the sign in redirects go to the wrong place.

The session cookie follows the same reading. Reached over https it carries the Secure flag and the `__Secure-` prefix, so the browser sends it back over https only. Reached over plain http it carries neither, which is what lets a fresh install sign in on port 3000 before any certificate exists. Nothing has to be told which of the 2 it is, and moving from one to the other needs no edit.

Emails are the one thing that cannot read a request. Their links use the address stored in the wizard's first step, so set that to the address people actually type, and update it under Settings, Instance the day the domain changes.

## Pinning the address instead

Set `APP_URL` in `.env` and everything, emails included, uses that value and reads no header at all:

```
APP_URL=https://linkedgrow.example.com
```

That is the answer for a proxy chain that rewrites hosts in a way you do not control. On plain http remember to keep the scheme as `http://`, because a cookie marked Secure never comes back over a connection that is not.

## Firewall

Once a proxy is in place, leave ports 80 and 443 open and close 3000 to the outside. `APP_BIND=127.0.0.1`, which the installer writes whenever you give it a domain, makes the app port unreachable from another machine. The database and the worker publish no ports, so nothing else needs a rule.
