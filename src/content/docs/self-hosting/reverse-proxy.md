---
title: Reverse proxy
description: Caddy and nginx in front of the app, APP_URL on https, and why the cookies care
category: self-hosting
order: 3
---

The app container publishes port 3000 in plain http. Anything reachable from the internet should sit behind a reverse proxy that terminates https, and 2 settings make that work: `APP_URL` in `.env` set to the https address, and a proxy that forwards the original host name.

## APP_URL first

Set `APP_URL=https://linkedgrow.example.com` in `.env` before the first start, or change it and run `docker compose up -d` again. The app builds every session, redirect and link from this value, and the address in the wizard's first step should be the same.

## Caddy

Caddy obtains and renews the certificate on its own. The whole configuration is 3 lines:

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

## The cookie note

When `APP_URL` starts with `https://`, the session cookie carries the Secure flag and the `__Secure-` prefix, so a browser only sends it over https. Opening the instance over plain http at that point, on port 3000 directly for example, makes the browser refuse the cookie, and the sign in never sticks. The reverse is also true: with `APP_URL` on http the cookie has no Secure flag, and a proxy that adds https in front works but leaves the cookie sendable in clear. Keep the 2 in agreement, and reach the instance through the proxy only.

## Firewall

Once the proxy is in place, close port 3000 to the outside and leave 80 and 443 open. The database and the worker publish no ports, so nothing else needs a rule.
