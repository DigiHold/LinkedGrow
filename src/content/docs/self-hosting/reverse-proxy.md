---
title: Reverse proxy
description: The Caddy that ships with the stack, an external Caddy or nginx in front of it, APP_URL on https, and why the cookies care
category: self-hosting
order: 7
---

Anything reachable from the internet should answer over https. The stack can do that itself, and it can also sit behind the proxy you already run.

## The Caddy in the stack

Give the installer a domain and it writes 3 lines into `.env`, then starts a Caddy container next to the app:

```
APP_URL=https://linkedgrow.example.com
DOMAIN=linkedgrow.example.com
COMPOSE_PROFILES=https
```

Caddy takes ports 80 and 443, gets the certificate from Let's Encrypt on its first start, renews it on its own, and forwards everything to the app over the internal network. `APP_BIND=127.0.0.1` in the same file keeps the app's own port on the loopback address, so nothing reaches it except through Caddy. The whole configuration is the `Caddyfile` next to the compose file, 4 lines long, and it reads the domain from `DOMAIN`.

The certificate needs the domain to resolve to this server before Caddy asks for it. When the A record is added later, `docker compose restart caddy` picks it up.

## An external Caddy

To use a proxy you already run, leave `COMPOSE_PROFILES` empty so the Caddy container stays out of the way, keep `APP_BIND=127.0.0.1` and point your own configuration at port 3000:

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

`client_max_body_size` matters because nginx caps request bodies at 1 MB by default, which is smaller than most images people attach to a post. The forwarded headers let the app see the original host and scheme.

## APP_URL follows the proxy

Whatever sits in front, `APP_URL` is the address people type, and the app builds every session, redirect and link from it. Change it in `.env` and run `docker compose up -d` again, and use the same address in the wizard's first step.

## The cookie note

When `APP_URL` starts with `https://`, the session cookie carries the Secure flag and the `__Secure-` prefix, so a browser only sends it over https. Opening the instance over plain http at that point, on port 3000 directly for example, makes the browser refuse the cookie, and the sign in never sticks. The reverse is also true: with `APP_URL` on http the cookie has no Secure flag, and a proxy that adds https in front works but leaves the cookie sendable in clear. Keep the 2 in agreement, and reach the instance through the proxy only.

## Firewall

Once a proxy is in place, leave ports 80 and 443 open and close 3000 to the outside. With `APP_BIND=127.0.0.1`, which the installer writes whenever you give it a domain, the app port is already unreachable from another machine. The database and the worker publish no ports, so nothing else needs a rule.
