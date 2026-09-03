---
title: Architecture
description: The 4 services in the compose file, what each one does, which one touches LinkedIn, the volumes they share, where the credentials are encrypted, and who runs the schedule
category: self-hosting
order: 5
---

A LinkedGrow install is 4 containers on one machine, and only 2 of them do anything interesting. The app serves the dashboard and the API, the worker drives the browsers, the database sits under both of them, and Caddy is there only when you asked the stack to handle https itself.

```
        people
          |
          |  https on 443, when caddy is switched on
          v
    +-----------+         +------------------------------+
    |   caddy   | ------> |             app              | <--------+
    +-----------+  3000   |  dashboard, API, migrations  |          |
                          +------------------------------+          |
                                        |                           |
                         http://db:8080 |                           | http://app:3000
                                        v                           | health wait and
                          +------------------------------+          | scheduled jobs
                          |              db              |          |
                          |   libsql, one database file  |          |
                          +------------------------------+          |
                                        ^                           |
                         http://db:8080 |                           |
                          +------------------------------+          |
                          |            worker            | ---------+
                          |  one chrome per LinkedIn     |
                          |  account, under Xvfb         |
                          +------------------------------+
                                        |
                                        |  the account's own dedicated address
                                        v
                                     LinkedIn
```

## app

The Next.js application, published on port 3000, and the only container with a port you reach. It serves the dashboard, the API, the docs you are reading and the files under `/uploads` when storage is the local disk.

Its entrypoint runs before the server does, and it refuses to start on a bad configuration rather than starting badly. It checks that `AUTH_SECRET` is no longer the placeholder, that `ENCRYPTION_KEY` is exactly 64 hex characters, that `APP_URL` is set and that the uploads directory is writable. Then it applies every database migration the database has not recorded yet, and only then does it listen. Compose watches `/api/health` and calls the container healthy once that answers, which gives the migrations up to 90 seconds before anything starts counting failures.

## worker

A Node process that opens one persistent Chrome per connected LinkedIn account, headful under an Xvfb display at 1920x1080, signed in with the credentials that account gave the app, and going out through the dedicated address reserved for it. `WORKER_SLOTS` caps how many of those browsers exist at once, and the slot is taken per LinkedIn account, so 2 loops can never fight over the same browser.

It runs 5 loops against the same database the app writes to. The agents pass every 5 minutes, the publishing pass every minute, the connect pass every 8 seconds for an account waiting to be signed in, the insights pass every 30 minutes to read back what LinkedIn shows on your posts, and the cron pass every minute to see whether a scheduled job is due. Every action inside those loops moves at a human pace, through a mouse and keyboard model rather than by script, and the safety code stops an account rather than pushing through a checkpoint.

The worker waits for the app before it starts. Its entrypoint polls `${APP_INTERNAL_URL}/api/health` until the app answers, which is also how it avoids running against a database that is behind the code.

## db

A libSQL server, the same engine the hosted edition uses, with its data in the `db-data` volume at `/var/lib/sqld/iku.db`. It publishes no port and answers only at `http://db:8080` inside the Compose network. The app and the worker both connect to it with an empty auth token, because nothing outside those containers can reach it.

Migrations are numbered SQL files inside the app image, applied at boot and recorded in a `schema_migrations` table, so the same file never runs twice. There is no separate migration step for you to run.

## caddy

Only present when `COMPOSE_PROFILES=https` is in `.env`, which is what the installer writes when you give it a domain. It takes ports 80 and 443, reads your domain from `DOMAIN`, gets the certificate from Let's Encrypt, renews it on its own and forwards everything to the app over the internal network. Its whole configuration is the 4 line `Caddyfile` next to the compose file. Leave the profile empty when you already run a proxy of your own, and the container never starts.

## The app queues, the worker acts

Nothing the app does reaches LinkedIn. Pressing Publish writes a row and returns; the worker reads that row, opens the account's browser, types the post into the composer, publishes it or hands it to LinkedIn's own scheduler, then goes and reads it back off your activity to confirm. When it cannot find the post afterwards it still marks it published and leaves you a note to check, because posting again on a doubt publishes twice. Starting an agent works the same way, and so does connecting an account.

This is why a 200 from the app never means published, why a scheduled post survives a worker restart, and why the dashboard shows you a status that moves rather than a result that arrives instantly.

## What they share

The database is the first shared thing, and it is how the app and the worker talk at all. The `uploads` volume is the second: both containers mount it at `/data/uploads`, which is why the worker can attach an image the browser uploaded through the app. Both images run as the same fixed user and group, `10001`, precisely so that shared volume has one owner rather than 2.

The `profiles` volume belongs to the worker alone. One directory per LinkedIn account holds that account's signed in Chrome profile, which is what keeps a session alive between passes instead of signing in again every time.

## Where the credentials live

Every credential stored in the database is encrypted with `ENCRYPTION_KEY` from `.env`: the LinkedIn passwords, the LinkedIn 2FA secrets, the AI key the agents run on, the proxy supplier key, the email password, the S3 keys, the AI keys individual users add for their own writing, and the shared secret the worker signs its scheduled calls with. The one value that is not a credential and is not encrypted is the TOTP secret behind two factor on a LinkedGrow account, which sits in the users table as plain text, so a stolen copy of the database is enough to generate codes for an account that uses it. The app and the worker both read that one `.env` through `env_file`, so the 2 sides always hold the same key.

Change it after the first start and none of that is readable again, by anybody, ever. There is no recovery path and no second copy. It is the one line of your configuration that deserves a backup somewhere the server is not.

## Who runs the schedule

On a self hosted instance the worker is the scheduler. Its cron pass ticks every minute, works out what is due from the last run it recorded in the database, and calls the app over `http://app:3000` with the instance's own cron secret in a header. The app checks that header before it does anything. The hosted edition uses a queue service for the same jobs, and the code picks the branch from the edition rather than from configuration you have to set.

| Job | How often |
| --- | --- |
| Agent alerts | Every 15 minutes |
| Proxy watchdog, selector health, media cleanup | Once a day |
| Dedicated address renewal, supplier balance check | Once a day, inside the worker itself |
| The leads digest email | Monday morning, in the timezone the wizard set |

The 2 daily jobs that run inside the worker rather than through the app are the ones that talk to the proxy supplier, and they are skipped quietly while no supplier key is stored.
